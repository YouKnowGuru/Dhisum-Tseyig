import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import connectDB from '@/lib/db/mongodb'
import Update from '@/lib/models/Update'

const GITHUB_OWNER = 'YouKnowGuru'
const GITHUB_REPO = 'Dhisum-Tseyig'
const GITHUB_BASE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download`

/**
 * GET /updates/latest.yml
 * Returns electron-updater compatible YAML for Windows NSIS.
 * This is what electron-updater fetches to check for updates.
 *
 * Download URLs point to GitHub Releases (free hosting, 2GB per file).
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
    // 1. Use downloadUrl from DB if it's a full HTTP URL (admin can paste any direct link)
    // 2. Use fileUrl from DB if it's a full HTTP URL
    // 3. Fall back to GitHub Releases URL
    let downloadUrl = ''
    if (update.downloadUrl && update.downloadUrl.startsWith('http')) {
      downloadUrl = update.downloadUrl
    } else if (update.fileUrl && update.fileUrl.startsWith('http')) {
      downloadUrl = update.fileUrl
    } else {
      // GitHub Releases fallback — file uploaded as release asset
      const fileName = update.fileUrl || `Jinda.Setup.${update.version}.exe`
      downloadUrl = `${GITHUB_BASE}/v${update.version}/${fileName}`
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
