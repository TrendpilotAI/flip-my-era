#!/usr/bin/env node

/**
 * Script to update .env.production with live Stripe keys and Sentry production values
 * 
 * Usage:
 *   node scripts/update-production-env.js
 * 
 * Or with environment variables:
 *   STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_... \
 *   STRIPE_LIVE_SECRET_KEY=sk_live_... \
 *   SENTRY_PRODUCTION_DSN=https://... \
 *   node scripts/update-production-env.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE = path.join(__dirname, '..', '.env.production');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function writeEnvFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function parseEnvFile(content) {
  const lines = content.split('\n');
  const envVars = {};
  const otherLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      otherLines.push(line);
      continue;
    }
    
    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    } else {
      otherLines.push(line);
    }
  }
  
  return { envVars, otherLines };
}

function updateEnvVars(envVars, updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      envVars[key] = value;
      log(`✓ Updated ${key}`, 'green');
    }
  }
  return envVars;
}

function formatEnvFile(envVars, otherLines) {
  const result = [];
  
  // Add other lines (comments, empty lines, etc.)
  for (const line of otherLines) {
    result.push(line);
  }
  
  // Add environment variables
  const sortedKeys = Object.keys(envVars).sort();
  for (const key of sortedKeys) {
    // Skip adding if it's already in otherLines (to preserve structure)
    if (!otherLines.some(line => line.includes(`${key}=`))) {
      result.push(`${key}=${envVars[key]}`);
    }
  }
  
  return result.join('\n');
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  log('\n🚀 Production Environment Configuration Updater\n', 'cyan');
  
  // Check if .env.production exists
  if (!fs.existsSync(ENV_FILE)) {
    log('❌ .env.production file not found!', 'red');
    log('   Please create it first by copying .env.development', 'yellow');
    process.exit(1);
  }
  
  // Read current .env.production
  const currentContent = readEnvFile(ENV_FILE);
  const { envVars, otherLines } = parseEnvFile(currentContent);
  
  log('📝 Current configuration:', 'cyan');
  log(`   Stripe Publishable: ${envVars.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) || 'not set'}...`);
  log(`   Stripe Secret: ${envVars.STRIPE_SECRET_KEY?.substring(0, 20) || 'not set'}...`);
  log(`   Sentry DSN: ${envVars.VITE_SENTRY_DSN?.substring(0, 30) || 'not set'}...`);
  log(`   Sentry Environment: ${envVars.VITE_SENTRY_ENVIRONMENT || 'not set'}\n`);
  
  const updates = {};
  
  // Check for environment variables first
  if (process.env.STRIPE_LIVE_PUBLISHABLE_KEY) {
    updates.VITE_STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
    log('✓ Found Stripe publishable key from environment', 'green');
  } else {
    const publishableKey = await promptUser('Enter Stripe Live Publishable Key (pk_live_...): ');
    if (publishableKey) {
      if (!publishableKey.startsWith('pk_live_')) {
        log('⚠️  Warning: Key should start with pk_live_', 'yellow');
      }
      updates.VITE_STRIPE_PUBLISHABLE_KEY = publishableKey;
    }
  }
  
  if (process.env.STRIPE_LIVE_SECRET_KEY) {
    updates.STRIPE_SECRET_KEY = process.env.STRIPE_LIVE_SECRET_KEY;
    updates.VITE_STRIPE_SECRET_KEY = process.env.STRIPE_LIVE_SECRET_KEY;
    log('✓ Found Stripe secret key from environment', 'green');
  } else {
    const secretKey = await promptUser('Enter Stripe Live Secret Key (sk_live_...): ');
    if (secretKey) {
      if (!secretKey.startsWith('sk_live_')) {
        log('⚠️  Warning: Key should start with sk_live_', 'yellow');
      }
      updates.STRIPE_SECRET_KEY = secretKey;
      updates.VITE_STRIPE_SECRET_KEY = secretKey; // Also update VITE version if it exists
    }
  }
  
  if (process.env.SENTRY_PRODUCTION_DSN) {
    updates.VITE_SENTRY_DSN = process.env.SENTRY_PRODUCTION_DSN;
    log('✓ Found Sentry DSN from environment', 'green');
  } else {
    const sentryDsn = await promptUser('Enter Sentry Production DSN (or press Enter to keep current): ');
    if (sentryDsn) {
      updates.VITE_SENTRY_DSN = sentryDsn;
    }
  }
  
  // Always update Sentry environment to production
  updates.VITE_SENTRY_ENVIRONMENT = 'production';
  log('✓ Updated Sentry environment to "production"', 'green');
  
  // Update environment variables
  const updatedEnvVars = updateEnvVars(envVars, updates);
  
  // Rebuild the file content
  let updatedContent = currentContent;
  
  // Replace existing values
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      // Replace existing key=value or add new one
      const regex = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=.*$`, 'm');
      if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new key at the end
        updatedContent += `\n${key}=${value}`;
      }
    }
  }
  
  // Write updated file
  writeEnvFile(ENV_FILE, updatedContent);
  
  log('\n✅ Successfully updated .env.production!', 'green');
  log('\n📋 Summary of changes:', 'cyan');
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const displayValue = value.length > 50 ? `${value.substring(0, 47)}...` : value;
      log(`   ${key}=${displayValue}`, 'green');
    }
  }
  
  log('\n⚠️  Remember to:', 'yellow');
  log('   1. Verify all keys are correct');
  log('   2. Never commit .env.production to version control');
  log('   3. Set these values in your production hosting environment\n');
}

// Run the script
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

