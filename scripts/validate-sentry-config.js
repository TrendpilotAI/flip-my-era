#!/usr/bin/env node

/**
 * Script to validate Sentry configuration
 * Checks DSN format, environment variables, and configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE = path.join(__dirname, '..', '.env.production');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateDSN(dsn) {
  if (!dsn) {
    return { valid: false, error: 'DSN is empty' };
  }

  // Sentry DSN format: https://PUBLIC_KEY@oORGANIZATION.ingest.REGION.sentry.io/PROJECT_ID
  const dsnPattern = /^https:\/\/([a-f0-9]{32})@o([0-9]+)\.ingest\.([a-z]+)\.sentry\.io\/([0-9]+)$/;
  const match = dsn.match(dsnPattern);

  if (!match) {
    return { valid: false, error: 'DSN format is invalid' };
  }

  const [, publicKey, organizationId, region, projectId] = match;

  return {
    valid: true,
    publicKey,
    organizationId: `o${organizationId}`,
    region,
    projectId,
  };
}

function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const envVars = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  }

  return envVars;
}

async function main() {
  log('\n🔍 Sentry Configuration Validator\n', 'cyan');

  const envVars = readEnvFile();

  // Check DSN
  log('1. Checking Sentry DSN...', 'blue');
  const dsn = envVars.VITE_SENTRY_DSN;
  if (!dsn) {
    log('   ❌ VITE_SENTRY_DSN is not set', 'red');
    return;
  }

  log(`   Found: ${dsn.substring(0, 50)}...`, 'cyan');
  const dsnValidation = validateDSN(dsn);
  if (!dsnValidation.valid) {
    log(`   ❌ Invalid DSN: ${dsnValidation.error}`, 'red');
    log('   Expected format: https://PUBLIC_KEY@oORGANIZATION.ingest.REGION.sentry.io/PROJECT_ID', 'yellow');
    return;
  }

  log('   ✅ DSN format is valid', 'green');
  log(`   Public Key: ${dsnValidation.publicKey}`, 'cyan');
  log(`   Organization: ${dsnValidation.organizationId}`, 'cyan');
  log(`   Region: ${dsnValidation.region}`, 'cyan');
  log(`   Project ID: ${dsnValidation.projectId}`, 'cyan');

  // Check Project ID matches
  log('\n2. Checking Project ID consistency...', 'blue');
  const projectId = envVars.VITE_SENTRY_PROJECT;
  if (projectId) {
    if (projectId === dsnValidation.projectId) {
      log(`   ✅ VITE_SENTRY_PROJECT matches DSN project ID: ${projectId}`, 'green');
    } else {
      log(`   ⚠️  VITE_SENTRY_PROJECT (${projectId}) doesn't match DSN project ID (${dsnValidation.projectId})`, 'yellow');
    }
  } else {
    log('   ⚠️  VITE_SENTRY_PROJECT is not set (optional)', 'yellow');
  }

  // Check environment
  log('\n3. Checking environment configuration...', 'blue');
  const sentryEnv = envVars.VITE_SENTRY_ENVIRONMENT;
  const appEnv = envVars.VITE_APP_ENV;

  if (sentryEnv) {
    log(`   VITE_SENTRY_ENVIRONMENT: ${sentryEnv}`, 'cyan');
    if (sentryEnv === 'production') {
      log('   ✅ Sentry environment is set to production', 'green');
    } else {
      log(`   ⚠️  Sentry environment is "${sentryEnv}", expected "production"`, 'yellow');
    }
  } else {
    log('   ⚠️  VITE_SENTRY_ENVIRONMENT is not set', 'yellow');
  }

  if (appEnv) {
    log(`   VITE_APP_ENV: ${appEnv}`, 'cyan');
    if (appEnv === 'production') {
      log('   ✅ App environment is set to production', 'green');
    } else {
      log(`   ⚠️  App environment is "${appEnv}", expected "production"`, 'yellow');
    }
  } else {
    log('   ⚠️  VITE_APP_ENV is not set (will default to "development")', 'yellow');
    log('   ⚠️  Note: Sentry code uses VITE_APP_ENV, not VITE_SENTRY_ENVIRONMENT', 'yellow');
  }

  // Check OTLP endpoints
  log('\n4. Checking OpenTelemetry endpoints...', 'blue');
  const otlpEndpoint = envVars.VITE_OTLP_ENDPOINT;
  if (otlpEndpoint) {
    const expectedOtlp = `https://${dsnValidation.organizationId}.ingest.${dsnValidation.region}.sentry.io/api/${dsnValidation.projectId}/integration//otlp`;
    if (otlpEndpoint === expectedOtlp) {
      log('   ✅ OTLP endpoint matches DSN configuration', 'green');
    } else {
      log(`   ⚠️  OTLP endpoint may not match DSN`, 'yellow');
      log(`   Expected: ${expectedOtlp.substring(0, 80)}...`, 'yellow');
      log(`   Found: ${otlpEndpoint.substring(0, 80)}...`, 'yellow');
    }
  } else {
    log('   ⚠️  VITE_OTLP_ENDPOINT is not set (optional for OpenTelemetry)', 'yellow');
  }

  // Summary
  log('\n📋 Summary:', 'cyan');
  log('   ✅ DSN format is valid', 'green');
  if (appEnv === 'production' && sentryEnv === 'production') {
    log('   ✅ Environment is correctly set to production', 'green');
  } else {
    log('   ⚠️  Environment may need adjustment', 'yellow');
  }

  log('\n💡 Recommendation:', 'cyan');
  if (!appEnv || appEnv !== 'production') {
    log('   Add or update: VITE_APP_ENV=production', 'yellow');
    log('   (This is what the Sentry code actually uses)', 'yellow');
  }
  log('\n');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

