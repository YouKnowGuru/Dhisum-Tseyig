/**
 * Master Test Runner - Runs all diagnostic scripts
 * Run with: node scripts/test-all.js
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('╔' + '═'.repeat(68) + '╗')
console.log('║' + ' '.repeat(68) + '║')
console.log('║' + '  DHISUM TSEYIG - COMPLETE SYSTEM TEST SUITE'.padEnd(68) + '║')
console.log('║' + ' '.repeat(68) + '║')
console.log('║' + '  Running all diagnostic tests...'.padEnd(68) + '║')
console.log('║' + ' '.repeat(68) + '║')
console.log('╚' + '═'.repeat(68) + '╝')
console.log('')

const tests = [
  {
    name: 'License System Tests',
    script: 'test-license-full.js',
    description: 'Tests license verification, activation, OTP, rate limiting, CORS'
  },
  {
    name: 'Email & Token Verification Tests',
    script: 'test-email-tokens.js',
    description: 'Tests email sending, token verification, MongoDB connection'
  },
  {
    name: 'License API Quick Test',
    script: 'test-license-api.js',
    description: 'Quick check of license API endpoints'
  }
]

let totalPassed = 0
let totalFailed = 0

tests.forEach((test, index) => {
  console.log('\n' + '═'.repeat(70))
  console.log(`TEST SUITE ${index + 1}/${tests.length}: ${test.name}`)
  console.log('═'.repeat(70))
  console.log(`Description: ${test.description}`)
  console.log('═'.repeat(70) + '\n')

  const scriptPath = path.join(__dirname, test.script)

  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit', encoding: 'utf8' })
    console.log(`\n✅ ${test.name} - COMPLETED`)
    totalPassed++
  } catch (error) {
    console.error(`\n❌ ${test.name} - FAILED`)
    totalFailed++
  }
})

// Summary
console.log('\n' + '╔' + '═'.repeat(68) + '╗')
console.log('║' + ' '.repeat(68) + '║')
console.log('║' + '  TEST SUITE SUMMARY'.padEnd(68) + '║')
console.log('║' + ' '.repeat(68) + '║')
console.log('╚' + '═'.repeat(68) + '╝')

console.log(`\n📊 Total Test Suites: ${tests.length}`)
console.log(`✅ Passed: ${totalPassed}`)
console.log(`❌ Failed: ${totalFailed}`)

if (totalFailed === 0) {
  console.log('\n🎉 ALL TEST SUITES PASSED!')
  console.log('\nYour Dhisum Tseyig system is working correctly.')
  console.log('All license, email, and token verification systems are operational.')
} else {
  console.log('\n⚠️  Some test suites failed.')
  console.log('\nTroubleshooting steps:')
  console.log('  1. Check Vercel deployment status')
  console.log('  2. Verify environment variables in Vercel Dashboard')
  console.log('  3. Check Vercel Logs for detailed errors')
  console.log('  4. Review individual test output above')
}

console.log('\n' + '═'.repeat(70))
console.log(`🕐 Test run completed at: ${new Date().toISOString()}`)
console.log('═'.repeat(70))
