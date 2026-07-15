import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/health — Simple health check for the POS desktop app
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'jindapos.com',
  })
}
