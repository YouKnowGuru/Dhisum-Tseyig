/**
 * POS Desktop App Connectivity Test
 * Tests if the POS app can reach the license server
 * Run with: node scripts/test-pos-connectivity.js
 */

const https = require('https')

const BASE_URL = 'https://dhisum-tseyig.vercel.app'

console.log('╔' + '═'.repeat(68) + '╗')
console.log('║' + ' '.repeat(68) + '║')
console.log('║' + '  POS DESKTOP APP - SERVER CONNECTIVITY TEST'.padEnd(68) + '║')
console.log('║' + ' '.repeat(68) + '║')
console.log('╚' + '═'.repeat(68) + '╝')
console.log(`\n🌐 Testing: ${BASE_URL}\n`)

function testConnection(name, method, path, body = null, timeout = 10000) {
  return new Promise((resolve, reject) => {
    console.log(`Testing: ${name}...`)
    
    const url = `${BASE_URL}${path}`
    const startTime = Date.now()

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      const responseTime = Date.now() - startTime
      
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          console.log(`  ✅ ${name} - ${responseTime}ms (Status: ${res.statusCode})`)
          console.log(`     Response: ${JSON.stringify(parsed).substring(0, 100)}...\n`)
          resolve({ success: true, status: res.statusCode, time: responseTime, data: parsed })
        } catch (e) {
          console.log(`  ✅ ${name} - ${responseTime}ms (Status: ${res.statusCode})`)
          console.log(`     Response: ${data.substring(0, 100)}...\n`)
          resolve({ success: true, status: res.statusCode, time: responseTime, data })
        }
      })
    })

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime
      console.log(`  ❌ ${name} - FAILED after ${responseTime}ms`)
      console.log(`     Error: ${error.message}\n`)
      console.log(`     Error Code: ${error.code}`)
      console.log(`     Error Type: ${error.name}\n`)
      resolve({ success: false, time: responseTime, error: error.message, code: error.code })
    })

    req.on('timeout', () => {
      req.destroy()
      console.log(`  ❌ ${name} - TIMEOUT (>${timeout}ms)\n`)
      resolve({ success: false, time: timeout, error: 'Request timed out', code: 'TIMEOUT' })
    })

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runTests() {
  const results = []

  // Test 1: Basic connectivity
  console.log('═'.repeat(70))
  console.log('Test 1: Basic Server Connectivity')
  console.log('═'.repeat(70))
  results.push(await testConnection(
    'GET /api/stats',
    'GET',
    '/api/stats',
    null,
    5000
  ))

  // Test 2: License verification endpoint
  console.log('═'.repeat(70))
  console.log('Test 2: License Verification Endpoint')
  console.log('═'.repeat(70))
  results.push(await testConnection(
    'POST /api/license/verify',
    'POST',
    '/api/license/verify',
    { licenseKey: 'DTS-TEST-ABCD-EFGH', deviceId: 'test-device-123' },
    10000
  ))

  // Test 3: License activation endpoint
  console.log('═'.repeat(70))
  console.log('Test 3: License Activation Endpoint')
  console.log('═'.repeat(70))
  results.push(await testConnection(
    'POST /api/license/activate',
    'POST',
    '/api/license/activate',
    { licenseKey: 'DTS-TEST-IJKL-MNOP', deviceId: 'test-device-456' },
    10000
  ))

  // Test 4: Auth endpoints
  console.log('═'.repeat(70))
  console.log('Test 4: Authentication Endpoints')
  console.log('═'.repeat(70))
  results.push(await testConnection(
    'GET /api/auth/status',
    'GET',
    '/api/auth/status',
    null,
    5000
  ))

  // Test 5: Updates endpoint
  console.log('═'.repeat(70))
  console.log('Test 5: Updates Endpoint')
  console.log('═'.repeat(70))
  results.push(await testConnection(
    'GET /api/updates/latest',
    'GET',
    '/api/updates/latest',
    null,
    5000
  ))

  // Summary
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' '.repeat(68) + '║')
  console.log('║' + '  CONNECTIVITY TEST SUMMARY'.padEnd(68) + '║')
  console.log('║' + ' '.repeat(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const avgTime = Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.time, 0) / passed)

  console.log(`\n📊 Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Average Response Time: ${avgTime}ms`)

  if (failed === 0) {
    console.log('\n🎉 SUCCESS! Server is reachable and all endpoints are responding.')
    console.log('\nIf your POS app still shows "Unable to reach the license server":')
    console.log('  1. Check if the POS app is using the correct URL:')
    console.log(`     Expected: ${BASE_URL}`)
    console.log('  2. Check Electron console logs for detailed error messages')
    console.log('  3. Look for: [License] logs in Electron dev tools')
    console.log('  4. Check if firewall/antivirus is blocking Electron')
    console.log('  5. Verify system date/time is correct (SSL certificate validation)')
  } else {
    console.log('\n⚠️  Some tests failed.')
    console.log('\nTroubleshooting:')
    console.log('  1. Check your internet connection')
    console.log('  2. Check if firewall is blocking HTTPS')
    console.log('  3. Try accessing in browser: https://dhisum-tseyig.vercel.app')
    console.log('  4. Check DNS resolution: nslookup dhisum-tseyig.vercel.app')
    console.log('  5. Check Vercel status: https://www.vercel-status.com/')
  }

  console.log('\n' + '═'.repeat(70))
  console.log(`🕐 Test completed at: ${new Date().toISOString()}`)
  console.log('═'.repeat(70))
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
