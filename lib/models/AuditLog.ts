import mongoose, { Schema, Document } from 'mongoose'

export type AuditEventType =
  // Authentication events
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'token_reuse_detected'
  | 'session_created'
  | 'session_revoked'
  // Registration events
  | 'registration'
  | 'email_verified'
  | 'verification_resend'
  // Password events
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  // License events
  | 'license_activated'
  | 'license_transferred'
  | 'license_verified'
  | 'license_expired'
  | 'license_revoked'
  // Device events
  | 'device_bound'
  | 'device_mismatch_detected'
  | 'device_verification_required'
  // Security events
  | 'account_locked'
  | 'account_unlocked'
  | 'account_suspended'
  | 'suspicious_activity'
  | 'rate_limit_triggered'
  | 'brute_force_detected'
  // Admin events
  | 'admin_action'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export interface IAuditLog extends Document {
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: mongoose.Types.ObjectId
  email?: string
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  deviceFingerprint?: string
  sessionId?: mongoose.Types.ObjectId
  details: {
    [key: string]: any
  }
  metadata?: {
    [key: string]: any
  }
  createdAt: Date
}

const AuditLogSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      enum: [
        'login_success',
        'login_failure',
        'logout',
        'token_refresh',
        'token_reuse_detected',
        'session_created',
        'session_revoked',
        'registration',
        'email_verified',
        'verification_resend',
        'password_changed',
        'password_reset_requested',
        'password_reset_completed',
        'license_activated',
        'license_transferred',
        'license_verified',
        'license_expired',
        'device_bound',
        'device_mismatch_detected',
        'device_verification_required',
        'account_locked',
        'account_unlocked',
        'account_suspended',
        'suspicious_activity',
        'rate_limit_triggered',
        'brute_force_detected',
        'admin_action',
        'user_created',
        'user_updated',
        'user_deleted',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'PosUser',
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    deviceId: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
      default: null,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, eventType: 1, createdAt: -1 })
AuditLogSchema.index({ eventType: 1, createdAt: -1 })
AuditLogSchema.index({ severity: 1, createdAt: -1 })
AuditLogSchema.index({ ipAddress: 1, createdAt: -1 })
AuditLogSchema.index({ deviceId: 1, createdAt: -1 })

// Index for suspicious activity detection
AuditLogSchema.index({ eventType: 1, severity: 1, createdAt: -1 })

// Prevent model recompilation in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.AuditLog
}

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
