import jwt from 'jsonwebtoken'

// Default 7 days in seconds
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 604800

export interface JwtPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Get JWT secret from environment
 * Throws error if not configured (security: fail closed)
 */
function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required for JWT signing')
  }
  return secret
}

/**
 * Generate a JWT token for a POS user session.
 */
export function generateToken(userId: string, email: string): string {
  const secret = getJwtSecret()
  return jwt.sign(
    { userId, email } as JwtPayload,
    secret,
    { expiresIn: JWT_EXPIRY_SECONDS }
  )
}

/**
 * Verify and decode a JWT token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Decode a JWT without verification (for reading claims only).
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload
  } catch {
    return null
  }
}
