import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import mongoose from 'mongoose'

// ONE-TIME maintenance route — DELETE AFTER USE
export async function GET(): Promise<NextResponse> {
  try {
    await connectDB()
    const db = mongoose.connection.db!
    const col = db.collection('tokens')

    // Show current indexes
    const before = await col.indexes()

    // Drop the old global unique index if it exists
    let dropResult = 'not found'
    try {
      await col.dropIndex('token_1')
      dropResult = 'dropped ✅'
    } catch (e: any) {
      dropResult = `skipped (${e.message})`
    }

    // Clear all stale OTP tokens so there are no lingering collisions
    const deleted = await col.deleteMany({ type: 'license-otp' })

    // Show final indexes
    const after = await col.indexes()

    return NextResponse.json({
      success: true,
      token_1_index: dropResult,
      stale_otps_deleted: deleted.deletedCount,
      indexes_before: before.map(i => ({ name: i.name, key: i.key, unique: i.unique })),
      indexes_after: after.map(i => ({ name: i.name, key: i.key, unique: i.unique })),
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
