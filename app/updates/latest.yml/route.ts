import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongodb'
import Update from '@/lib/models/Update'

/**
 * GET /updates/latest.yml
 * Returns electron-updater compatible YAML for Windows NSIS
 * This is what electron-updater fetches to check for updates
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()

    // Find the latest PUBLISHED update
    const latestUpdate = await Update.findOne({
      isLatest: true,
      status: { $in: ['published', 'rollbacked'] },
    })
      .sort({ createdAt: -1 })
      .lean()

    if (!latestUpdate) {
      return new NextResponse('No updates available', { status: 404 })
    }

    const update = latestUpdate as any

    if (update.status === 'blocked') {
      return new NextResponse('Update blocked', { status: 404 })
    }

    const installerFileName = update.fileUrl || `Jinda Setup ${update.version}.exe`

    const downloadUrl = installerFileName.startsWith('http')
      ? installerFileName
      : `https://github.com/YouKnowGuru/dhisum-pos-download/releases/download/v${update.version}/${encodeURIComponent(installerFileName)}`

    const sha512 = update.fileSha512 || ''
    const size = update.fileSize || 0
    const releaseDate = update.releaseDate
      ? new Date(update.releaseDate).toISOString()
      : new Date().toISOString()

    const yamlContent = `version: ${update.version}
files:
  - url: ${downloadUrl}
    sha512: ${sha512}
    size: ${size}
path: ${downloadUrl}
sha512: ${sha512}
releaseDate: '${releaseDate}'
`

    return new NextResponse(yamlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[Updates YAML] Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
