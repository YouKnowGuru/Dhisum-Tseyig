import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongodb'
import Update from '@/lib/models/Update'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://jindapos.com'

/**
 * GET /updates/latest.yml
 * Returns electron-updater compatible YAML for Windows NSIS.
 * This is what electron-updater fetches to check for updates.
 *
 * The YAML must contain:
 * - version: the new version number
 * - files[].url: direct download URL to the .exe installer
 * - files[].sha512: base64-encoded SHA-512 hash of the installer
 * - files[].size: file size in bytes
 * - path: same as files[0].url
 * - sha512: same as files[0].sha512
 * - releaseDate: ISO date string
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
      // 404 = electron-updater treats as "no update available"
      return new NextResponse('No updates available', { status: 404 })
    }

    const update = latestUpdate as any

    if (update.status === 'blocked') {
      return new NextResponse('Update blocked', { status: 404 })
    }

    // Resolve the download URL:
    // 1. Use downloadUrl if it's a full HTTP URL
    // 2. Use fileUrl if it's a full HTTP URL
    // 3. Fall back to server-hosted /downloads/Jinda.Setup.{version}.exe
    let downloadUrl = ''
    if (update.downloadUrl && update.downloadUrl.startsWith('http')) {
      downloadUrl = update.downloadUrl
    } else if (update.fileUrl && update.fileUrl.startsWith('http')) {
      downloadUrl = update.fileUrl
    } else {
      // Server-hosted fallback — file uploaded via admin panel
      const fileName = update.fileUrl || `Jinda.Setup.${update.version}.exe`
      downloadUrl = `${BASE_URL}/downloads/${fileName}`
    }

    const sha512 = update.fileSha512 || ''
    const size = update.fileSize || 0
    const releaseDate = update.releaseDate
      ? new Date(update.releaseDate).toISOString()
      : new Date(update.createdAt || Date.now()).toISOString()

    // Generate YAML in the exact format electron-updater expects
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('[Updates YAML] Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
