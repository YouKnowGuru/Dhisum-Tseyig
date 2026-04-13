import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/db/mongodb'

// In-memory store for captchas (use Redis in production)
const captchaStore = new Map<string, { code: string; expiresAt: number }>()

const CAPTCHA_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a simple math captcha or text captcha
 */
function generateCaptcha(): { id: string; question: string; answer: string } {
  const type = Math.random() > 0.5 ? 'math' : 'text'

  if (type === 'math') {
    const num1 = Math.floor(Math.random() * 20) + 1
    const num2 = Math.floor(Math.random() * 20) + 1
    const operations = ['+', '-']
    const op = operations[Math.floor(Math.random() * operations.length)]

    let answer: number
    let question: string

    if (op === '+') {
      answer = num1 + num2
      question = `${num1} + ${num2}`
    } else {
      // Ensure positive result for subtraction
      const larger = Math.max(num1, num2)
      const smaller = Math.min(num1, num2)
      answer = larger - smaller
      question = `${larger} - ${smaller}`
    }

    const id = crypto.randomBytes(16).toString('hex')
    return { id, question, answer: answer.toString() }
  } else {
    // Text captcha
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const id = crypto.randomBytes(16).toString('hex')
    return { id, question: code, answer: code }
  }
}

/**
 * GET /api/auth/captcha
 * Generate a new captcha
 */
export async function GET(req: NextRequest) {
  try {
    // Generate captcha
    const captcha = generateCaptcha()

    // Store hashed answer
    const answerHash = crypto
      .createHash('sha256')
      .update(captcha.answer.toLowerCase())
      .digest('hex')

    captchaStore.set(captcha.id, {
      code: answerHash,
      expiresAt: Date.now() + CAPTCHA_TTL,
    })

    // Cleanup expired entries (run occasionally)
    if (Math.random() < 0.1) {
      const now = Date.now()
      for (const [key, value] of captchaStore.entries()) {
        if (value.expiresAt < now) {
          captchaStore.delete(key)
        }
      }
    }

    return NextResponse.json({
      success: true,
      captchaId: captcha.id,
      question: captcha.question,
      expiresIn: 300, // 5 minutes in seconds
    })
  } catch (error) {
    console.error('Captcha generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate captcha' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/captcha/verify
 * Verify a captcha answer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { captchaId, answer } = body

    if (!captchaId || !answer) {
      return NextResponse.json(
        { success: false, error: 'Captcha ID and answer required' },
        { status: 400 }
      )
    }

    const stored = captchaStore.get(captchaId)

    if (!stored) {
      return NextResponse.json(
        { success: false, error: 'Captcha expired or invalid' },
        { status: 400 }
      )
    }

    // Check expiration
    if (stored.expiresAt < Date.now()) {
      captchaStore.delete(captchaId)
      return NextResponse.json(
        { success: false, error: 'Captcha expired' },
        { status: 410 }
      )
    }

    // Verify answer (case-insensitive)
    const answerHash = crypto
      .createHash('sha256')
      .update(answer.toLowerCase().trim())
      .digest('hex')

    if (answerHash !== stored.code) {
      return NextResponse.json(
        { success: false, error: 'Incorrect captcha answer' },
        { status: 400 }
      )
    }

    // Delete used captcha
    captchaStore.delete(captchaId)

    return NextResponse.json({
      success: true,
      message: 'Captcha verified successfully',
    })
  } catch (error) {
    console.error('Captcha verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}

/**
 * Verify captcha internally (for use by other routes)
 */
export function verifyCaptchaInternal(captchaId: string, answer: string): boolean {
  const stored = captchaStore.get(captchaId)

  if (!stored || stored.expiresAt < Date.now()) {
    return false
  }

  const answerHash = crypto
    .createHash('sha256')
    .update(answer.toLowerCase().trim())
    .digest('hex')

  const valid = answerHash === stored.code

  if (valid) {
    captchaStore.delete(captchaId)
  }

  return valid
}
