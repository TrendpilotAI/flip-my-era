# flip-my-era — Code Quality Audit
*Generated: 2026-03-05 (updated by Judge Agent v2)*

---

## ⚠️ NEW P0 SECURITY FINDING (2026-03-05)

### 🔴 VITE_SENTRY_AUTH_TOKEN exposed in client bundle
**File:** `src/core/integrations/opentelemetry.ts`

```ts
headers: import.meta.env.VITE_SENTRY_AUTH_TOKEN
  ? { Authorization: `Bearer ${import.meta.env.VITE_SENTRY_AUTH_TOKEN}` }
  : undefined,
```

**VITE_SENTRY_AUTH_TOKEN is compiled into the client-side JS bundle.** Unlike the Sentry DSN (which is intentionally public), auth tokens grant **write access** to your Sentry project and should NEVER be in client code.

**Immediate action:**
1. Rotate the Sentry auth token in Sentry → Settings → Auth Tokens
2. Remove `VITE_SENTRY_AUTH_TOKEN` from all env files and client source
3. The Sentry browser SDK only needs `VITE_SENTRY_DSN` — no auth token needed
4. If OTLP export with auth is required, proxy through a Supabase edge function

---

## Executive Summary

| Category | Severity | Issue Count |
|---|---|---|
| Security | 🔴 Critical | 3 (+1 new P0) |
| Dead Code / Stubs | 🟠 Medium | 4 |
| DRY Violations | 🔴 High | 1 (major — duplicate module) |
| Test Coverage | 🟠 Medium | 15+ untested edge functions/pages |
| Performance | 🟡 Low | 4 eagerly-loaded pages |
| TODO/FIXME | 🟡 Low | 5 items |
| Console.log Leakage | 🟡 Low | 25 statements |

---

## 1. Security

### 1.1 🔴 VITE_OPENAI_API_KEY exposed in client bundle
**File:** `src/modules/shared/utils/env.ts:37`
```ts
return getEnvVar('VITE_OPENAI_API_KEY');
```
Any `VITE_*` env var is embedded in the client-side JS bundle at build time. If this key has production billing enabled, it is exposed to every browser visitor. This is **critical** — the OpenAI key should only be used server-side (Supabase edge function), never in frontend code.

**Fix:** Remove `VITE_OPENAI_API_KEY` from the frontend entirely. Route all OpenAI calls through a Supabase edge function (similar to how `runware-proxy` proxies Runware). The `VITE_RUNWARE_API_KEY` is correctly avoided in production via the proxy URL pattern.

### 1.2 🟠 VITE_GROQ_API_KEY in client bundle
**File:** `src/modules/shared/utils/env.ts` (via `getEnvVar('VITE_GROQ_API_KEY')`)
**Also:** `src/vite-env.d.ts` declares it as a typed env var.

Same issue as above — Groq API key should not be client-side. The `groq-api` and `groq-storyline` edge functions already exist server-side; the frontend should call those instead.

**Fix:** Remove `VITE_GROQ_API_KEY` from the Vite env config. Use the existing `groq-api`/`groq-storyline` edge functions exclusively.

### 1.3 ✅ No hardcoded secrets found
No literal `sk_live_`, `whsec_`, or JWT strings were found in source files — good.

### 1.4 ✅ Runware API key correctly proxied
`src/modules/shared/utils/runware.ts` uses `VITE_RUNWARE_PROXY_URL` (pointing to the `runware-proxy` edge function) rather than exposing the key client-side. Correct pattern — replicate for OpenAI and Groq.

---

## 2. Dead Code / Stubs Left in Production Paths

### 2.1 🔴 `billing.ts` is entirely stubbed — Stripe integration incomplete
**File:** `src/modules/subscriptions/billing.ts:119–168`
```ts
// ─── Stripe Integration Stubs ────────────────────────────────
// Stub: In production, this would call...
console.log(`[Stripe Stub] Reporting ${quantity} units...`);
url: `https://checkout.stripe.com/stub/${Date.now()}`,
```
All three Stripe functions (`reportMeteredUsage`, `createCheckoutSession`, `cancelSubscription`) are stubs that log to console and return fake URLs. The `create-checkout` and `stripe-portal` edge functions exist but the client-side billing module is never wired to them.

**Fix:** Either (a) wire `createCheckoutSession` to call the `create-checkout` edge function, or (b) remove this module and call the edge functions directly from UI components. The stub is silently failing in production.

### 2.2 🟠 `email/index.ts` is a logging stub
**File:** `src/modules/email/index.ts:33–36`
```ts
// Stub: log to console. Replace with Resend/SendGrid call in production.
console.log(`[EMAIL STUB] To: ${to} | Subject: ${template.subject}`);
return { success: true, messageId: `stub-${Date.now()}` };
```
The `brevo-email` edge function exists and is presumably wired for transactional emails. The frontend email module never calls it — all email sends silently succeed without sending.

**Fix:** Either remove the frontend email module entirely (route all emails through `brevo-email`), or implement the actual call.

### 2.3 🟠 5 social engagement components stub their API integration
**Files:**
- `src/modules/shared/components/CreationStreak.tsx:130` — `// TODO: API Integration`
- `src/modules/shared/components/FriendshipBracelet.tsx:158` — `// TODO: API Integration`
- `src/modules/shared/components/StoryGallery.tsx:192` — `// TODO: API Integration`
- `src/modules/shared/components/EraProgressTracker.tsx:131` — `// TODO: API Integration`
- `src/modules/shared/components/MonthlyChallenge.tsx:183` — `// TODO: API Integration`

