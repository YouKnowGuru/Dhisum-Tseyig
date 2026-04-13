import mongoose, { Schema, Document } from 'mongoose'
import crypto from 'crypto'

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId
  refreshTokenHash: string // Hashed refresh token
  tokenFamily: string // For rotation detection
  deviceId?: string
  deviceFingerprint?: string
  ipAddress?: string
  userAgent?: string
  isRevoked: boolean
  revokedAt?: Date
  revokedReason?: string
  expiresAt: Date
  lastUsedAt: Date
  createdAt: Date
}

export interface ISessionMethods {
  verifyRefreshToken(token: string): boolean
  revoke(reason: string): Promise<void>
}

export interface ISessionModel extends mongoose.Model<ISession, {}, ISessionMethods> {
  createSession(
    userId: mongoose.Types.ObjectId,
    deviceId: string | undefined,
    deviceFingerprint: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined
  ): Promise<{ session: ISession; refreshToken: string; tokenFamily: string }>
  rotateToken(
    oldToken: string,
    deviceFingerprint?: string
  ): Promise<{ session: ISession; refreshToken: string } | null>
}

const SessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'PosUser',
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    tokenFamily: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// TTL index: Auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Compound index for finding active sessions by user
SessionSchema.index({ userId: 1, isRevoked: 1 })

// Index for token family (rotation detection)
SessionSchema.index({ tokenFamily: 1, isRevoked: 1 })

// Method to verify refresh token
SessionSchema.methods.verifyRefreshToken = function(token: string): boolean {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  return this.refreshTokenHash === hash && !this.isRevoked && new Date() < this.expiresAt
}

// Method to revoke session
SessionSchema.methods.revoke = async function(reason: string) {
  this.isRevoked = true
  this.revokedAt = new Date()
  this.revokedReason = reason
  await this.save()
}

// Static method to create session
SessionSchema.statics.createSession = async function(
  userId: mongoose.Types.ObjectId,
  deviceId: string | undefined,
  deviceFingerprint: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined
) {
  const refreshToken = crypto.randomBytes(64).toString('hex')
  const tokenFamily = crypto.randomUUID()
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

  const session = await this.create({
    userId,
    refreshTokenHash,
    tokenFamily,
    deviceId,
    deviceFingerprint,
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })

  return { session, refreshToken, tokenFamily }
}

// Static method to rotate refresh token
SessionSchema.statics.rotateToken = async function(
  oldToken: string,
  deviceFingerprint?: string
) {
  const oldTokenHash = crypto.createHash('sha256').update(oldToken).digest('hex')

  // Find the session with the old token
  const oldSession = await this.findOne({
    refreshTokenHash: oldTokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })

  if (!oldSession) {
    // Possible token reuse attack - revoke all sessions in this family
    const existingSession = await this.findOne({ refreshTokenHash: oldTokenHash })
    if (existingSession) {
      await this.updateMany(
        { tokenFamily: existingSession.tokenFamily, isRevoked: false },
        { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'Token reuse detected' } }
      )
    }
    return null
  }

  // Check device fingerprint if available
  if (deviceFingerprint && oldSession.deviceFingerprint && oldSession.deviceFingerprint !== deviceFingerprint) {
    await oldSession.revoke('Device mismatch during token rotation')
    return null
  }

  // Revoke old session
  await oldSession.revoke('Token rotated')

  // Create new session with same family
  const newRefreshToken = crypto.randomBytes(64).toString('hex')
  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')

  const newSession = await this.create({
    userId: oldSession.userId,
    refreshTokenHash: newTokenHash,
    tokenFamily: oldSession.tokenFamily, // Same family for tracking
    deviceId: oldSession.deviceId,
    deviceFingerprint: oldSession.deviceFingerprint,
    ipAddress: oldSession.ipAddress,
    userAgent: oldSession.userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return { session: newSession, refreshToken: newRefreshToken }
}

// Prevent model recompilation in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Session
}

export default (mongoose.models.Session as ISessionModel) || mongoose.model<ISession, ISessionModel>('Session', SessionSchema)
