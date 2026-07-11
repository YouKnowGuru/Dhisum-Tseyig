import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { rotateRefreshToken, verifyAccessToken } from '@/lib/auth/tokens'
import { generateDeviceFingerprint } from '@/lib/auth/device'
import { z } from 'zod'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
  deviceId: z.string().optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    platform: z.string().optional(),
    hardwareConcurrency: z.number().optional(),
    deviceMemory: z.number().optional(),
  }).optional(),
})

// Rate limiting for refresh attempts
const refreshAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRefreshRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = 5 * 60 * 1000 // 5 minutes
  const maxAttempts = 10

  const record = refreshAttempts.get(identifier)

  if (!record || now > record.resetTime) {
    refreshAttempts.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

/**
 * POST /api/auth/refresh
 * Rotate refresh token and issue new access token
 * Detects token reuse attacks
 */
export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = clientIp

  try {
    // Rate limiting
    const rateLimit = checkRefreshRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many refresh attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      )
    }

    const body = await req.json()
    const validated = refreshSchema.parse(body)

    await connectDB()

    // Generate device fingerprint if info provided
    let deviceFingerprint: string | undefined
    if (validated.deviceInfo) {
      const { fingerprint } = generateDeviceFingerprint(validated.deviceInfo)
      deviceFingerprint = fingerprint
    }

    // Attempt token rotation
    const result = await rotateRefreshToken(
      validated.refreshToken,
      deviceFingerprint
    )

    if (!result) {
      // Token reuse detected or invalid token
      // Clear rate limit since this is a security event
      refreshAttempts.delete(rateLimitKey)

      console.warn(`[SECURITY] Token reuse detected or invalid refresh from ${clientIp}`)

      return NextResponse.json(
        {
          success: false,
          error: 'Session expired. Please log in again.',
          requiresReauth: true,
        },
        { status: 401 }
      )
    }

    // Clear rate limit on successful refresh
    refreshAttempts.delete(rateLimitKey)

    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Token refresh error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/refresh
 * Returns 405 - use POST instead to avoid token leakage in URL logs
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Use POST method for token refresh' },
    { status: 405 }
  )
}
