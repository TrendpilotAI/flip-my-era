#!/usr/bin/env node
/**
 * FlipMyEra E2E Test Suite v2
 * Fixed auth flow: Register tab + email/password
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const SITE_URL = 'https://flipmyera.com';
const TEST_EMAIL = 'flipmyera-m1@agentmail.to';
const TEST_PASSWORD = 'FlipTest2026!@#Secure';
const AGENTMAIL_KEY = 'am_us_c4ceaa87b34f442a50e28b643dba79b8a5eac4a39424f8f5f8f802a469d9caeb';
const DIR = './e2e-screenshots';

mkdirSync(DIR, { recursive: true });

async function ss(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}`);
}

function checkEmail() {
  try {
    return execSync(`python3 -c "
from agentmail import AgentMail
client = AgentMail(api_key='${AGENTMAIL_KEY}')
msgs = client.inboxes.messages.list('${TEST_EMAIL}')
for m in msgs.messages:
    print('SUBJECT:', m.subject)
    print('ID:', m.message_id)
    full = client.inboxes.messages.get('${TEST_EMAIL}', m.message_id)
    body = ''
    if hasattr(full, 'html_body') and full.html_body: body = full.html_body[:5000]
    elif hasattr(full, 'text_body') and full.text_body: body = full.text_body[:5000]
    print('BODY:', body)
    print('---END---')
"`, { encoding: 'utf-8' });
  } catch { return ''; }
}

async function waitForEmail(maxSec = 90) {
  const start = Date.now();
  while (Date.now() - start < maxSec * 1000) {
    const content = checkEmail();
    if (content.includes('SUBJECT:')) return content;
    console.log('  ⏳ Waiting for email...');
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

const results = [];
function log(name, pass, detail = '') {
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  results.push({ name, pass, detail });
}

async function run() {
  console.log('🚀 FlipMyEra E2E Tests v2\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));

  try {
    // ═══ HOMEPAGE ═══
    console.log('═══ HOMEPAGE ═══');
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await ss(page, '01-homepage');
    log('Homepage loads', true, await page.title());

    // Close welcome modal if present
    const closeModal = page.locator('button').filter({ hasText: /×|close/i }).first();
    if (await closeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeModal.click();
      await page.waitForTimeout(500);
    }
    // Or click the CTA
    const ctaBtn = page.locator('button').filter({ hasText: /pick your era|start creating/i }).first();
    if (await ctaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      log('Welcome modal CTA visible', true);
    }

    // Check meta tags
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
    log('Meta description', !!metaDesc, metaDesc?.substring(0, 80) || 'MISSING');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null);
    log('OG title', !!ogTitle, ogTitle?.substring(0, 80) || 'MISSING');

    // ═══ REGISTRATION ═══
    console.log('\n═══ REGISTRATION ═══');
    await page.goto(`${SITE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '02-auth-page');

    // Click "Register" tab
    const registerTab = page.locator('button, [role="tab"]').filter({ hasText: /register/i }).first();
    const hasRegisterTab = await registerTab.isVisible({ timeout: 3000 }).catch(() => false);
    log('Register tab visible', hasRegisterTab);

    if (hasRegisterTab) {
      await registerTab.click();
      await page.waitForTimeout(1000);
      await ss(page, '03-register-tab');

      // Check what fields are visible now
      const fields = await page.locator('input').evaluateAll(els =>
        els.map(e => ({ type: e.type, name: e.name, placeholder: e.placeholder, visible: e.offsetParent !== null }))
      );
      console.log('  Form fields:', JSON.stringify(fields.filter(f => f.visible)));

      // Fill email
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      // Fill password
      const passwordInputs = page.locator('input[type="password"]');
      const pwCount = await passwordInputs.count();
      console.log(`  Password fields: ${pwCount}`);
      
      if (pwCount >= 1) {
        await passwordInputs.nth(0).fill(TEST_PASSWORD);
      }
      if (pwCount >= 2) {
        await passwordInputs.nth(1).fill(TEST_PASSWORD); // Confirm password
      }

      // Check for name/username fields
      const nameInput = page.locator('input[name="name"], input[name="username"], input[name="displayName"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('FlipMyEra Tester');
      }

      await ss(page, '04-register-filled');

      // Submit
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /register|sign up|create account|submit/i }).first();
      const hasSubmit = await submitBtn.isVisible().catch(() => false);
      log('Register submit button visible', hasSubmit);

      if (hasSubmit) {
        await submitBtn.click();
        await page.waitForTimeout(5000);
        await ss(page, '05-after-register');

        const afterUrl = page.url();
        console.log(`  After register URL: ${afterUrl}`);

        // Check for errors on page
        const errorText = await page.locator('[class*="error"], [class*="alert"], [role="alert"]').first().innerText().catch(() => '');
        if (errorText) {
          console.log(`  ⚠️ Form error: ${errorText}`);
          log('Registration submitted', false, errorText);
        }

        // Check if email verification needed
        const needsVerification = await page.locator('text=/verify|verification|check.*email|confirm.*email/i').first().isVisible({ timeout: 3000 }).catch(() => false);
        if (needsVerification) {
          log('Email verification required', true);
          
          console.log('  📧 Waiting for verification email...');
          const emailContent = await waitForEmail(90);
          
          if (emailContent) {
            log('Verification email received', true);
            
            // Extract verification link
            const linkMatch = emailContent.match(/href="(https?:\/\/[^"]+)"/g) || [];
            const links = linkMatch.map(l => l.match(/href="([^"]+)"/)?.[1]).filter(Boolean);
            console.log(`  Found ${links.length} links in email`);
            links.forEach(l => console.log(`    ${l}`));
            
            const verifyLink = links.find(l =>
              l.includes('verify') || l.includes('confirm') || l.includes('callback') ||
              l.includes('token') || l.includes('flipmyera')
            ) || links[0];
            
            if (verifyLink) {
              console.log(`  🔗 Following: ${verifyLink}`);
              await page.goto(verifyLink, { waitUntil: 'networkidle', timeout: 30000 });
              await page.waitForTimeout(3000);
              await ss(page, '06-after-verify');
              log('Verification link followed', true);
            }

            // Also check for OTP code
            const otpMatch = emailContent.match(/\b(\d{6})\b/);
            if (otpMatch) {
              console.log(`  🔑 OTP code: ${otpMatch[1]}`);
            }
          } else {
            log('Verification email received', false, 'Timed out');
          }
        }

        // Check if logged in now
        await page.waitForTimeout(2000);
        const loggedInUrl = page.url();
        const isLoggedIn = loggedInUrl.includes('/dashboard') || loggedInUrl.includes('/stories') || loggedInUrl.includes('/onboarding');
        log('Successfully logged in', isLoggedIn, loggedInUrl);
        await ss(page, '07-post-auth-state');

        // If still on auth, try signing in with the account we just created
        if (!isLoggedIn && loggedInUrl.includes('/auth')) {
          console.log('  Trying sign-in with created account...');
          
          // Make sure we're on Sign In tab
          const signInTab = page.locator('button, [role="tab"]').filter({ hasText: /sign in/i }).first();
          if (await signInTab.isVisible().catch(() => false)) {
            await signInTab.click();
            await page.waitForTimeout(1000);
          }
          
          await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL);
          await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
          
          const signInBtn = page.locator('button[type="submit"], button').filter({ hasText: /sign in/i }).first();
          if (await signInBtn.isVisible().catch(() => false)) {
            await signInBtn.click();
            await page.waitForTimeout(5000);
            await ss(page, '08-after-signin');
            
            const signInUrl = page.url();
            const signedIn = signInUrl.includes('/dashboard') || signInUrl.includes('/stories') || signInUrl.includes('/onboarding');
            log('Sign-in successful', signedIn, signInUrl);
          }
        }
      }
    }

    // ═══ STORY GENERATION ═══
    console.log('\n═══ STORY GENERATION ═══');
    const isAuth = page.url().includes('/dashboard') || page.url().includes('/stories') || page.url().includes('/onboarding');
    
    if (isAuth) {
      await page.goto(`${SITE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await ss(page, '10-dashboard');
      log('Dashboard loaded', true);

      // Find create story button
      const createBtn = page.locator('button, a').filter({ hasText: /create|new.*story|start|generate|pick.*era/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(3000);
        await ss(page, '11-story-start');
        log('Story creation started', true);

        // Step through the wizard
        for (let step = 0; step < 8; step++) {
          // Look for era/option cards to click
          const cards = page.locator('[class*="card"], [role="radio"], [role="option"], [class*="option"], [class*="era"]')
            .filter({ hasText: /.{3,}/ });
          const cardCount = await cards.count();
          
          if (cardCount > 0) {
            // Click first available option
            try {
              await cards.first().click();
              await page.waitForTimeout(1500);
              console.log(`  Step ${step}: Selected option (${cardCount} choices)`);
            } catch {}
          }

          // Try to advance
          const advBtn = page.locator('button:visible').filter({ hasText: /next|continue|generate|create|start|proceed/i }).first();
          if (await advBtn.isVisible().catch(() => false)) {
            const btnText = await advBtn.innerText().catch(() => '');
            await advBtn.click();
            await page.waitForTimeout(3000);
            await ss(page, `12-wizard-step-${step}`);
            console.log(`  Step ${step}: Clicked "${btnText.trim()}"`);
            
            // If we hit "Generate", wait longer
            if (btnText.match(/generate|create/i)) {
              console.log('  ⏳ Story generating...');
              await page.waitForTimeout(15000);
              await ss(page, '13-generation-result');
              
              // Check for story content
              const hasStoryContent = await page.locator('[class*="story"], [class*="chapter"], [class*="ebook"]').first().isVisible({ timeout: 10000 }).catch(() => false);
              log('Story content generated', hasStoryContent);
              break;
            }
          } else {
            console.log(`  Step ${step}: No advance button found`);
            await ss(page, `12-wizard-stuck-${step}`);
            break;
          }
        }
      } else {
        log('Create story button found', false);
        // Capture what's on dashboard
        const dashText = await page.locator('main, [class*="content"]').first().innerText().catch(() => '');
        console.log('  Dashboard content:', dashText.substring(0, 300));
      }
    } else {
      log('Story generation (requires auth)', false, 'Not logged in');
    }

    // ═══ STRIPE & BILLING ═══
    console.log('\n═══ STRIPE & BILLING ═══');
    
    if (isAuth) {
      // Plans page
      await page.goto(`${SITE_URL}/plans`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await ss(page, '20-plans');
      
      const onPlansPage = !page.url().includes('/auth');
      log('Plans page accessible (authed)', onPlansPage);
      
      if (onPlansPage) {
        const hasPricing = await page.locator('text=/\\$\\d/').first().isVisible({ timeout: 3000 }).catch(() => false);
        log('Pricing displayed', hasPricing);
        
        const buyBtns = page.locator('button').filter({ hasText: /buy|subscribe|upgrade|purchase|checkout|get|select/i });
        const buyCount = await buyBtns.count();
        log('Purchase buttons visible', buyCount > 0, `${buyCount} buttons`);
      }
      
      // Credits page
      await page.goto(`${SITE_URL}/credits`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await ss(page, '21-credits');
      log('Credits page loads', !page.url().includes('/auth'));
      
      // Check credit balance display
      const hasBalance = await page.locator('text=/credit|balance|\\d+ remaining/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      log('Credit balance displayed', hasBalance);
    } else {
      // Test that billing pages redirect to auth when not logged in
      await page.goto(`${SITE_URL}/plans`, { waitUntil: 'networkidle', timeout: 15000 });
      log('Plans redirects to auth', page.url().includes('/auth'));
    }

    // ═══ FEATURE FLAGS ═══
    console.log('\n═══ FEATURE FLAGS ═══');
    for (const route of ['/marketplace', '/affiliates', '/gift-cards']) {
      await page.goto(`${SITE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      const is404 = await page.locator('text=/not found|404/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      log(`${route} flagged off`, is404 || page.url().includes('/auth'), is404 ? '404' : 'redirected');
    }

    // ═══ LEGAL & SEO ═══
    console.log('\n═══ LEGAL & SEO ═══');
    for (const path of ['/terms', '/privacy', '/taylor-swift-eras-tour-ebook']) {
      const resp = await page.goto(`${SITE_URL}${path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
      log(`${path} loads`, resp?.ok() || false);
    }

  } catch (err) {
    console.error('💥 Fatal:', err.message);
    await ss(page, 'error').catch(() => {});
  } finally {
    await browser.close();
  }

  // ═══ SUMMARY ═══
  console.log('\n═══════════════════════════════════');
  console.log('📊 E2E RESULTS');
  console.log('═══════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  ✅ ${passed}  ❌ ${failed}  Total: ${results.length}`);
  if (failed) {
    console.log('\n  Failures:');
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.name} — ${r.detail}`));
  }
  if (consoleErrors.length) {
    console.log(`\n  Console errors: ${consoleErrors.length}`);
    consoleErrors.filter(e => !e.includes('404 Error: User attempted')).slice(0, 5).forEach(e => console.log(`    ${e.substring(0, 150)}`));
  }
  writeFileSync(`${DIR}/results-v2.json`, JSON.stringify({ results, consoleErrors }, null, 2));
}

run();
