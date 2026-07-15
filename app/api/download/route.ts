import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimit } from '@/lib/rate-limit/rate-limit'

// GET /api/download - Get download URL for installer
// Files are hosted on GitHub Releases (free, 2GB limit per file)
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResponse = await apiRateLimit(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') || 'setup'
    const version = searchParams.get('version') || '1.0.0'

    const GITHUB_BASE = 'https://github.com/YouKnowGuru/dhisum-pos-download/releases/download'

    let downloadUrl: string
    let filename: string

    switch (type) {
      case 'portable':
        downloadUrl = `${GITHUB_BASE}/v${version}/Jinda.${version}.exe`
        filename = `Jinda.${version}.exe`
        break
      case 'setup':
      default:
        downloadUrl = `${GITHUB_BASE}/v${version}/Jinda.Setup.${version}.exe`
        filename = `Jinda.Setup.${version}.exe`
        break
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename,
      type,
      version,
    })
  } catch (error) {
    console.error('Download URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
