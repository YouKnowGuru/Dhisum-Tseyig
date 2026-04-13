import mongoose, { Schema, Document } from 'mongoose'

export interface IPosUser extends Document {
  // Core Identity
  username: string
  email: string
  password: string // bcrypt hashed (12+ rounds)

  // Email Verification
  isVerified: boolean
  verifiedAt?: Date

  // Account Status & Trial
  accountStatus: 'active' | 'pending_verification' | 'trial' | 'expired' | 'suspended' | 'disabled'
  trialStartDate?: Date
  trialEndDate?: Date

  // License & Device Binding
  licenseKey?: string
  deviceId?: string
  deviceFingerprint?: string // Advanced device binding

  // Security & Audit
  failedLoginAttempts: number
  lockedUntil?: Date
  lastLoginAt?: Date
  lastLoginIp?: string
  passwordChangedAt?: Date
  lastPasswordResetAt?: Date

  // Device Management
  approvedDevices: Array<{
    deviceId: string
    fingerprint: string
    deviceName: string
    approvedAt: Date
    lastUsedAt: Date
    ipAddress: string
  }>
  deviceVerificationAttempts: number
  deviceVerificationLockedUntil?: Date

  // Session Management
  activeSessions: mongoose.Types.ObjectId[]
  requirePasswordChange: boolean

  createdAt: Date
  updatedAt: Date
}

const PosUserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending_verification', 'trial', 'expired', 'suspended', 'disabled'],
      default: 'pending_verification',
      index: true,
    },
    trialStartDate: {
      type: Date,
      default: null,
    },
    trialEndDate: {
      type: Date,
      default: null,
    },
    licenseKey: {
      type: String,
      default: null,
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
      index: true,
    },
    deviceFingerprint: {
      type: String,
      default: null,
    },
    // Security tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastPasswordResetAt: {
      type: Date,
      default: null,
    },
    activeSessions: [{
      type: Schema.Types.ObjectId,
      ref: 'Session',
    }],
    requirePasswordChange: {
      type: Boolean,
      default: false,
    },
    // Device Management
    approvedDevices: [{
      deviceId: { type: String, required: true },
      fingerprint: { type: String, required: true },
      deviceName: { type: String, default: 'Unknown Device' },
      approvedAt: { type: Date, default: Date.now },
      lastUsedAt: { type: Date, default: Date.now },
      ipAddress: { type: String, default: 'unknown' },
    }],
    deviceVerificationAttempts: {
      type: Number,
      default: 0,
    },
    deviceVerificationLockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for common queries
PosUserSchema.index({ email: 1, isVerified: 1 })
PosUserSchema.index({ deviceId: 1, licenseKey: 1 })
PosUserSchema.index({ accountStatus: 1, trialEndDate: 1 }) // For trial expiration queries
PosUserSchema.index({ lockedUntil: 1 }) // For locked account queries

// Prevent model recompilation in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.PosUser
}

export default mongoose.models.PosUser || mongoose.model<IPosUser>('PosUser', PosUserSchema)
