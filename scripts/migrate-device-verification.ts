/**
 * Migration Script: Device Verification Setup
 * 
 * This script migrates existing users to the new device verification system:
 * 1. Adds approvedDevices array to all users
 * 2. Adds existing deviceFingerprint to approved devices
 * 3. Initializes verification attempt counters
 * 4. Cleans up old device verification tokens
 * 
 * Usage: npx ts-node scripts/migrate-device-verification.ts
 */

import connectDB from '../lib/db/mongodb'
import PosUser from '../lib/models/PosUser'
import Token from '../lib/models/Token'

async function migrateDeviceVerification() {
  try {
    console.log('🔍 Connecting to database...')
    await connectDB()

    console.log('\n📊 MIGRATION STATUS')
    console.log('='.repeat(60))

    // 1. Count users needing migration
    const totalUsers = await PosUser.countDocuments()
    const usersWithApprovedDevices = await PosUser.countDocuments({
      approvedDevices: { $exists: true, $ne: [] },
    })
    const usersNeedingMigration = totalUsers - usersWithApprovedDevices

    console.log(`Total users: ${totalUsers}`)
    console.log(`Users with approvedDevices: ${usersWithApprovedDevices}`)
    console.log(`Users needing migration: ${usersNeedingMigration}`)

    if (usersNeedingMigration === 0) {
      console.log('\n✅ All users already migrated!')
      process.exit(0)
    }

    // 2. Migrate users
    console.log('\n🔄 Migrating users...')
    let migratedCount = 0
    let errorCount = 0

    const usersToMigrate = await PosUser.find({
      $or: [
        { approvedDevices: { $exists: false } },
        { approvedDevices: [] },
      ],
    })

    for (const user of usersToMigrate) {
      try {
        // Initialize approvedDevices array
        user.approvedDevices = user.approvedDevices || []

        // If user has existing deviceFingerprint, add to approved devices
        if (user.deviceFingerprint) {
          user.approvedDevices.push({
            deviceId: user.deviceId || 'legacy-device',
            fingerprint: user.deviceFingerprint,
            deviceName: user.deviceId ? `Device ${user.deviceId.substring(0, 8)}` : 'Previously Verified Device',
            approvedAt: user.lastLoginAt || user.createdAt || new Date(),
            lastUsedAt: user.lastLoginAt || new Date(),
            ipAddress: user.lastLoginIp || 'unknown',
          })
          console.log(`  ✓ Migrated user ${user.email} with existing device fingerprint`)
        } else {
          console.log(`  ✓ Initialized user ${user.email} (no existing device)`)
        }

        // Initialize verification counters
        user.deviceVerificationAttempts = user.deviceVerificationAttempts || 0
        user.deviceVerificationLockedUntil = user.deviceVerificationLockedUntil || null

        await user.save()
        migratedCount++
      } catch (error: any) {
        console.error(`  ✗ Error migrating user ${user.email}:`, error.message)
        errorCount++
      }
    }

    // 3. Clean up old device verification tokens
    console.log('\n🧹 Cleaning up old device verification tokens...')
    const cleanupResult = await Token.deleteMany({
      type: 'device-verification',
      expiresAt: { $lt: new Date() },
    })
    console.log(`  ✓ Deleted ${cleanupResult.deletedCount} expired tokens`)

    // 4. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total users: ${totalUsers}`)
    console.log(`Successfully migrated: ${migratedCount}`)
    console.log(`Migration errors: ${errorCount}`)
    console.log(`Expired tokens cleaned: ${cleanupResult.deletedCount}`)

    if (errorCount === 0) {
      console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!')
      console.log('\nAll existing users now have:')
      console.log('  • approvedDevices array initialized')
      console.log('  • Existing device fingerprint migrated to approved list')
      console.log('  • Verification attempt counters set to 0')
      console.log('  • Lockout timers cleared')
    } else {
      console.log(`\n⚠️  MIGRATION COMPLETED WITH ${errorCount} ERRORS`)
      console.log('Check the errors above and retry if necessary')
    }

    process.exit(errorCount > 0 ? 1 : 0)
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrateDeviceVerification()
