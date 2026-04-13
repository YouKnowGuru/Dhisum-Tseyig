import AuditLog, { IAuditLog, AuditEventType, AuditSeverity } from '@/lib/models/AuditLog'
import { Types } from 'mongoose'

interface AuditLogOptions {
  userId?: string | Types.ObjectId
  email?: string
  ipAddress?: string
  userAgent?: string
  deviceId?: string
  deviceFingerprint?: string
  sessionId?: string | Types.ObjectId
  details?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  severity: AuditSeverity = 'info',
  options: AuditLogOptions = {}
): Promise<void> {
  try {
    const logEntry = await AuditLog.create({
      eventType,
      severity,
      userId: options.userId ? new Types.ObjectId(options.userId) : undefined,
      email: options.email?.toLowerCase().trim(),
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      deviceId: options.deviceId,
      deviceFingerprint: options.deviceFingerprint,
      sessionId: options.sessionId ? new Types.ObjectId(options.sessionId) : undefined,
      details: options.details || {},
      metadata: options.metadata || {},
    })

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${eventType} (${severity}):`, {
        userId: options.userId,
        email: options.email,
        ipAddress: options.ipAddress,
      })
    }
  } catch (error) {
    console.error('[AUDIT] Failed to log audit event:', error)
  }
}

/**
 * Log authentication events
 */
export async function logLoginSuccess(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('login_success', 'info', options)
}

export async function logLoginFailure(
  options: AuditLogOptions & { reason: string }
): Promise<void> {
  await logAuditEvent('login_failure', 'warning', {
    ...options,
    details: { reason: options.reason },
  })
}

export async function logLogout(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('logout', 'info', options)
}

export async function logTokenRefresh(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('token_refresh', 'info', options)
}

export async function logTokenReuseDetected(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('token_reuse_detected', 'critical', options)
}

/**
 * Log registration events
 */
export async function logRegistration(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('registration', 'info', options)
}

export async function logEmailVerified(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('email_verified', 'info', options)
}

export async function logVerificationResend(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('verification_resend', 'info', options)
}

/**
 * Log password events
 */
export async function logPasswordChanged(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('password_changed', 'info', options)
}

export async function logPasswordResetRequested(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('password_reset_requested', 'info', options)
}

export async function logPasswordResetCompleted(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('password_reset_completed', 'info', options)
}

/**
 * Log license events
 */
export async function logLicenseActivated(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('license_activated', 'info', options)
}

export async function logLicenseTransferred(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('license_transferred', 'warning', options)
}

export async function logLicenseExpired(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('license_expired', 'warning', options)
}

export async function logLicenseRevoked(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('license_revoked', 'critical', options)
}

/**
 * Log device events
 */
export async function logDeviceBound(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('device_bound', 'info', options)
}

export async function logDeviceMismatch(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('device_mismatch_detected', 'warning', options)
}

export async function logDeviceVerificationRequired(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('device_verification_required', 'warning', options)
}

/**
 * Log security events
 */
export async function logAccountLocked(options: AuditLogOptions & { reason: string }): Promise<void> {
  await logAuditEvent('account_locked', 'warning', {
    ...options,
    details: { reason: options.reason },
  })
}

export async function logAccountUnlocked(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('account_unlocked', 'info', options)
}

export async function logAccountSuspended(options: AuditLogOptions & { reason: string }): Promise<void> {
  await logAuditEvent('account_suspended', 'critical', {
    ...options,
    details: { reason: options.reason },
  })
}

export async function logSuspiciousActivity(
  options: AuditLogOptions & { activity: string; details: any }
): Promise<void> {
  await logAuditEvent('suspicious_activity', 'warning', {
    ...options,
    details: { activity: options.activity, ...options.details },
  })
}

export async function logRateLimitTriggered(
  options: AuditLogOptions & { endpoint: string }
): Promise<void> {
  await logAuditEvent('rate_limit_triggered', 'warning', {
    ...options,
    details: { endpoint: options.endpoint },
  })
}

export async function logBruteForceDetected(options: AuditLogOptions): Promise<void> {
  await logAuditEvent('brute_force_detected', 'critical', options)
}

/**
 * Log admin events
 */
export async function logAdminAction(
  options: AuditLogOptions & { action: string; target?: string }
): Promise<void> {
  await logAuditEvent('admin_action', 'info', {
    ...options,
    details: { action: options.action, target: options.target },
  })
}

/**
 * Query audit logs with pagination
 */
export async function queryAuditLogs(
  filters: {
    userId?: string
    email?: string
    eventType?: AuditEventType
    severity?: AuditSeverity
    startDate?: Date
    endDate?: Date
    ipAddress?: string
  } = {},
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 50 } = options

  const query: any = {}

  if (filters.userId) query.userId = new Types.ObjectId(filters.userId)
  if (filters.email) query.email = filters.email.toLowerCase()
  if (filters.eventType) query.eventType = filters.eventType
  if (filters.severity) query.severity = filters.severity
  if (filters.ipAddress) query.ipAddress = filters.ipAddress

  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) query.createdAt.$gte = filters.startDate
    if (filters.endDate) query.createdAt.$lte = filters.endDate
  }

  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ])

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const summary = await AuditLog.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
  ])

  return summary
}

/**
 * Detect suspicious patterns for a user
 */
export async function detectSuspiciousPatterns(
  userId: string,
  timeframe: number = 24 * 60 * 60 * 1000 // 24 hours
) {
  const since = new Date(Date.now() - timeframe)

  const patterns = await AuditLog.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: since },
        severity: { $in: ['warning', 'critical'] },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        events: { $push: '$$ROOT' },
      },
    },
    { $sort: { count: -1 } },
  ])

  const suspiciousPatterns = patterns.filter(p => {
    // Multiple login failures
    if (p._id === 'login_failure' && p.count >= 3) return true
    // Multiple token reuse
    if (p._id === 'token_reuse_detected' && p.count >= 1) return true
    // Multiple rate limit triggers
    if (p._id === 'rate_limit_triggered' && p.count >= 2) return true
    // Account locked multiple times
    if (p._id === 'account_locked' && p.count >= 2) return true

    return false
  })

  return suspiciousPatterns
}

/**
 * Get recent security alerts
 */
export async function getSecurityAlerts(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const alerts = await AuditLog.find({
    createdAt: { $gte: since },
    severity: { $in: ['warning', 'critical'] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return alerts
}

/**
 * Get login statistics
 */
export async function getLoginStats(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const stats = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        eventType: { $in: ['login_success', 'login_failure'] },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueIps: { $addToSet: '$ipAddress' },
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueIpCount: { $size: '$uniqueIps' },
      },
    },
  ])

  return stats
}
