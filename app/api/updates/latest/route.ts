import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongodb'
import Update, { IUpdate } from '@/lib/models/Update'
import { apiRateLimit } from '@/lib/rate-limit/rate-limit'

// GET /api/updates/latest - Get latest update (called by POS apps)
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await apiRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await connectDB()

    // Find the latest PUBLISHED update that is not blocked
    const latestUpdate = await Update.findOne({
      isLatest: true,
      status: { $in: ['published', 'rollbacked'] },
    })
      .sort({ createdAt: -1 })
      .lean() as IUpdate | null

    if (!latestUpdate) {
      // Return default response if no updates found
      return NextResponse.json({
        version: '1.0.0',
        notes: 'Initial release',
        downloadUrl: 'https://github.com/YouKnowGuru/Dhisum-Tseyig/releases/download/v1.0/Jinda.Setup.1.0.0.exe',
        blocked: false,
        forced: false,
        releaseDate: new Date().toISOString(),
      })
    }

    // Check if version is blocked
    const isBlocked = latestUpdate.status === 'blocked'

    return NextResponse.json({
      version: latestUpdate.version,
      notes: latestUpdate.notes,
      downloadUrl: latestUpdate.downloadUrl,
      blocked: isBlocked,
      forced: latestUpdate.forced || false,
      rolloutPercent: latestUpdate.rolloutPercent || 100,
      releaseDate: latestUpdate.createdAt,
    })
  } catch (error) {
    console.error('Get latest update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
