import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth.config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/updates/upload - Upload installer file info (NOT the file itself)
// Files are hosted on GitHub Releases (free, 2GB limit).
// This endpoint accepts the GitHub release URL + metadata and returns it
// for the admin form to use.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user?.role || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { githubUrl, fileName, fileSize } = body

    if (!githubUrl || !fileName) {
      return NextResponse.json(
        { error: 'GitHub release URL and file name are required' },
        { status: 400 }
      )
    }

    // Validate URL is from GitHub
    if (!githubUrl.includes('github.com/')) {
      return NextResponse.json(
        { error: 'URL must be a GitHub release download URL' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      fileUrl: githubUrl,
      fileName,
      fileSize: fileSize || 0,
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({ error: 'Failed to process upload info' }, { status: 500 })
  }
}
