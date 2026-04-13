/**
 * Diagnostic Script: Find Duplicate Users
 * 
 * This script analyzes the PosUser collection to identify:
 * 1. Duplicate email registrations
 * 2. Duplicate username registrations
 * 3. Users in pending_verification status (never verified)
 * 4. Trial users who never activated
 * 
 * Usage: npx ts-node scripts/diagnose-duplicate-users.ts
 */

import connectDB from '../lib/db/mongodb'
import PosUser from '../lib/models/PosUser'

async function diagnoseDuplicateUsers() {
  try {
    console.log('🔍 Connecting to database...')
    await connectDB()

    console.log('\n📊 TOTAL USER COUNT')
    const totalUsers = await PosUser.countDocuments()
    console.log(`Total users in database: ${totalUsers}`)

    // Group by email to find duplicates
    console.log('\n🔍 CHECKING FOR DUPLICATE EMAILS...')
    const duplicateEmails = await PosUser.aggregate([
      {
        $group: {
          _id: { $toLower: '$email' },
          count: { $sum: 1 },
          userIds: { $push: '$_id' },
          statuses: { $push: '$accountStatus' },
          createdAts: { $push: '$createdAt' },
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

    if (duplicateEmails.length > 0) {
      console.log(`⚠️  Found ${duplicateEmails.length} email(s) with duplicate registrations:`)
      duplicateEmails.forEach((dup, index) => {
        console.log(`\n  ${index + 1}. ${dup._id}`)
        console.log(`     Registrations: ${dup.count}`)
        console.log(`     User IDs: ${dup.userIds.map((id: any) => id.toString()).join(', ')}`)
        console.log(`     Statuses: ${dup.statuses.join(', ')}`)
        console.log(`     Created: ${dup.createdAts.map((d: any) => new Date(d).toLocaleString()).join(' | ')}`)
      })
    } else {
      console.log('✅ No duplicate emails found')
    }

    // Group by username to find duplicates
    console.log('\n🔍 CHECKING FOR DUPLICATE USERNAMES...')
    const duplicateUsernames = await PosUser.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          userIds: { $push: '$_id' },
          emails: { $push: '$email' },
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

    if (duplicateUsernames.length > 0) {
      console.log(`⚠️  Found ${duplicateUsernames.length} username(s) with duplicates:`)
      duplicateUsernames.forEach((dup, index) => {
        console.log(`\n  ${index + 1}. "${dup._id}"`)
        console.log(`     Registrations: ${dup.count}`)
        console.log(`     Emails: ${dup.emails.join(', ')}`)
      })
    } else {
      console.log('✅ No duplicate usernames found')
    }

    // Users by status
    console.log('\n📈 USERS BY STATUS')
    const statusBreakdown = await PosUser.aggregate([
      {
        $group: {
          _id: '$accountStatus',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    statusBreakdown.forEach(status => {
      console.log(`  ${status._id}: ${status.count}`)
    })

    // Unverified users
    console.log('\n⏳ UNVERIFIED USERS (pending_verification)')
    const unverifiedCount = await PosUser.countDocuments({
      accountStatus: 'pending_verification',
    })
    console.log(`Users pending verification: ${unverifiedCount}`)

    if (unverifiedCount > 0) {
      const unverifiedUsers = await PosUser.find({
        accountStatus: 'pending_verification',
      })
        .select('email username createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

      console.log('\n  Most recent unverified users:')
      unverifiedUsers.forEach((user, index) => {
        console.log(`    ${index + 1}. ${user.email} (${user.username}) - ${new Date(user.createdAt).toLocaleString()}`)
      })
    }

    // Trial users
    console.log('\n🎓 TRIAL USERS')
    const trialCount = await PosUser.countDocuments({
      accountStatus: 'trial',
    })
    console.log(`Active trial users: ${trialCount}`)

    // Expired trials
    const expiredTrials = await PosUser.countDocuments({
      accountStatus: 'trial',
      trialEndDate: { $lt: new Date() },
    })
    console.log(`Expired trial users: ${expiredTrials}`)

    // Summary
    console.log('\n📋 SUMMARY')
    const activeUsers = await PosUser.countDocuments({ accountStatus: 'active' })
    const verifiedUsers = await PosUser.countDocuments({ isVerified: true })

    console.log(`  Active & verified users: ${activeUsers}`)
    console.log(`  Total verified (any status): ${verifiedUsers}`)
    console.log(`  Total unverified: ${totalUsers - verifiedUsers}`)
    console.log(`  Duplicate registrations: ${duplicateEmails.length}`)
    console.log(`  Potential cleanup needed: ${unverifiedCount + expiredTrials}`)

    console.log('\n✅ Diagnostic complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error running diagnostic:', error)
    process.exit(1)
  }
}

diagnoseDuplicateUsers()