These appear to be shipping as UI-only with no persistence. Verify none of these are user-visible in production with a promise of real behavior.

### 2.4 🟡 `TestCredits` page in production routing
**File:** `src/app/App.tsx`
```tsx
const TestCredits = lazy(() => import("@/app/pages/TestCredits"));
```
A page named `TestCredits` is lazy-loaded and has a route in the production app. If it's publicly accessible, this is a development artifact in production.

**Fix:** Guard behind `import.meta.env.DEV` or remove from production routing.

---

## 3. DRY Violations

### 3.1 🔴 Duplicate `creator` vs `creators` module — major divergence
**Directories:**
- `src/modules/creator/` — 4 files: `CreatorProfile`, `CreatorAnalytics`, `FeaturedCreators`, `VerificationBadge`
- `src/modules/creators/` — 6 files: same 3 above + `TipJar`, `CreatorBadges`, `types.ts`

Both modules export `CreatorProfile`, `CreatorAnalytics`, and `FeaturedCreators`. The `creators/` versions are the evolved variants — they use a shared `CreatorStats` type, typed props (non-optional fields), `TipJar`, `CreatorBadges`, and properly fetch earnings from a `tips` table. The `creator/` versions are the older, thinner originals still using `VerificationBadge`.

**App.tsx confirms the split:** It imports `CreatorProfile` and `CreatorAnalytics` from `@/modules/creators/` (the newer module). The old `creator/` module appears orphaned.

**Impact:** ~400 lines of near-duplicate logic. The `creator/` analytics module also has a commented-out placeholder earnings calculation (`totalShares * 0.01`) while `creators/` actually queries the `tips` table.

