import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'
import { createHash } from 'crypto'

// Redis client for distributed rate limiting
const getRedisClient = (): Redis | null => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    // Fallback to memory store if Redis not configured
    return null
  }

  try {
    if (process.env.REDIS_URL) {
      return new Redis(process.env.REDIS_URL)
    }
    
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
    })
  } catch (error) {
    console.error('[RateLimit] Failed to connect to Redis:', error)
    return null
  }
}

// Lazy initialization
let redisClient: Redis | null = null
const getRedis = (): Redis | null => {
  if (!redisClient) {
    redisClient = getRedisClient()
  }
  return redisClient
}

// In-memory fallback store (for when Redis is not available)
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const memoryStore: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

/**
 * Get client IP from request.
 * Uses the RIGHTMOST x-forwarded-for entry — the one appended by the trusted
 * edge/proxy (Vercel/Cloudflare) and the hardest for the client to spoof. The
 * leftmost value is fully client-controlled and can be rotated to evade limits.
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length > 0) {
      return parts[parts.length - 1]
    }
  }

  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Use a hash of user agent as fallback
  const userAgent = req.headers.get('user-agent') || 'unknown'
  return 'ua-' + userAgent.slice(0, 20)
}

/**
 * A stable fingerprint of the request that does NOT depend on the spoofable
 * client IP. Mixed into the rate-limit key so that rotating the
 * x-forwarded-for header cannot reset the limit window for the same client.
 */
function getRequestFingerprint(req: NextRequest): string {
  const ua = req.headers.get('user-agent') || ''
  const acceptLang = req.headers.get('accept-language') || ''
  const acceptEnc = req.headers.get('accept-encoding') || ''
  return createHash('sha256')
    .update(`${ua}|${acceptLang}|${acceptEnc}`)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Redis-based rate limiting with memory fallback
 */
async function checkRateLimitRedis(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const redis = getRedis()
  
  if (!redis) {
    // Fall back to memory store
    return checkRateLimitMemory(key, options)
  }
  
  try {
    const now = Date.now()
    const windowKey = `${key}:${Math.floor(now / options.windowMs)}`
    
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()
    pipeline.incr(windowKey)
    pipeline.pexpire(windowKey, options.windowMs)
    
    const results = await pipeline.exec()
    const count = results?.[0]?.[1] as number || 1
    
    if (count > options.maxRequests) {
      const retryAfter = Math.ceil(options.windowMs / 1000)
      return { allowed: false, retryAfter, remaining: 0 }
    }
    
    return { 
      allowed: true, 
      remaining: Math.max(0, options.maxRequests - count) 
    }
  } catch (error) {
    console.error('[RateLimit] Redis error:', error)
    // Fall back to memory store on Redis error
    return checkRateLimitMemory(key, options)
  }
}

/**
 * Memory-based rate limiting (fallback)
 */
function checkRateLimitMemory(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const now = Date.now()
  
  // Clean up expired entries
  if (memoryStore[key] && now > memoryStore[key].resetTime) {
    delete memoryStore[key]
  }
  
  // Initialize or increment counter
  if (!memoryStore[key]) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    }
  } else {
    memoryStore[key].count++
  }
  
  // Check if limit exceeded
  if (memoryStore[key].count > options.maxRequests) {
    const retryAfter = Math.ceil((memoryStore[key].resetTime - now) / 1000)
    return { allowed: false, retryAfter, remaining: 0 }
  }
  
  return { 
    allowed: true, 
    remaining: Math.max(0, options.maxRequests - memoryStore[key].count) 
  }
}

/**
 * Main rate limiting function
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 10 }
): Promise<NextResponse | null> {
  const ip = getClientIP(req)
  // Mix a spoof-resistant fingerprint into the key so an attacker cannot reset
  // their limit simply by rotating the x-forwarded-for header.
  const fingerprint = getRequestFingerprint(req)
  const key = `ratelimit:${ip}:${fingerprint}:${req.nextUrl.pathname}`

  const result = await checkRateLimitRedis(key, options)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(options.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + (result.retryAfter || 60)),
        },
      }
    )
  }
  
  return null
}

// Specific rate limiters for different endpoints
export async function licenseRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  })
}

export async function apiRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  })
}

export async function authRateLimit(req: NextRequest): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
  })
}

// Export for testing
export { getRedis }
