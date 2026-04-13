/**
 * Diagnostic script to test license activation endpoint
 * Run with: node scripts/test-license-api.js
 */

const https = require('https')

const BASE_URL = 'https://dhisum-tseyig.vercel.app'

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`
    console.log(`\n${method} ${url}`)

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`)
        try {
          const parsed = JSON.parse(data)
          console.log('Response:', JSON.stringify(parsed, null, 2))
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          console.log('Response (non-JSON):', data.substring(0, 500))
          resolve({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message)
      reject(error)
    })

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runDiagnostics() {
  console.log('='.repeat(60))
  console.log('DHISUM TSEYIG LICENSE API DIAGNOSTICS')
  console.log('='.repeat(60))

  try {
    // Test 1: Check if server is reachable
    console.log('\n[Test 1] Checking if server is reachable...')
    await makeRequest('GET', '/api/license/verify?licenseKey=DTS-TEST')
      .then(() => console.log('✅ Server is reachable'))
      .catch(() => {
        console.log('❌ Server is NOT reachable')
        console.log('   Possible issues:')
        console.log('   - Vercel deployment is down')
        console.log('   - Network/firewall blocking')
        console.log('   - Incorrect URL')
      })

    // Test 2: Test license activation with invalid key (should return 404)
    console.log('\n[Test 2] Testing license activation endpoint...')
    await makeRequest('POST', '/api/license/activate', {
      licenseKey: 'DTS-TEST-1234-5678',
    })

    // Test 3: Check CORS headers
    console.log('\n[Test 3] Checking CORS configuration...')
    await makeRequest('OPTIONS', '/api/license/activate')

    console.log('\n' + '='.repeat(60))
    console.log('DIAGNOSTICS COMPLETE')
    console.log('='.repeat(60))
    console.log('\nNext steps:')
    console.log('1. If all tests pass, your API is working correctly')
    console.log('2. If tests fail, check Vercel logs:')
    console.log('   https://vercel.com/dashboard → Your Project → Logs')
    console.log('3. Verify environment variables in Vercel:')
    console.log('   - NEXT_PUBLIC_API_URL')
    console.log('   - MONGODB_URI')
    console.log('   - NEXTAUTH_SECRET')
  } catch (error) {
    console.error('\n❌ Diagnostics failed:', error.message)
  }
}

runDiagnostics()
