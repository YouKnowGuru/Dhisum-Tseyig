/**
 * Cleanup Script: Remove Duplicate Users
 * 
 * This script identifies and removes duplicate user registrations,
 * keeping only the most recent record for each email.
 * 
 * SAFETY FEATURES:
 * - Dry run mode by default (no actual deletion)
 * - Shows exactly what will be deleted before proceeding
 * - Requires explicit --confirm flag to perform deletion
 * 
 * Usage:
 *   Dry run (safe):     npx ts-node scripts/cleanup-duplicate-users.ts
 *   Actual cleanup:     npx ts-node scripts/cleanup-duplicate-users.ts --confirm
 */

import connectDB from '../lib/db/mongodb'
import PosUser from '../lib/models/PosUser'

async function cleanupDuplicateUsers(confirmMode: boolean = false) {
  try {
    console.log('🔍 Connecting to database...')
    await connectDB()

    console.log(`\n${confirmMode ? '⚠️  RUNNING IN CONFIRM MODE - WILL DELETE DATA' : '📋 RUNNING IN DRY RUN MODE - NO DATA WILL BE DELETED'}\n`)

    // Find all duplicate emails
    console.log('🔍 Finding duplicate email registrations...')
    const duplicateEmails = await PosUser.aggregate([
      {
        $group: {
          _id: { $toLower: '$email' },
          count: { $sum: 1 },
          userIds: { $push: '$_id' },
          statuses: { $push: '$accountStatus' },
          createdAts: { $push: '$createdAt' },
          isVerified: { $push: '$isVerified' },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicate emails found. Database is clean!')
      process.exit(0)
    }

    console.log(`\n⚠️  Found ${duplicateEmails.length} email(s) with duplicate registrations\n`)

    let totalToDelete = 0
    const usersToDelete: { email: string; userId: string; status: string; createdAt: Date }[] = []

    // For each duplicate email, keep the most recent one and mark others for deletion
    for (const dup of duplicateEmails) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`Email: ${dup._id}`)
      console.log(`Total registrations: ${dup.count}`)
      console.log(`${'='.repeat(80)}`)

      // Sort by createdAt descending to keep the most recent
      const sortedUsers = dup.userIds
        .map((userId: any, index: number) => ({
          userId,
          status: dup.statuses[index],
          createdAt: dup.createdAts[index],
          isVerified: dup.isVerified[index],
        }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      console.log('\n  KEEP (most recent):')
      console.log(`    ID: ${sortedUsers[0].userId}`)
      console.log(`    Status: ${sortedUsers[0].status}`)
      console.log(`    Created: ${new Date(sortedUsers[0].createdAt).toLocaleString()}`)
      console.log(`    Verified: ${sortedUsers[0].isVerified ? '✅' : '❌'}`)

      console.log('\n  DELETE (older duplicates):')
      for (let i = 1; i < sortedUsers.length; i++) {
        const user = sortedUsers[i]
        console.log(`    ${i}. ID: ${user.userId} | Status: ${user.status} | Created: ${new Date(user.createdAt).toLocaleString()} | Verified: ${user.isVerified ? '✅' : '❌'}`)

        usersToDelete.push({
          email: dup._id,
          userId: user.userId.toString(),
          status: user.status,
          createdAt: user.createdAt,
        })
        totalToDelete++
      }
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📊 SUMMARY`)
    console.log(`${'='.repeat(80)}`)
    console.log(`Total duplicate emails: ${duplicateEmails.length}`)
    console.log(`Total users to DELETE: ${totalToDelete}`)
    console.log(`Users that will remain: ${duplicateEmails.length} (one per email)`)

    if (!confirmMode) {
      console.log(`\n💡 This was a DRY RUN. No data was deleted.`)
      console.log(`💡 To perform actual cleanup, run:`)
      console.log(`   npx ts-node scripts/cleanup-duplicate-users.ts --confirm\n`)
      process.exit(0)
    }

    // CONFIRMED: Perform deletion
    console.log(`\n⚠️  PROCEEDING WITH DELETION IN 5 SECONDS...`)
    console.log(`⚠️  Press Ctrl+C to cancel!\n`)

    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\n🗑️  Deleting duplicate users...\n')

    let deletedCount = 0
    for (const user of usersToDelete) {
      try {
        const result = await PosUser.deleteOne({ _id: user.userId })
        if (result.deletedCount > 0) {
          console.log(`  ✅ Deleted: ${user.email} (${user.userId})`)
          deletedCount++
        } else {
          console.log(`  ⚠️  Already deleted: ${user.email} (${user.userId})`)
        }
      } catch (error: any) {
        console.error(`  ❌ Failed to delete: ${user.email} (${user.userId}) - ${error.message}`)
      }
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ CLEANUP COMPLETE`)
    console.log(`${'='.repeat(80)}`)
    console.log(`Users deleted: ${deletedCount}`)
    console.log(`Users remaining: ${duplicateEmails.length}`)
    console.log(`\n💡 Verify the cleanup by running the diagnostic:`)
    console.log(`   npx ts-node scripts/diagnose-duplicate-users.ts\n`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Parse command line arguments
const confirmMode = process.argv.includes('--confirm')
cleanupDuplicateUsers(confirmMode)