**Fix:**
1. Confirm nothing imports from `src/modules/creator/` (run `grep -r "from.*modules/creator['\"]"`)
2. Delete `src/modules/creator/` entirely
3. Move `VerificationBadge` into `src/modules/creators/` if still needed (it's not in `creators/`)

---

## 4. Test Coverage

### 4.1 Edge Functions — 15 of 20 have zero tests

**Tested (5):**
- `credits-validate`, `credits`, `groq-storyline`, `stream-chapters`, `stripe-webhook`

**Untested (15) — by risk level:**

| Function | Risk | Notes |
|---|---|---|
| `create-checkout` | 🔴 High | Payments — untested |
| `stripe-portal` | 🔴 High | Subscription management |
| `customer-portal` | 🔴 High | Billing access |
| `webhook-retry-processor` | 🔴 High | Reliability-critical |
| `admin-credits` | 🟠 Medium | Admin privilege escalation risk |
| `ebook-generation` | 🟠 Medium | Core product feature |
| `check-subscription` | 🟠 Medium | Gating logic |
| `tiktok-auth` | 🟠 Medium | OAuth flow |
| `tiktok-share-analytics` | 🟡 Low | Analytics |
| `runware-proxy` | 🟡 Low | Image gen proxy |
| `groq-api` | 🟡 Low | Already has storyline tests |
| `text-to-speech` | 🟡 Low | |
| `generate-video` | 🟡 Low | |
| `brevo-email` | 🟡 Low | |
| `migrate-email-templates` | 🟡 Low | One-time migration |

**Priority:** Write tests for `create-checkout`, `stripe-portal`, `webhook-retry-processor`, and `admin-credits` first — these handle money and admin access.

### 4.2 Pages with zero test coverage (18 pages)

```
src/app/pages/Gallery.tsx
src/app/pages/ImageReview.tsx
src/app/pages/TestCredits.tsx
src/app/pages/AdminConversion.tsx
src/app/pages/AdminRevenue.tsx
src/app/pages/AdminAnalyticsDashboard.tsx
src/app/pages/TermsOfService.tsx
src/app/pages/PrivacyPolicy.tsx
src/app/pages/seo/ErasTourEbook.tsx
src/app/pages/seo/CustomTaylorSwiftGifts.tsx
src/app/pages/seo/SwiftieBirthdayPresents.tsx
src/app/pages/seo/TaylorSwiftFanArtBook.tsx
src/app/pages/seo/ErasTourMemoriesBook.tsx
src/app/pages/seo/PersonalizedErasTourPhotoBook.tsx
src/app/pages/seo/TaylorSwiftConcertKeepsake.tsx
src/app/pages/seo/SwiftieGraduationGift.tsx
src/app/pages/seo/FriendshipBraceletBook.tsx
src/app/pages/seo/ErasTourScrapbook.tsx
```

SEO pages are low risk (static content). `AdminConversion`, `AdminRevenue`, and `AdminAnalyticsDashboard` should have smoke tests to prevent regressions.

---

## 5. Performance

### 5.1 🟠 4 pages eagerly loaded — not lazy
**File:** `src/app/App.tsx`

```tsx
import Index from "@/app/pages/Index";        // Landing page — OK to be eager
import Gallery from "@/app/pages/Gallery";    // ⚠️ Should be lazy
import NotFound from "@/app/pages/NotFound";  // OK — tiny
import ImageReview from "@/app/pages/ImageReview"; // ⚠️ Should be lazy
```

`Gallery` and `ImageReview` are likely non-trivial components that could increase initial bundle size. All other pages are correctly lazy-loaded. Convert these to `lazy()` + `<Suspense>` wrappers consistent with the rest of the app.

**Fix:**
```tsx
const Gallery = lazy(() => import("@/app/pages/Gallery"));
const ImageReview = lazy(() => import("@/app/pages/ImageReview"));
```

### 5.2 ✅ Lazy loading well-implemented overall
40+ routes use `React.lazy()` with appropriate `<Suspense>` fallbacks (`PageLoader`, `DashboardSkeleton`, `CheckoutSkeleton`). This is well-structured.

### 5.3 🟡 `creator/` module dead weight in bundle
Until `src/modules/creator/` is removed, its code may be bundled if anything imports from it. Verify with `grep -r "from.*modules/creator['\"]" src/`.

---

## 6. TODO/FIXME Catalog

| # | File | Line | Note |
|---|---|---|---|
| 1 | `src/modules/shared/components/CreationStreak.tsx` | 130 | `// TODO: API Integration` — streak data not persisted |
| 2 | `src/modules/shared/components/FriendshipBracelet.tsx` | 158 | `// TODO: API Integration` — bracelet tracking not persisted |
| 3 | `src/modules/shared/components/StoryGallery.tsx` | 192 | `// TODO: API Integration` — gallery not wired |
| 4 | `src/modules/shared/components/EraProgressTracker.tsx` | 131 | `// TODO: API Integration` — progress not persisted |
| 5 | `src/modules/shared/components/MonthlyChallenge.tsx` | 183 | `// TODO: API Integration` — challenges not persisted |

All 5 are in the social/engagement features cluster. These components are rendering UI with mock/static state.

---

## 7. Console.log Leakage (25 statements)

25 `console.log` calls remain in production source. Key offenders:

| File | Count | Notes |
|---|---|---|
| `src/modules/subscriptions/billing.ts` | 3 | Stub markers — remove with stub |
| `src/modules/email/index.ts` | 2 | Stub markers — remove with stub |
| `src/modules/ebook/components/UserBooks.tsx:182–191` | 4 | Debug logs: `'Book clicked'`, `'Raw chapters data'`, etc. |
| `src/app/App.tsx:249` | 1 | `console.log('Onboarding complete:', data)` in inline handler |
| `src/modules/story/utils/storyPersistence.ts:64–109` | 3 | Save/load debug logs |

**Fix:** Replace ad-hoc `console.log` with the existing `src/core/utils/logger.ts` (which already gates on `import.meta.env.DEV`). The logger is there — use it.

---

## Prioritized Action Plan

### Week 1 — Security (blocking)
1. **Remove `VITE_OPENAI_API_KEY` from frontend** — route through edge function
2. **Remove `VITE_GROQ_API_KEY` from frontend** — use existing edge functions

### Week 1 — DRY / Dead Code
3. **Delete `src/modules/creator/`** — confirm orphaned, then remove (~400 LOC)
4. **Wire or delete `billing.ts` stubs** — Stripe checkout is broken in production
5. **Wire or delete `email/index.ts` stub** — emails silently never send

### Week 2 — Test Coverage
6. **Write tests for `create-checkout`, `stripe-portal`, `webhook-retry-processor`, `admin-credits`**
7. **Write smoke tests for admin pages** (`AdminConversion`, `AdminRevenue`, `AdminAnalyticsDashboard`)

### Week 2 — Performance / Hygiene
8. **Lazy-load `Gallery` and `ImageReview`**
9. **Replace `console.log` in `UserBooks.tsx` and `App.tsx` with `logger`**
10. **Guard `TestCredits` route behind `DEV` flag or remove**

### Ongoing
11. **Implement the 5 TODO: API Integration social components** or document as future-scope
