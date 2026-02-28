#!/usr/bin/env node
/**
 * FlipMyEra E2E v3 — Fixed auth selectors
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const SITE = 'https://flipmyera.com';
const EMAIL = 'flipmyera-m1@agentmail.to';
const PASS = 'FlipTest2026!@#Secure';
const AM_KEY = 'am_us_c4ceaa87b34f442a50e28b643dba79b8a5eac4a39424f8f5f8f802a469d9caeb';
const DIR = './e2e-screenshots';
mkdirSync(DIR, { recursive: true });

const results = [];
const log = (n, p, d = '') => { console.log(`${p ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`); results.push({ n, p, d }); };

async function ss(pg, name) { await pg.waitForTimeout(500); await pg.screenshot({ path: `${DIR}/${name}.png` }); console.log(`  📸 ${name}`); }

function getEmails() {
  try {
    return execSync(`python3 -c "
from agentmail import AgentMail
c = AgentMail(api_key='${AM_KEY}')
msgs = c.inboxes.messages.list('${EMAIL}')
for m in msgs.messages:
    print('SUBJ:', m.subject)
    print('ID:', m.message_id)
    full = c.inboxes.messages.get('${EMAIL}', m.message_id)
    html = getattr(full, 'html_body', '') or ''
    text = getattr(full, 'text_body', '') or ''
    print('HTML:', html[:5000])
    print('TEXT:', text[:3000])
    print('---END---')
"`, { encoding: 'utf-8' });
  } catch { return ''; }
}

async function waitEmail(sec = 90) {
  const t = Date.now();
  while (Date.now() - t < sec * 1000) {
    const r = getEmails();
    if (r.includes('SUBJ:')) return r;
    console.log('  ⏳ Waiting for email...');
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

async function run() {
  console.log('🚀 FlipMyEra E2E v3\n');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  try {
    // ═══ HOMEPAGE ═══
    console.log('═══ HOMEPAGE ═══');
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
    await ss(page, '01-home');
    log('Homepage', true, await page.title());

    // Meta tags — SPA might need JS rendering, check after page fully loaded
    const meta = await page.evaluate(() => ({
      desc: document.querySelector('meta[name="description"]')?.content,
      og: document.querySelector('meta[property="og:title"]')?.content,
    }));
    log('Meta description', !!meta.desc, meta.desc?.substring(0, 60) || 'MISSING');
    log('OG title', !!meta.og, meta.og?.substring(0, 60) || 'MISSING');

    // ═══ REGISTRATION ═══
    console.log('\n═══ REGISTRATION ═══');
    await page.goto(`${SITE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click Register tab
    await page.locator('button').filter({ hasText: /register/i }).first().click();
    await page.waitForTimeout(1000);
    await ss(page, '02-register');

    // Fill form using IDs from source code
    await page.locator('#name').fill('FlipMyEra Tester');
    await page.locator('#signup-email').fill(EMAIL);
    await page.locator('#signup-password').fill(PASS);
    await ss(page, '03-filled');
    log('Registration form filled', true);

    // Submit
    await page.locator('button[type="submit"]').filter({ hasText: /create account/i }).click();
    console.log('  Submitted registration...');
    
    // Wait for toast or redirect
    await page.waitForTimeout(5000);
    await ss(page, '04-after-submit');

    // Check for toast message
    const toastText = await page.locator('[class*="toast"], [role="status"], [data-state="open"]').first().innerText({ timeout: 5000 }).catch(() => '');
    console.log(`  Toast: "${toastText}"`);
    
    const signUpSuccess = toastText.toLowerCase().includes('check your email') || toastText.toLowerCase().includes('confirmation');
    const alreadyExists = toastText.toLowerCase().includes('already') || toastText.toLowerCase().includes('exists');
    
    if (signUpSuccess) {
      log('Registration submitted', true, 'Email confirmation required');
      
      // Wait for verification email
      console.log('  📧 Waiting for Supabase confirmation email...');
      const emailContent = await waitEmail(90);
      
      if (emailContent) {
        log('Confirmation email received', true);
        console.log('  Email preview:', emailContent.substring(0, 400));
        
        // Extract confirmation link
        const links = [...emailContent.matchAll(/https?:\/\/[^\s"<>]+/g)].map(m => m[0]);
        console.log(`  Links found: ${links.length}`);
        links.forEach(l => console.log(`    ${l}`));
        
        const confirmLink = links.find(l => 
          l.includes('confirm') || l.includes('verify') || l.includes('token') || 
          l.includes('type=signup') || l.includes('supabase')
        );
        
        if (confirmLink) {
          console.log(`  🔗 Confirming: ${confirmLink}`);
          await page.goto(confirmLink, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);
          await ss(page, '05-confirmed');
          log('Email confirmed', true, page.url());
        } else {
          log('Confirmation link found', false, 'No matching link in email');
        }
      } else {
        log('Confirmation email received', false, 'Timed out 90s');
      }
    } else if (alreadyExists) {
      log('Account already exists', true, 'Trying sign-in');
    } else {
      log('Registration response', false, toastText || 'No toast shown');
      
      // Check for inline errors
      const formError = await page.locator('[class*="error"], [class*="destructive"]').first().innerText().catch(() => '');
      if (formError) console.log(`  Form error: ${formError}`);
    }

    // ═══ SIGN IN ═══
    console.log('\n═══ SIGN IN ═══');
    await page.goto(`${SITE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Make sure Sign In tab is active
    await page.locator('button').filter({ hasText: /^sign in$/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);

    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill(PASS);
    await ss(page, '06-signin-filled');
    
    await page.locator('button[type="submit"]').filter({ hasText: /sign in/i }).click();
    await page.waitForTimeout(5000);
    await ss(page, '07-signin-result');

    const signInToast = await page.locator('[class*="toast"], [role="status"], [data-state="open"]').first().innerText({ timeout: 3000 }).catch(() => '');
    console.log(`  Sign-in toast: "${signInToast}"`);
    
    const postUrl = page.url();
    const loggedIn = !postUrl.includes('/auth');
    log('Sign-in', loggedIn, postUrl);

    // ═══ STORY GENERATION (if logged in) ═══
    console.log('\n═══ STORY GENERATION ═══');
    if (loggedIn) {
      await page.goto(`${SITE}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await ss(page, '10-dashboard');
      log('Dashboard loaded', true);

      // Look for create button
      const createBtn = page.locator('button, a').filter({ hasText: /create|new|start|generate|pick.*era/i }).first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(3000);
        await ss(page, '11-wizard-start');
        log('Story wizard opened', true);

        // Walk through wizard - click options and advance
        for (let i = 0; i < 10; i++) {
          // Select first visible option card
          const option = page.locator('[class*="card"]:not([class*="card-"]), [role="radio"], [data-value]').filter({ hasText: /.{3,}/ }).first();
          if (await option.isVisible().catch(() => false)) {
            await option.click().catch(() => {});
            await page.waitForTimeout(1000);
          }

          const advBtn = page.locator('button:visible').filter({ hasText: /next|continue|generate|create|start writing/i }).first();
          if (await advBtn.isVisible().catch(() => false)) {
            const txt = await advBtn.innerText();
            console.log(`  Wizard step ${i}: clicking "${txt.trim()}"`);
            await advBtn.click();
            await page.waitForTimeout(3000);
            await ss(page, `12-step-${i}`);

            if (txt.match(/generate|create/i)) {
              console.log('  ⏳ Generating story...');
              await page.waitForTimeout(30000);
              await ss(page, '13-generated');
              const hasContent = await page.locator('[class*="story"], [class*="chapter"], [class*="content"]').first().isVisible({ timeout: 10000 }).catch(() => false);
              log('Story generated', hasContent);
              break;
            }
          } else {
            await ss(page, `12-stuck-${i}`);
            break;
          }
        }
      } else {
        log('Create story button', false);
      }

      // ═══ STRIPE & BILLING ═══
      console.log('\n═══ STRIPE & BILLING ═══');
      await page.goto(`${SITE}/plans`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await ss(page, '20-plans');
      
      const hasPricing = await page.locator('text=/\\$\\d/').first().isVisible({ timeout: 5000 }).catch(() => false);
      log('Pricing visible', hasPricing);

      await page.goto(`${SITE}/credits`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await ss(page, '21-credits');
      log('Credits page', !page.url().includes('/auth'));
    } else {
      log('Story gen (needs auth)', false, 'Not logged in');
      log('Billing (needs auth)', false, 'Not logged in');
    }

    // ═══ FEATURE FLAGS ═══
    console.log('\n═══ FEATURE FLAGS ═══');
    for (const r of ['/marketplace', '/affiliates', '/gift-cards']) {
      await page.goto(`${SITE}${r}`, { waitUntil: 'networkidle', timeout: 10000 });
      const hidden = await page.locator('text=/not found|404/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      log(`${r} hidden`, hidden || page.url().includes('/auth'));
    }

    // ═══ LEGAL ═══
    console.log('\n═══ LEGAL ═══');
    for (const p of ['/terms', '/privacy']) {
      const r = await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => null);
      log(p, r?.ok() || false);
    }

  } catch (err) {
    console.error('💥', err.message);
    await ss(page, 'fatal').catch(() => {});
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n════════════════════════════');
  const ok = results.filter(r => r.p).length;
  const fail = results.filter(r => !r.p).length;
  console.log(`📊 ✅ ${ok}  ❌ ${fail}  / ${results.length}`);
  if (fail) { console.log('Failures:'); results.filter(r => !r.p).forEach(r => console.log(`  ❌ ${r.n} — ${r.d}`)); }
  if (errs.length) { console.log(`\nJS errors: ${errs.length}`); errs.slice(0, 5).forEach(e => console.log(`  ${e.substring(0, 120)}`)); }
  writeFileSync(`${DIR}/results-v3.json`, JSON.stringify(results, null, 2));
}

run();
