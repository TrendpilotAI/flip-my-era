#!/usr/bin/env node
/**
 * FlipMyEra E2E Test Suite
 * Tests: signup/auth, story generation, Stripe billing
 * Uses: Playwright (headless Chrome) + AgentMail for email verification
 */

import { chromium } from 'playwright';

const SITE_URL = 'https://flipmyera.com';
const TEST_EMAIL = 'flipmyera-m1@agentmail.to';
const AGENTMAIL_KEY = 'am_us_c4ceaa87b34f442a50e28b643dba79b8a5eac4a39424f8f5f8f802a469d9caeb';
const SCREENSHOTS_DIR = './e2e-screenshots';

// Helper: wait and take screenshot
async function screenshot(page, name) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}`);
}

// Helper: check agentmail for verification email
async function getVerificationEmail(maxWaitSec = 60) {
  const { execSync } = await import('child_process');
  const start = Date.now();
  while (Date.now() - start < maxWaitSec * 1000) {
    const result = execSync(`python3 -c "
from agentmail import AgentMail
client = AgentMail(api_key='${AGENTMAIL_KEY}')
msgs = client.inboxes.messages.list('${TEST_EMAIL}')
for m in msgs.messages:
    print('SUBJECT:', m.subject)
    print('FROM:', m.from_address if hasattr(m, 'from_address') else 'unknown')
    print('ID:', m.message_id)
    # Get full message
    full = client.inboxes.messages.get('${TEST_EMAIL}', m.message_id)
    print('BODY:', full.text_body[:2000] if hasattr(full, 'text_body') and full.text_body else 'no text')
    print('HTML:', full.html_body[:3000] if hasattr(full, 'html_body') and full.html_body else 'no html')
    print('---END---')
"`, { encoding: 'utf-8' });
    if (result.includes('SUBJECT:')) {
      return result;
    }
    console.log('  ⏳ Waiting for verification email...');
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

