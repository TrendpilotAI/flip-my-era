#!/usr/bin/env node
/**
 * Test script to verify Supabase Edge Functions are accessible
 * Usage: node scripts/test-edge-functions.js
 */

import https from 'https';

// Get from environment or use defaults
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tusdijypopftcmlenahr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Functions to test
const FUNCTIONS_TO_TEST = [
  { name: 'groq-api', method: 'POST', requiresAuth: true },
  { name: 'groq-storyline', method: 'POST', requiresAuth: true },
  { name: 'credits', method: 'GET', requiresAuth: true },
  { name: 'credits-validate', method: 'POST', requiresAuth: true },
  { name: 'stream-chapters', method: 'POST', requiresAuth: true },
  { name: 'check-subscription', method: 'GET', requiresAuth: true },
];

// Test a function endpoint
function testFunction(functionName, method = 'GET', requiresAuth = true) {
  return new Promise((resolve, reject) => {
    const path = `/functions/v1/${functionName}`;
    const options = {
      hostname: SUPABASE_URL.replace('https://', '').split('/')[0],
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
    };

    // Add auth header if required (using a placeholder - in real tests, use actual Clerk token)
    if (requiresAuth) {
      options.headers['Authorization'] = 'Bearer test-token-placeholder';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          functionName,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode < 500, // Consider 4xx as "endpoint exists" even if auth fails
        });
      });
    });

    req.on('error', (error) => {
      reject({ functionName, error: error.message });
    });

    // Send minimal body for POST requests
    if (method === 'POST') {
      req.write(JSON.stringify({}));
    }

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Supabase Edge Functions\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  const results = [];

  for (const func of FUNCTIONS_TO_TEST) {
    try {
      console.log(`Testing ${func.name}...`);
      const result = await testFunction(func.name, func.method, func.requiresAuth);
      results.push(result);

      if (result.statusCode === 401 || result.statusCode === 403) {
        console.log(`  ✅ ${func.name}: Endpoint accessible (auth required)`);
      } else if (result.statusCode < 500) {
        console.log(`  ✅ ${func.name}: Endpoint accessible (status: ${result.statusCode})`);
      } else {
        console.log(`  ❌ ${func.name}: Error (status: ${result.statusCode})`);
      }
    } catch (error) {
      console.log(`  ❌ ${func.name}: Failed - ${error.error || error.message}`);
      results.push({ functionName: func.name, error: error.error || error.message });
    }
  }

  console.log('\n📊 Summary:');
  const accessible = results.filter(r => r.statusCode && r.statusCode < 500).length;
  const failed = results.filter(r => r.error || (r.statusCode && r.statusCode >= 500)).length;
  console.log(`  ✅ Accessible: ${accessible}/${FUNCTIONS_TO_TEST.length}`);
  console.log(`  ❌ Failed: ${failed}/${FUNCTIONS_TO_TEST.length}`);

  return results;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testFunction, runTests };

