import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import License from '@/lib/models/License'
import Token from '@/lib/models/Token'
import PosUser from '@/lib/models/PosUser'
import Session from '@/lib/models/Session'
import { licenseKeySchema } from '@/lib/validation/schemas'
import { licenseRateLimit } from '@/lib/rate-limit/rate-limit'
import { sendLicenseOTPEmail } from '@/lib/email/email'
import {
  logLicenseActivated,
  logLicenseTransferred,
  logSuspiciousActivity,
} from '@/lib/audit/auditLogger'
import { createSession, getTokenExpiryTimes } from '@/lib/auth/tokens'
import { generateDeviceFingerprint } from '@/lib/auth/device'
import { ZodError } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Rate limiting for license verification
const licenseVerifyAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 10

  const record = licenseVerifyAttempts.get(identifier)

  if (!record || now > record.resetTime) {
    licenseVerifyAttempts.set(identifier, { count: 1, resetTime: now + windowMs })
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
 * Hash token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = clientIp

  try {
    // Apply rate limiting
    const rateLimitResponse = await licenseRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Check additional rate limiting
    const rateLimit = checkRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Too many attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) },
        }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = licenseKeySchema.parse(body)
    const { licenseKey, deviceId, otp, activationSecret } = validatedData

    // Connect to database
    await connectDB()

    // Find license
    const license = await License.findOne({ licenseKey: licenseKey.toUpperCase() })

    if (!license) {
      return NextResponse.json(
        {
          valid: false,
          message: 'License not found',
        },
        { status: 404 }
      )
    }

    // Check if license is suspended
    if (license.status === 'suspended') {
      await logSuspiciousActivity({
        email: license.email,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'unknown',
        activity: 'attempted_use_suspended_license',
        details: { licenseKey: licenseKey.toUpperCase() },
      })

      return NextResponse.json(
        {
          valid: false,
          message: 'License has been suspended',
        },
        { status: 403 }
      )
    }

    // Check if license is expired
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      license.status = 'expired'
      await license.save()

      return NextResponse.json(
        {
          valid: false,
          message: 'License has expired',
        },
        { status: 403 }
      )
    }

    // Device locking logic
    let isFirstActivation = false

    if (!license.deviceId) {
      // 1. First activation - bind device
      if (deviceId) {
        license.deviceId = deviceId
        license.activationSecret = crypto.randomUUID()
        license.activationDate = new Date()
        license.activationCount = 1
        license.status = 'active'
        isFirstActivation = true
        await license.save()

        // Log first activation
        await logLicenseActivated({
          email: license.email,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'unknown',
          deviceId,
          details: {
            licenseKey: licenseKey.toUpperCase(),
            plan: license.plan,
          },
        })
      } else {
        return NextResponse.json(
          { valid: false, message: 'Device ID required for first activation' },
          { status: 400 }
        )
      }
    } else if (
      deviceId &&
      license.deviceId === deviceId &&
      activationSecret &&
      license.activationSecret === activationSecret
    ) {
      // 2. Existing device + Valid Secret - normal re-handshake
      if (license.status === 'inactive' || license.status === 'expired') {
        license.status = 'active'
      }

      // Update activation count
      license.activationCount += 1
      await license.save()
    } else if (deviceId) {
      // 3. Different device OR recovery flow
      const { password } = body

      // Check monthly transfer limits
      const now = new Date()
      const oneMonthAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate())
      )

      // Reset count if last transfer was more than a month ago
      if (license.lastTransferAt && license.lastTransferAt < oneMonthAgo) {
        license.monthlyTransferCount = 0
      }

      if (license.monthlyTransferCount >= 2) {
        return NextResponse.json(
          {
            valid: false,
            message:
              'Monthly transfer limit reached (2/month). Please contact support for manual reset.',
            error: 'LIMIT_REACHED',
          },
          { status: 403 }
        )
      }

      // If OTP is provided, verify it
      if (otp) {
        const otpHash = hashToken(otp)

        const tokenDoc = await Token.findOne({
          licenseId: license._id,
          token: otpHash,
          type: 'license-otp',
          expiresAt: { $gt: new Date() },
        })

        if (!tokenDoc) {
          return NextResponse.json(
            {
              valid: false,
              message: 'Invalid or expired verification code.',
              error: 'INVALID_OTP',
            },
            { status: 400 }
          )
        }

        // OTP Valid! Perform Transfer
        const oldDeviceId = license.deviceId
        license.deviceId = deviceId
        license.activationSecret = crypto.randomUUID()
        license.monthlyTransferCount += 1
        license.lastTransferAt = new Date()
        license.status = 'active'
        await license.save()

        // Log transfer
        await logLicenseTransferred({
          email: license.email,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'unknown',
          deviceId,
          details: {
            licenseKey: licenseKey.toUpperCase(),
            oldDeviceId,
            newDeviceId: deviceId,
            transfersThisMonth: license.monthlyTransferCount,
          },
        })

        // Delete the used token
        await Token.deleteOne({ _id: tokenDoc._id })

        // Clear rate limit on success
        licenseVerifyAttempts.delete(rateLimitKey)

        return NextResponse.json({
          valid: true,
          isFirstActivation: false,
          message: 'License successfully transferred to this device.',
          plan: license.plan,
          expiryDate: license.expiryDate,
          customerName: license.customerName,
          companyName: license.companyName,
          transfersRemaining: 2 - license.monthlyTransferCount,
        })
      }

      // If no OTP, verify credentials first
      if (!password) {
        const isSameDeviceReset = license.deviceId === deviceId
        return NextResponse.json(
          {
            valid: false,
            message: isSameDeviceReset
              ? 'Security Notice: Local activation data is missing. Please verify your identity with your account password.'
              : 'Identity verification required. Please enter your account password.',
            error: 'CREDENTIALS_REQUIRED',
            email: `${license.email.substring(0, 3)}***@${license.email.split('@')[1]}`,
            transfersRemaining: 2 - license.monthlyTransferCount,
          },
          { status: 401 }
        )
      }

      // Verify Password
      const user = await PosUser.findOne({ email: license.email.toLowerCase() })
      if (!user) {
        return NextResponse.json(
          {
            valid: false,
            message: 'No registered user found for this license email.',
            error: 'USER_NOT_FOUND',
          },
          { status: 404 }
        )
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password)
      if (!isPasswordCorrect) {
        return NextResponse.json(
          {
            valid: false,
            message: 'Incorrect account password. Access denied.',
            error: 'INVALID_CREDENTIALS',
          },
          { status: 401 }
        )
      }

      // Password Correct! Generate and Send OTP
      const generatedOtp = crypto.randomInt(100000, 999999).toString()
      const otpHash = hashToken(generatedOtp)

      // Delete old tokens
      await Token.deleteMany({ licenseId: license._id, type: 'license-otp' })

      // Save new OTP
      try {
        await Token.create({
          licenseId: license._id,
          token: otpHash,
          type: 'license-otp',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        })
      } catch (saveError: any) {
        console.error('[OTP] Failed to save:', saveError.message)
        return NextResponse.json(
          {
            valid: false,
            message: 'Failed to generate verification code. Please try again.',
            error: 'OTP_SAVE_FAILED',
          },
          { status: 500 }
        )
      }

      // Send Email
      await sendLicenseOTPEmail(license.email, generatedOtp, license.licenseKey)

      return NextResponse.json(
        {
          valid: false,
          message: 'Identity verified. A verification code has been sent to your email.',
          error: 'OTP_REQUIRED',
          email: `${license.email.substring(0, 3)}***@${license.email.split('@')[1]}`,
        },
        { status: 202 }
      )
    }

    // License is valid - create session if user exists
    let tokens = null
    const user = await PosUser.findOne({ email: license.email.toLowerCase() })

    if (user && user.isVerified) {
      // Get device info for fingerprinting
      const deviceInfo = body.deviceInfo || {}
      const { fingerprint } = generateDeviceFingerprint(deviceInfo)

      // Create session
      const sessionTokens = await createSession(
        user._id.toString(),
        deviceId,
        fingerprint,
        clientIp,
        req.headers.get('user-agent') || 'unknown'
      )

      tokens = {
        accessToken: sessionTokens.accessToken,
        refreshToken: sessionTokens.refreshToken,
        expiresAt: sessionTokens.expiresAt.toISOString(),
      }

      // Update user's license and device
      await PosUser.findByIdAndUpdate(user._id, {
        $set: {
          licenseKey: license.licenseKey,
          deviceId: deviceId,
          deviceFingerprint: fingerprint,
          accountStatus: 'active',
        },
      })
    }

    // CRITICAL FIX: Validate user count against license plan limits
    const maxUsers = license.maxUsers || 1
    const activeUserCount = await PosUser.countDocuments({
      accountStatus: { $in: ['active', 'trial'] },
    })

    let userLimitWarning = null
    if (activeUserCount > maxUsers) {
      userLimitWarning = {
        currentUsers: activeUserCount,
        maxAllowed: maxUsers,
        exceeded: true,
        message: `Your ${license.plan} plan allows ${maxUsers} user(s) but you have ${activeUserCount}. Please upgrade your plan or deactivate users.`,
      }

      console.warn(
        `[License] User limit exceeded for ${license.email}: ${activeUserCount}/${maxUsers}`
      )
    }

    // Clear rate limit on success
    licenseVerifyAttempts.delete(rateLimitKey)

    return NextResponse.json({
      valid: true,
      isFirstActivation,
      // SECURITY FIX: Only return activationSecret on first activation
      activationSecret: isFirstActivation ? license.activationSecret : undefined,
      plan: license.plan,
      maxUsers: maxUsers,
      expiryDate: license.expiryDate ? license.expiryDate.toISOString() : null,
      customerName: license.customerName,
      companyName: license.companyName,
      message: 'License verified successfully',
      tokens,
      tokenExpiry: tokens ? getTokenExpiryTimes() : null,
      userLimit: maxUsers,
      activeUserCount,
      userLimitWarning,
    })
  } catch (error) {
    console.error('License verification error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple checks
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await licenseRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const licenseKey = req.nextUrl.searchParams.get('licenseKey')
    const deviceId = req.nextUrl.searchParams.get('deviceId')

    if (!licenseKey) {
      return NextResponse.json(
        {
          valid: false,
          message: 'License key is required',
        },
        { status: 400 }
      )
    }

    // Validate license key format
    const validatedData = licenseKeySchema.parse({
      licenseKey,
      deviceId: deviceId || undefined,
    })

    // Connect to database
    await connectDB()

    // Find license
    const license = await License.findOne({
      licenseKey: validatedData.licenseKey.toUpperCase(),
    })

    if (!license) {
      return NextResponse.json(
        {
          valid: false,
          message: 'License not found',
        },
        { status: 404 }
      )
    }

    // Check if license is active and not expired
    const isExpired = license.expiryDate && new Date(license.expiryDate) < new Date()
    const isActive = license.status === 'active' && !isExpired

    return NextResponse.json({
      valid: isActive,
      status: license.status,
      plan: license.plan,
      maxUsers: license.maxUsers || 1,
      expiryDate: license.expiryDate ? license.expiryDate.toISOString() : null,
      isExpired,
    })
  } catch (error) {
    console.error('License check error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid license key format',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