// Helper: extract verification link from email
function extractVerificationLink(emailContent) {
  // Look for Clerk verification links
  const patterns = [
    /https?:\/\/[^\s"<>]*verify[^\s"<>]*/gi,
    /https?:\/\/[^\s"<>]*callback[^\s"<>]*/gi,
    /https?:\/\/[^\s"<>]*confirmation[^\s"<>]*/gi,
    /https?:\/\/clerk[^\s"<>]*/gi,
    /https?:\/\/[^\s"<>]*magic[^\s"<>]*/gi,
    /href="(https?:\/\/[^"]*)"[^>]*>[^<]*verify/gi,
    /href="(https?:\/\/[^"]*)"[^>]*>[^<]*confirm/gi,
    /href="(https?:\/\/[^"]*clerk[^"]*)"/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = emailContent.match(pattern);
    if (matches) {
      // Clean up href matches
      let link = matches[0];
      if (link.startsWith('href="')) {
        link = link.match(/href="([^"]+)"/)?.[1] || link;
      }
      return link;
    }
  }
  
  // Fallback: find any link in HTML body
  const allLinks = emailContent.match(/https?:\/\/[^\s"<>]+/g) || [];
  console.log('  All links found:', allLinks.slice(0, 10));
  return allLinks.find(l => !l.includes('unsubscribe') && !l.includes('privacy')) || null;
}

async function run() {
  const { mkdirSync } = await import('fs');
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log('🚀 Starting FlipMyEra E2E Tests');
  console.log(`   Site: ${SITE_URL}`);
  console.log(`   Email: ${TEST_EMAIL}\n`);

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  const results = { tests: [], errors: [] };

  function logResult(name, pass, details = '') {
    const status = pass ? '✅' : '❌';
    console.log(`${status} ${name}${details ? ' — ' + details : ''}`);
    results.tests.push({ name, pass, details });
  }

  try {
    // ═══════════════════════════════════════════
    // TEST 1: Homepage loads
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 1: Homepage ═══');
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot(page, '01-homepage');
    
    const title = await page.title();
    logResult('Homepage loads', true, `Title: "${title}"`);
    
    // Check for key elements
    const hasHero = await page.locator('h1, [class*="hero"]').first().isVisible().catch(() => false);
    logResult('Hero section visible', hasHero);
    
    // Check for CTA button
    const ctaBtn = page.locator('button, a').filter({ hasText: /get started|create|start|try/i }).first();
    const hasCTA = await ctaBtn.isVisible().catch(() => false);
    logResult('CTA button visible', hasCTA);

    // ═══════════════════════════════════════════
    // TEST 2: Auth / Signup Flow
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 2: Authentication ═══');
    
    // Navigate to auth page
    await page.goto(`${SITE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for Clerk to load
    await screenshot(page, '02-auth-page');
    
    const authPageLoaded = await page.locator('input[type="email"], input[name="email"], input[name="identifier"], [class*="cl-formFieldInput"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    logResult('Auth page loads with email input', authPageLoaded);
    
    if (authPageLoaded) {
      // Try to sign up with test email
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="identifier"], [class*="cl-formFieldInput"]').first();
      await emailInput.fill(TEST_EMAIL);
      await screenshot(page, '03-email-entered');
      
      // Click continue/submit
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /continue|sign up|submit|next/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, '04-after-submit');
        logResult('Email submitted', true);
        
        // Check if we need email verification (Clerk OTP or magic link)
        const hasCodeInput = await page.locator('input[name="code"], input[inputmode="numeric"], [class*="cl-otpCodeFieldInput"]').first().isVisible({ timeout: 5000 }).catch(() => false);
        const hasPasswordInput = await page.locator('input[type="password"]').first().isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasCodeInput) {
          logResult('Verification code input shown', true, 'Clerk OTP flow detected');
          
          // Wait for email
          console.log('  📧 Checking for verification email...');
          const emailContent = await getVerificationEmail(60);
          
          if (emailContent) {
            logResult('Verification email received', true);
            console.log('  Email content preview:', emailContent.substring(0, 500));
            
            // Try to extract OTP code from email
            const otpMatch = emailContent.match(/\b(\d{6})\b/);
            if (otpMatch) {
              const code = otpMatch[1];
              console.log(`  🔑 Found OTP code: ${code}`);
              
              // Enter the code
              const codeInputs = page.locator('input[name="code"], input[inputmode="numeric"], [class*="cl-otpCodeFieldInput"]');
              const count = await codeInputs.count();
              if (count === 1) {
                await codeInputs.first().fill(code);
              } else if (count >= 6) {
                // Individual digit inputs
                for (let i = 0; i < 6 && i < count; i++) {
                  await codeInputs.nth(i).fill(code[i]);
                }
              }
              await page.waitForTimeout(3000);
              await screenshot(page, '05-code-entered');
              logResult('OTP code entered', true, code);
            } else {
              // Maybe it's a magic link
              const link = extractVerificationLink(emailContent);
              if (link) {
                console.log(`  🔗 Found verification link: ${link}`);
                await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(3000);
                await screenshot(page, '05-magic-link-followed');
                logResult('Magic link followed', true);
              } else {
                logResult('Could not extract code or link from email', false);
              }
            }
          } else {
            logResult('Verification email received', false, 'Timed out after 60s');
          }
        } else if (hasPasswordInput) {
          logResult('Password input shown', true, 'Password-based auth');
          // For password-based signup, use a test password
          await page.locator('input[type="password"]').first().fill('TestPass123!@#');
          await page.waitForTimeout(1000);
          await screenshot(page, '05-password-entered');
          
          const signupBtn = page.locator('button[type="submit"]').first();
          if (await signupBtn.isVisible()) {
            await signupBtn.click();
            await page.waitForTimeout(5000);
            await screenshot(page, '06-after-signup');
          }
        } else {
          await screenshot(page, '05-unexpected-state');
          logResult('Auth flow next step', false, 'No code input or password field found');
          // Log page content for debugging
          const bodyText = await page.locator('body').innerText().catch(() => '');
          console.log('  Page text:', bodyText.substring(0, 500));
        }
        
        // Check if we landed on dashboard/stories (successful auth)
        await page.waitForTimeout(3000);
        const currentUrl = page.url();
        const isLoggedIn = currentUrl.includes('/dashboard') || currentUrl.includes('/stories') || currentUrl.includes('/onboarding');
        logResult('Post-auth redirect', isLoggedIn, `URL: ${currentUrl}`);
        if (isLoggedIn) {
          await screenshot(page, '06-logged-in');
        }
      } else {
        logResult('Submit button found', false);
      }
    }

    // ═══════════════════════════════════════════
    // TEST 3: Story Generation Flow
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 3: Story Generation ═══');
    
    // Check if we're logged in, if not try to access story page
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/stories') || currentUrl.includes('/onboarding')) {
      // Navigate to story creation
      await page.goto(`${SITE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await screenshot(page, '10-dashboard');
      
      // Look for "Create Story" or "New Story" button
      const createBtn = page.locator('button, a').filter({ hasText: /create|new story|start|generate/i }).first();
      const hasCreateBtn = await createBtn.isVisible().catch(() => false);
      logResult('Create story button visible', hasCreateBtn);
      
      if (hasCreateBtn) {
        await createBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, '11-story-wizard');
        
        // Check for era selection
        const hasEraSelector = await page.locator('[class*="era"], [data-era], button, [role="radio"]')
          .filter({ hasText: /lover|fearless|midnights|folklore|reputation|red|1989|speak now|debut|tortured/i })
          .first().isVisible({ timeout: 5000 }).catch(() => false);
        logResult('Era selection visible', hasEraSelector);
        
        if (hasEraSelector) {
          // Select an era
          const eraOption = page.locator('button, [role="radio"], [class*="card"]')
            .filter({ hasText: /lover/i }).first();
          if (await eraOption.isVisible().catch(() => false)) {
            await eraOption.click();
            await page.waitForTimeout(2000);
            await screenshot(page, '12-era-selected');
            logResult('Era selected (Lover)', true);
          }
          
          // Look for next/continue button
          const nextBtn = page.locator('button').filter({ hasText: /next|continue|proceed/i }).first();
          if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click();
            await page.waitForTimeout(2000);
            await screenshot(page, '13-after-era-next');
            logResult('Proceeded past era selection', true);
            
            // Continue through wizard steps
            for (let step = 1; step <= 5; step++) {
              // Try clicking visible options/selections
              const options = page.locator('[class*="card"], [role="radio"], button[class*="option"]').filter({ hasText: /.+/ });
              const optCount = await options.count();
              if (optCount > 0) {
                await options.first().click().catch(() => {});
                await page.waitForTimeout(1500);
              }
              
              // Try to proceed
              const nextStep = page.locator('button').filter({ hasText: /next|continue|generate|create|proceed/i }).first();
              if (await nextStep.isVisible().catch(() => false)) {
                await nextStep.click();
                await page.waitForTimeout(3000);
                await screenshot(page, `14-wizard-step-${step}`);
              } else {
                break;
              }
            }
          }
        }
      }
    } else {
      logResult('Story generation test', false, 'Not logged in — skipping');
      
      // Test the story wizard on homepage instead
      console.log('  Testing homepage story wizard...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Look for story wizard on homepage
      const wizardOnHome = await page.locator('[class*="wizard"], [class*="story"], [class*="era"]')
        .filter({ hasText: /era|lover|folklore/i })
        .first().isVisible({ timeout: 5000 }).catch(() => false);
      logResult('Story wizard on homepage', wizardOnHome);
      if (wizardOnHome) {
        await screenshot(page, '10-homepage-wizard');
      }
    }

    // ═══════════════════════════════════════════
    // TEST 4: Stripe / Billing
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 4: Stripe & Billing ═══');
    
    // Visit checkout/pricing page
    await page.goto(`${SITE_URL}/plans`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '20-plans-page');
    
    const hasPlans = await page.locator('[class*="plan"], [class*="price"], [class*="tier"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasPricing = await page.locator('text=/\\$\\d+/').first().isVisible({ timeout: 3000 }).catch(() => false);
    logResult('Plans/pricing page loads', hasPlans || hasPricing);
    
    // Check for Stripe integration
    const hasStripeBtn = await page.locator('button').filter({ hasText: /subscribe|buy|purchase|upgrade|checkout/i }).first().isVisible().catch(() => false);
    logResult('Stripe checkout button visible', hasStripeBtn);
    
    // Check credits page
    await page.goto(`${SITE_URL}/credits`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '21-credits-page');
    
    const creditsPageOk = page.url().includes('/credits') || page.url().includes('/auth');
    logResult('Credits page accessible', creditsPageOk, `Redirected to: ${page.url()}`);
    
    // Check for Stripe.js loaded
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    const stripeLoaded = await page.evaluate(() => {
      return typeof window.Stripe !== 'undefined' || 
             document.querySelector('script[src*="stripe"]') !== null;
    });
    logResult('Stripe.js loaded on page', stripeLoaded);

    // ═══════════════════════════════════════════
    // TEST 5: SEO Pages
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 5: SEO & Meta ═══');
    
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => null);
    logResult('Meta description present', !!metaDesc, metaDesc?.substring(0, 60));
    
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => null);
    logResult('OG title present', !!ogTitle, ogTitle?.substring(0, 60));
    
    // Check an SEO page
    const seoResp = await page.goto(`${SITE_URL}/taylor-swift-eras-tour-ebook`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
    logResult('SEO page loads', seoResp?.ok() || false, `/taylor-swift-eras-tour-ebook`);
    if (seoResp?.ok()) {
      await screenshot(page, '30-seo-page');
    }

    // ═══════════════════════════════════════════
    // TEST 6: Feature-flagged routes return 404
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 6: Feature Flags ═══');
    
    const flaggedRoutes = ['/marketplace', '/affiliates', '/gift-cards', '/images/cover-generator'];
    for (const route of flaggedRoutes) {
      await page.goto(`${SITE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      const is404 = await page.locator('text=/not found|404|page.*exist/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      const redirectedToAuth = page.url().includes('/auth');
      logResult(`${route} hidden`, is404 || redirectedToAuth, is404 ? '404 shown' : redirectedToAuth ? 'redirected to auth' : 'unknown state');
    }

    // ═══════════════════════════════════════════
    // TEST 7: Legal pages
    // ═══════════════════════════════════════════
    console.log('\n═══ TEST 7: Legal Pages ═══');
    
    for (const legalPath of ['/terms', '/privacy']) {
      const resp = await page.goto(`${SITE_URL}${legalPath}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
      logResult(`${legalPath} loads`, resp?.ok() || false);
    }

    // ═══════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════
    console.log('\n═══════════════════════════════════════');
    console.log('📊 E2E TEST SUMMARY');
    console.log('═══════════════════════════════════════');
    
    const passed = results.tests.filter(t => t.pass).length;
    const failed = results.tests.filter(t => !t.pass).length;
    const total = results.tests.length;
    
    console.log(`\n  ✅ Passed: ${passed}/${total}`);
    console.log(`  ❌ Failed: ${failed}/${total}`);
    
    if (failed > 0) {
      console.log('\n  Failed tests:');
      results.tests.filter(t => !t.pass).forEach(t => {
        console.log(`    ❌ ${t.name}${t.details ? ' — ' + t.details : ''}`);
      });
    }
    
    if (errors.length > 0) {
      console.log(`\n  ⚠️  Console errors (${errors.length}):`);
      errors.slice(0, 10).forEach(e => console.log(`    ${e.substring(0, 120)}`));
    }
    
    // Write results JSON
    const { writeFileSync } = await import('fs');
    writeFileSync(`${SCREENSHOTS_DIR}/results.json`, JSON.stringify(results, null, 2));
    console.log(`\n  📁 Screenshots: ${SCREENSHOTS_DIR}/`);
    console.log(`  📄 Results: ${SCREENSHOTS_DIR}/results.json`);

  } catch (err) {
    console.error('💥 Fatal error:', err.message);
    await screenshot(page, 'error-state').catch(() => {});
  } finally {
    await browser.close();
  }
}

run();
