# FlipMyEra — Engineering & Growth Brainstorm
> Updated: 2026-03-08 | Judge Agent v2 (compound-engineering) | Post subscription-upsell sprint

---

## 🚨 P0 — IMMEDIATE ACTIONS (Blocking Revenue)

### 1. API Keys in Client Bundle — CRITICAL SECURITY
`VITE_OPENAI_API_KEY` and `VITE_GROQ_API_KEY` are embedded in the client-side JS bundle. Any browser visitor can extract these keys.

**Fix:** Remove both from Vite env entirely. The `groq-api` and `groq-storyline` edge functions already exist — frontend should call those exclusively. Route remaining OpenAI calls through a new `openai-proxy` edge function.

**Files to change:** `src/modules/shared/utils/env.ts`, `src/vite-env.d.ts`, any component calling OpenAI/Groq directly.

### 2. Billing.ts Stub Not Wired to Real Checkout
`src/modules/subscriptions/billing.ts` likely returns fake checkout URLs. The `create-checkout` Supabase edge function exists but the frontend may still be calling a stub.

**Fix:** Audit `billing.ts` — ensure `createCheckoutSession()` calls `supabase.functions.invoke('create-checkout', ...)`, not a hardcoded URL. Without this, no subscription revenue flows.

### 3. Gallery Not Showing Real User Data
Gallery page renders mock/static data. Users can't see their ebook history → destroys retention.

**Fix:** Wire gallery to `ebooks` Supabase table with RLS-filtered query, add pagination (20/page), lazy-load thumbnails.

---

## 1. 💰 NEW FEATURES (Revenue Impact)

| Feature | Revenue Impact | Effort | Priority |
|---|---|---|---|
| Referral credits (invite friends = +1 credit each) | Very High | Medium | P1 |
| Gift an ebook / gifting flow | High | Medium | P1 |
| Social sharing cards for TikTok/IG reels | Very High | Medium | P1 |
| All 13 Taylor Swift eras as prompt templates | Medium | Low | P2 |
| ePub download (in addition to PDF) | Medium | Medium | P2 |
| A/B test: $2.99 vs $4.99 per ebook | High | Low | P2 |
| Public story pages (SEO + viral) | High | High | P2 |
| Subscription tier: unlimited monthly plan | High | Medium | P2 |
| Creator marketplace (share/sell templates) | Very High | XL | P3 |

### Referral Program (Highest ROI)
Teen audiences respond strongly to invite mechanics. "Give your friend a free story, you get a free story" → low CAC, high virality. Implement with `referral_code` column in `profiles` table + credit grant on first purchase.

### Social Sharing
Primary growth channel for 13-19 audience is TikTok → IG → Pinterest. Each ebook should generate:
1. A shareable cover image (1080×1920 TikTok format)
2. A public URL: `flipmyera.com/story/{slug}`
3. Open Graph meta tags for rich previews

---

## 2. 🔧 CODE QUALITY

### Dead Code / Cleanup
- 25 `console.log` statements in production bundle (performance + info leakage)
- Debug HTML files in root: `debug-image-viewer.html`, `debug-ultimate.html`, `image-manager*.html`, `test-*.html` — should not be deployed
- `TestCredits` page publicly routed in production (`/test-credits`) — major abuse vector
- Multiple `.mjs` test scripts in root (`e2e-test.mjs`, `e2e-test-v2.mjs`, `e2e-test-v3.mjs`) — dead test runners

### DRY Violations
- Auth token extraction pattern repeated across 8+ components — extract to `useAuth()` hook
- Error toast pattern (`toast({ variant: "destructive", ... })`) duplicated 15+ times — create `useErrorToast()` helper
- Supabase query patterns for story fetching duplicated across Gallery, Dashboard, Admin

### Type Safety
- Several `any` casts in edge function response handlers — add proper response types
- `env.ts` returns `string | undefined` without narrowing — add runtime validation with Zod

---

## 3. 🧪 TESTING

### What's Missing
- E2E test for full checkout flow (credit purchase → story generation → download)
- Edge function integration tests (currently 0 Deno test coverage on create-checkout, stripe-webhook)
- Visual regression tests for ebook PDF output
- Load test for stream-chapters edge function (concurrent streaming sessions)

### Current State: 471 unit tests passing ✅
Good foundation. Need to extend to integration + E2E layers.

---

## 4. 🔗 INTEGRATIONS

| Integration | Value | Status |
|---|---|---|
| Brevo transactional email | High — purchase confirm, ebook delivery | Stubbed frontend, EF exists |
| TikTok OAuth + sharing | Very High — primary growth channel | EF exists, needs frontend wire-up |
| PostHog funnel analytics | High — understand drop-off in generation flow | Integrated but undertested |
| Stripe Customer Portal | Medium — self-serve plan management | EF exists (`stripe-portal`) |
| Apple/Google Pay | Medium — reduce checkout friction for teens | Not started |

### Brevo Email Flow (Quick Win)
The `brevo-email` edge function exists. Frontend just needs to call it after:
1. Successful checkout → "Your subscription is active" email
2. Ebook generation complete → "Your story is ready, download here" email
3. Sign-up → Welcome + first story prompt email

---

## 5. ⚙️ WORKFLOWS

### CI/CD Improvements
- Add Lighthouse CI score gates (currently `lighthouserc.js` exists but unclear if in CI)
- Add `pnpm audit` for CVE scanning in GitHub Actions
- Pre-commit: enforce no `console.log` in src/ (eslint rule)
- Auto-deploy to Netlify preview on PR + auto-comment with preview URL

### Missing: Staging Environment
All development likely happening against production Supabase + Stripe test mode. Add:
- `VITE_ENV=staging` mode with staging Supabase project
- Supabase branch databases for PR previews

---

## 6. ⚡ PERFORMANCE

| Issue | Impact | Fix |
|---|---|---|
| Gallery + AdminUsers not lazy-loaded | Bundle size | Add `React.lazy()` wrappers |
| AI-generated images not CDN-cached | Slow repeats | Add Cloudflare R2 or Supabase Storage CDN |
| Stream-chapters: no backpressure handling | UX jitter | Add ReadableStream with proper buffering |
| No service worker / offline support | Mobile UX | Add PWA manifest + cache shell |

---

## 7. 🔒 SECURITY

| Issue | Severity | Status |
|---|---|---|
| VITE_OPENAI_API_KEY in client bundle | 🔴 Critical | Open |
| VITE_GROQ_API_KEY in client bundle | 🔴 Critical | Open |
| TestCredits page publicly routed | 🔴 High | Open |
| No rate limiting on generation EFs | 🟠 Medium | Open |
| Missing CSRF protection on webhooks | 🟠 Medium | Stripe sig verified ✅, others unclear |
| Dependency vulnerabilities | 🟡 Low | Run `pnpm audit` |

---

## Prioritized Execution Order

1. 🔴 Remove API keys from client bundle (#FME-001, #FME-002)
2. 🔴 Fix billing.ts → real checkout (#FME-003)
3. 🟠 Wire Gallery to real data (#FME-004)
4. 🟠 Guard TestCredits page (#FME-006)
5. 🟠 Social sharing cards (#FME-005)
6. 🟡 Brevo email flows (#FME-013)
7. 🟡 Referral/gifting (#FME-008)
8. 🟢 Console.log cleanup + debug file removal (#FME-009, #FME-010)
