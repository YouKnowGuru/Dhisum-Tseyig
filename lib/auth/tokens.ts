import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Session, { ISessionModel } from '@/lib/models/Session'
import PosUser from '@/lib/models/PosUser'
import { Types } from 'mongoose'

// Token expiry times
const ACCESS_TOKEN_EXPIRY = 15 * 60 // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in ms
const PASSWORD_RESET_EXPIRY = 10 * 60 * 1000 // 10 minutes in ms

export interface AccessTokenPayload {
  userId: string
  email: string
  sessionId: string
  type: 'access'
  iat: number
  exp: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  sessionId: string
  expiresAt: Date
}

/**
 * Get JWT secret from environment with fail-closed security
 */
function getAccessTokenSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for JWT signing')
  }
  return secret
}

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash a token for storage (using SHA-256)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate email verification token
 */
export function generateVerificationToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = hashToken(token)
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)
  return { token, hash, expiresAt }
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = hashToken(token)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY)
  return { token, hash, expiresAt }
}

/**
 * Generate access token (short-lived JWT)
 */
export function generateAccessToken(userId: string, email: string, sessionId: string): string {
  const secret = getAccessTokenSecret()
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      userId,
      email,
      sessionId,
      type: 'access',
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY,
    } as AccessTokenPayload,
    secret
  )
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const secret = getAccessTokenSecret()
    const decoded = jwt.verify(token, secret) as AccessTokenPayload

    // Additional validation
    if (decoded.type !== 'access') {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

/**
 * Decode access token without verification (for inspection only).
 * WARNING: Do NOT use this for authorization decisions. Use verifyAccessToken() instead.
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload
  } catch {
    return null
  }
}

/**
 * Create a new session with token pair
 */
export async function createSession(
  userId: string | Types.ObjectId,
  deviceId: string | undefined,
  deviceFingerprint: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined
): Promise<TokenPair> {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId

  // Create session in database
  const SessionModel = Session as ISessionModel
  const { session, refreshToken } = await SessionModel.createSession(
    userObjectId,
    deviceId,
    deviceFingerprint,
    ipAddress,
    userAgent
  )

  // Get user email for access token
  const user = await PosUser.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  // Generate access token
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    session._id.toString()
  )

  // Update user's active sessions
  await PosUser.findByIdAndUpdate(userId, {
    $push: { activeSessions: session._id },
    $set: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    $unset: { lockedUntil: 1, failedLoginAttempts: 1 },
  })

  return {
    accessToken,
    refreshToken,
    sessionId: session._id.toString(),
    expiresAt: session.expiresAt,
  }
}

/**
 * Rotate refresh token (detect reuse attacks)
 */
export async function rotateRefreshToken(
  oldRefreshToken: string,
  deviceFingerprint?: string
): Promise<TokenPair | null> {
  const SessionModel = Session as ISessionModel
  const result = await SessionModel.rotateToken(oldRefreshToken, deviceFingerprint)

  if (!result) {
    return null
  }

  const { session, refreshToken } = result

  // Get user for access token
  const user = await PosUser.findById(session.userId)
  if (!user) {
    return null
  }

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.email,
    session._id.toString()
  )

  // Update session last used
  await Session.findByIdAndUpdate(session._id, { lastUsedAt: new Date() })

  return {
    accessToken,
    refreshToken,
    sessionId: session._id.toString(),
    expiresAt: session.expiresAt,
  }
}

/**
 * Revoke a session
 */
export async function revokeSession(
  sessionId: string,
  reason: string
): Promise<boolean> {
  const session = await Session.findById(sessionId)
  if (!session || session.isRevoked) {
    return false
  }

  await session.revoke(reason)

  // Remove from user's active sessions
  await PosUser.findByIdAndUpdate(session.userId, {
    $pull: { activeSessions: session._id },
  })

  return true
}

/**
 * Revoke all user sessions
 */
export async function revokeAllUserSessions(
  userId: string | Types.ObjectId,
  reason: string,
  exceptSessionId?: string
): Promise<number> {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId

  const query: any = {
    userId: userObjectId,
    isRevoked: false,
  }

  if (exceptSessionId) {
    query._id = { $ne: new Types.ObjectId(exceptSessionId) }
  }

  const result = await Session.updateMany(query, {
    $set: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  })

  // Clear user's active sessions (except current)
  const pullQuery: any = {}
  if (exceptSessionId) {
    pullQuery.activeSessions = { $ne: new Types.ObjectId(exceptSessionId) }
  } else {
    pullQuery.activeSessions = { $exists: true }
  }

  await PosUser.findByIdAndUpdate(userId, {
    $set: { activeSessions: exceptSessionId ? [new Types.ObjectId(exceptSessionId)] : [] },
  })

  return result.modifiedCount
}

/**
 * Validate session and get user info
 */
export async function validateSession(
  accessToken: string
): Promise<{ valid: boolean; user?: any; session?: any; error?: string }> {
  const payload = verifyAccessToken(accessToken)

  if (!payload) {
    return { valid: false, error: 'Invalid or expired access token' }
  }

  const session = await Session.findById(payload.sessionId)

  if (!session) {
    return { valid: false, error: 'Session not found' }
  }

  if (session.isRevoked) {
    return { valid: false, error: 'Session revoked' }
  }

  if (new Date() > session.expiresAt) {
    return { valid: false, error: 'Session expired' }
  }

  const user = await PosUser.findById(payload.userId)

  if (!user) {
    return { valid: false, error: 'User not found' }
  }

  if (user.accountStatus === 'disabled' || user.accountStatus === 'suspended') {
    return { valid: false, error: 'Account suspended or disabled' }
  }

  if (!user.isVerified) {
    return { valid: false, error: 'Email not verified' }
  }

  // Update last used
  session.lastUsedAt = new Date()
  await session.save()

  return { valid: true, user, session }
}

/**
 * Get token expiry times for client
 */
export function getTokenExpiryTimes() {
  return {
    accessTokenExpirySeconds: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiryDays: 7,
    verificationTokenExpiryHours: 24,
    passwordResetExpiryMinutes: 10,
  }
}
