// Test script to debug JWT token issues with Supabase Edge Functions
// Run this with: node test-jwt-debug.js

const https = require('https');

// Replace with your actual values
const SUPABASE_URL = 'https://tusdijypopftcmlenahr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pKqpwiCj6o5J8X-7tMuIiw_2vXqBYlr';

// You'll need to get a real JWT token from your Clerk-authenticated app
// For now, this is a placeholder - replace with actual token
const CLERK_JWT_TOKEN = 'your-clerk-jwt-token-here';

function testEdgeFunction() {
  const options = {
    hostname: 'tusdijypopftcmlenahr.supabase.co',
    path: '/functions/v1/credits',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CLERK_JWT_TOKEN}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
  };

  console.log('Testing Edge Function with JWT token...');
  console.log('Token length:', CLERK_JWT_TOKEN.length);
  console.log('Token preview:', CLERK_JWT_TOKEN.substring(0, 50) + '...');

  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response body:', data);

      try {
        const jsonResponse = JSON.parse(data);
        console.log('Parsed response:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request failed:', error);
  });

  req.end();
}

// To get the JWT token, you can:
// 1. Log into your app
// 2. Open browser dev tools
// 3. Go to Application/Storage > Local Storage
// 4. Look for Clerk session data
// 5. Or use Clerk's getToken() in the console

testEdgeFunction();