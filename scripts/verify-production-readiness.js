#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Checks code configuration and provides deployment checklist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Production Deployment Verification\n');
console.log('=' .repeat(50));

let allChecksPassed = true;

// Check 1: Sentry package installed
console.log('\n1. Checking Sentry package installation...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.dependencies['@sentry/react']) {
    console.log('   ✅ @sentry/react is installed');
  } else {
    console.log('   ❌ @sentry/react is NOT installed');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ⚠️  Could not read package.json');
}

// Check 2: Sentry integration file exists
console.log('\n2. Checking Sentry integration code...');
const sentryFile = 'src/core/integrations/sentry.ts';
if (fs.existsSync(sentryFile)) {
  const sentryCode = fs.readFileSync(sentryFile, 'utf8');
  
  if (sentryCode.includes('VITE_SENTRY_DSN')) {
    console.log('   ✅ Sentry code reads VITE_SENTRY_DSN');
  } else {
    console.log('   ❌ Sentry code does NOT read VITE_SENTRY_DSN');
    allChecksPassed = false;
  }
  
  if (sentryCode.includes('enabled: import.meta.env.PROD')) {
    console.log('   ✅ Sentry only enables in production');
  } else {
    console.log('   ⚠️  Sentry may enable in development (check code)');
  }
} else {
  console.log('   ❌ Sentry integration file not found');
  allChecksPassed = false;
}

// Check 3: App.tsx initializes Sentry
console.log('\n3. Checking App.tsx initialization...');
const appFile = 'src/App.tsx';
if (fs.existsSync(appFile)) {
  const appCode = fs.readFileSync(appFile, 'utf8');
  
  if (appCode.includes('initSentry()')) {
    console.log('   ✅ App.tsx calls initSentry()');
  } else {
    console.log('   ❌ App.tsx does NOT call initSentry()');
    allChecksPassed = false;
  }
  
  if (appCode.includes('from "@/core/integrations/sentry"')) {
    console.log('   ✅ Sentry is imported correctly');
  } else {
    console.log('   ⚠️  Check Sentry import statement');
  }
} else {
  console.log('   ❌ App.tsx not found');
  allChecksPassed = false;
}

// Check 4: Netlify configuration
console.log('\n4. Checking Netlify configuration...');
const netlifyFile = 'netlify.toml';
if (fs.existsSync(netlifyFile)) {
  console.log('   ✅ netlify.toml exists');
  const netlifyConfig = fs.readFileSync(netlifyFile, 'utf8');
  
  if (netlifyConfig.includes('X-Frame-Options')) {
    console.log('   ✅ Security headers configured');
  } else {
    console.log('   ⚠️  Security headers may be missing');
  }
} else {
  console.log('   ⚠️  netlify.toml not found');
}

// Check 5: Environment variable example
console.log('\n5. Checking environment variable documentation...');
const envExample = 'env.example';
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  if (envContent.includes('VITE_APP_ENV')) {
    console.log('   ✅ env.example documents VITE_APP_ENV');
  }
} else {
  console.log('   ⚠️  env.example not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Manual Steps Required:');
console.log('\n   1. Get Sentry DSN from Sentry.io dashboard');
console.log('   2. Add VITE_SENTRY_DSN to Netlify environment variables');
console.log('   3. Verify all environment variables are set in Netlify');
console.log('   4. Verify Supabase Edge Functions are deployed');
console.log('   5. Deploy to production');
console.log('   6. Run smoke tests');
console.log('   7. Monitor Sentry dashboard for 24 hours');

console.log('\n📚 Documentation:');
console.log('   - PRODUCTION_DEPLOYMENT_CHECKLIST.md');
console.log('   - PRODUCTION_SMOKE_TEST.md');
console.log('   - SENTRY_DSN_CONFIGURATION.md');

if (allChecksPassed) {
  console.log('\n✅ All code checks passed!');
  console.log('   Ready for production deployment after manual configuration.');
} else {
  console.log('\n⚠️  Some checks failed. Review errors above.');
  console.log('   Fix code issues before deploying.');
}

console.log('\n');

