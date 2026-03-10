# FlipMyEra — Production Launch Plan
> Generated: 2026-03-10 | Deep-dive code audit by Honey
> Status: **Pre-launch — 7 critical items, ~2 weeks to production**

---

## Executive Summary

FlipMyEra is closer to production than the previous audit suggested. Several "critical" issues from the March 8 audit have already been fixed or were misidentified:

| Previous Finding | Actual Status | Notes |
|---|---|---|
| API keys in client bundle | ✅ **FIXED** | `env.ts` returns `undefined`, `vite-env.d.ts` cleaned. No VITE_OPENAI/GROQ declared. |
| Billing stubs not wired | ⚠️ **PARTIALLY FIXED** | `Checkout.tsx` and `CreditPurchaseModal.tsx` call `create-checkout` edge function correctly. BUT `billing.ts` still has dead in-memory stubs that nothing imports (except barrel export). |
| TestCredits page exposed | ✅ **FIXED** | Behind `FeatureGate flag="test_credits"` (default: false) + `ProtectedRoute`. |
| Clerk auth confusion | ✅ **RESOLVED** | `useClerkAuth` is aliased to `useSupabaseAuth` — no actual Clerk dependency. Naming is legacy but functional. |

**Real remaining blockers: 7 items across 3 categories.**

---

## Phase 1: STOP-SHIP Blockers (Days 1-3)

### 1.1 🔴 `create-checkout` has hardcoded Stripe price IDs that don't match the frontend config

**The bug:** The `create-checkout` edge function has its own `subscriptionPriceIds` and `creditPriceIds` maps with hardcoded Stripe price IDs (e.g., `price_1S9zK15U03MNTw3qAO5JnplW`). But the frontend `stripe-products.ts` uses env vars or `_placeholder` fallbacks.

The mismatch:
- Frontend Checkout.tsx sends `{ plan: 'starter' }` → edge function maps to `subscriptionPriceIds['starter']` ✅
- Frontend CreditPurchaseModal sends `{ stripePriceId: tier.stripePriceId }` → edge function uses it directly ✅
- **BUT** if `VITE_STRIPE_PRICE_SINGLE` isn't set in Netlify, the frontend sends `price_single_placeholder` as the `stripePriceId` → Stripe API call fails silently.

**Fix:**
```
File: supabase/functions/create-checkout/index.ts
1. Map plan names (single/album/tour) to real Stripe price IDs server-side
2. Don't trust client-sent stripePriceId — resolve server-side from plan name
3. Add the new tier names (speakNow/midnights) alongside legacy (starter/deluxe/vip)
```

**Also fix:** The edge function uses `apiVersion: "2025-08-27.basil"` which doesn't exist. Use a valid version or omit.

**Files:** `supabase/functions/create-checkout/index.ts`, verify Netlify env vars match.
**Effort:** 3 hours
**Risk:** Without this, credit pack purchases fail 100% of the time.

---

### 1.2 🔴 Dual credit deduction paths — `credits-validate` vs `groq-storyline`

**The bug:** Two edge functions independently deduct credits:

1. `credits-validate` — called by `EbookGenerator.tsx` before generation. Uses `rpc('deduct_credits')` atomically. ✅
2. `groq-storyline` — also calls `rpc('deduct_credits')` independently with `STORYLINE_GENERATION_CREDITS = 2`. ✅ individually, but...

The flow is: Frontend calls `credits-validate` (deducts N credits) → then calls `groq-storyline` (deducts 2 more credits). **User gets double-charged.** The `EbookGenerator` deducts via validate, then the storyline generation deducts again.

**Fix:**
```
Option A (recommended): Make groq-storyline check for a valid transaction_id 
from credits-validate. If present, skip deduction.

Option B: Remove deduction from groq-storyline entirely. 
Credits-validate is the single deduction point.
Make groq-storyline require a transaction_id parameter as proof of payment.
```

**Files:** `supabase/functions/credits-validate/index.ts`, `supabase/functions/groq-storyline/index.ts`, `src/modules/ebook/components/EbookGenerator.tsx`
**Effort:** 4 hours
**Risk:** Users lose trust when charged double. This is revenue-destroying.

---

### 1.3 🔴 `create-checkout` CORS is wildcard (`*`)

**The bug:** While `credits-validate`, `credits`, `groq-storyline`, and `_shared/utils.ts` all use proper origin allowlisting, `create-checkout` uses `Access-Control-Allow-Origin: *`. This means any website can initiate checkout sessions for your users.

**Fix:**
```typescript
// Replace the corsHeaders object in create-checkout/index.ts with:
import { getCorsHeaders } from "../_shared/utils.ts";
// Use getCorsHeaders(req) for all responses
```

**Files:** `supabase/functions/create-checkout/index.ts`
**Effort:** 15 minutes
**Risk:** CSRF-style attacks against authenticated users.

---

### 1.4 🔴 `stripe-webhook` CORS is wildcard (`*`) and doesn't need CORS at all

**The bug:** Stripe webhook endpoint has CORS headers. Webhooks come from Stripe servers, not browsers. CORS headers are irrelevant and signal that someone might be testing this from a browser (which would be wrong).

**Fix:** Remove CORS headers from `stripe-webhook`. Add Stripe IP allowlist check if Supabase supports it. The signature verification is correct and sufficient.

**Files:** `supabase/functions/stripe-webhook/index.ts`
**Effort:** 15 minutes

---

## Phase 2: Revenue & Retention (Days 4-7)

### 2.1 🟡 Gallery shows hardcoded mock data

**The bug:** `Gallery.tsx` renders `SAMPLE_EBOOKS` — a hardcoded array of 6 fake ebooks. No Supabase query. Comment says "replace with Supabase query."

**Fix:**
```typescript
// Replace SAMPLE_EBOOKS with:
const { data: ebooks, error } = await supabase
  .from('ebooks')
  .select('id, title, cover_url, created_at, chapter_count, word_count')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20);
```

Add: pagination, empty state ("No ebooks yet — create your first!"), link to generator.

**Files:** `src/app/pages/Gallery.tsx`
**Effort:** 4 hours
**Risk:** Without real gallery, users can't find their past ebooks → zero retention.

---

### 2.2 🟡 Delete dead `billing.ts` stubs

**The bug:** `src/modules/subscriptions/billing.ts` has 200 lines of in-memory stubs (`usageStore`, `subscriptionStore`, `createSubscriptionCheckout`, `cancelSubscription`). Nothing calls these functions except the barrel export. But they confuse future developers and agents.

**Fix:** Delete `billing.ts`. Keep `tiers.ts`. Update `index.ts` to only export tiers. Verify no runtime imports exist (only the test files reference it).

**Files:** `src/modules/subscriptions/billing.ts`, `src/modules/subscriptions/index.ts`
**Effort:** 30 minutes

---

### 2.3 🟡 Rename Clerk references to Supabase

**The issue:** `useClerkAuth`, `ClerkAuthProvider`, `ClerkAuthContext.tsx` — all are aliases to Supabase Auth. This confuses every agent and developer who touches the code.

**Fix:**
```bash
# Global rename (careful, staged commits):
# useClerkAuth → useAuth
# ClerkAuthProvider → AuthProvider  
# Delete src/modules/auth/contexts/ClerkAuthContext.tsx (1-line re-export)
# Update all 20+ import sites
```

**Effort:** 1 hour (mechanical find-replace)
**Risk:** Low — purely naming.

---

## Phase 3: Bundle & Performance (Days 8-10)

### 3.1 🟠 Remove OpenTelemetry (13 packages, ~200KB)

**The issue:** 13 `@opentelemetry/*` packages imported in `main.tsx`. No OTLP collector configured. All telemetry goes nowhere. For a consumer app aimed at teens on mobile, this is dead weight.

**Fix:**
```bash
# 1. Remove import from main.tsx
# 2. Delete src/core/integrations/opentelemetry.ts
# 3. npm uninstall @opentelemetry/api @opentelemetry/exporter-logs-otlp-http ...
```

Use PostHog (already configured) for product analytics. If you need real APM later, add Sentry Performance (already in deps).

**Files:** `src/app/main.tsx`, `src/core/integrations/opentelemetry.ts`, `package.json`
**Effort:** 30 minutes
**Bundle savings:** ~200KB

---

### 3.2 🟠 Audit Radix UI packages (27 packages)

**The issue:** 27 `@radix-ui/react-*` packages. At least 6 are used by exactly 1 shadcn component that itself is never used in any page: `context-menu`, `hover-card`, `menubar`, `accordion`, `aspect-ratio`, `collapsible`.

**Fix:** 
1. For each Radix package, check if its shadcn component is actually imported by a page/feature
2. Remove unused shadcn components + their Radix deps
3. Conservative estimate: 6 packages removable

**Effort:** 2 hours
**Bundle savings:** ~50-80KB

---

### 3.3 🟠 Deduplicate `creator` vs `creators` modules

**The issue:** Two modules with overlapping files:
- `src/modules/creator/` (5 files) — imported by `Index.tsx`, `UserDashboard.tsx`
- `src/modules/creators/` (8 files) — has tests, types, TipJar
Neither is complete. Both have `FeaturedCreators.tsx`, `CreatorProfile.tsx`, `CreatorAnalytics.tsx`.

**Fix:** Merge into `src/modules/creators/` (the one with tests). Update 2 import sites.

**Effort:** 1 hour

---

## Phase 4: Testing & CI (Days 11-14)

### 4.1 Edge Function Tests (HIGH PRIORITY)

**Current state:** 471 tests exist but they're all frontend components. Zero tests for:
- `create-checkout` (payment initiation)
- `stripe-webhook` (payment fulfillment — THE critical path)
- `credits-validate` (credit deduction)
- `groq-storyline` (generation + billing)
- `admin-credits` (privilege escalation risk)
- `deduct-credits` (DB function)

**Plan:**
```
Day 11: stripe-webhook tests (idempotency, credit allocation, subscription lifecycle, refunds)
Day 12: create-checkout tests (plan validation, price mapping, auth)
Day 13: credits-validate tests (atomic deduction, race conditions, insufficient balance)
Day 14: groq-storyline tests (auth, rate limiting, credit coordination with validate)
```

Use the existing `payment-edge-cases.test.ts` as a template — it already mocks Supabase correctly.

**Effort:** 4 days
**Coverage target:** 80% on all payment-path edge functions.

---

### 4.2 Build Pipeline Fix

**The issue:** `npx vite build --mode production` fails with "Class extends value undefined is not a constructor or null" — likely a dependency version conflict. The app builds on Netlify (different node/env) but local builds are broken.

**Fix:**
1. Delete `node_modules` + `package-lock.json`, fresh `npm install`
2. If persists, likely OpenTelemetry SDK version mismatch (common issue with their ESM exports)
3. May resolve itself after removing OpenTelemetry (Phase 3.1)

**Effort:** 1-2 hours

---

### 4.3 Netlify Deploy Preview + CI

**Plan:**
```yaml
# Add to netlify.toml or create GitHub Action:
# 1. Run tests on PR
# 2. Type-check (tsc --noEmit)
# 3. Build check
# 4. Deploy preview
```

**Effort:** 2 hours

---

## Phase 5: Pre-Launch Polish (Day 14+)

### 5.1 Stripe Products Setup
Create real products in Stripe Dashboard:
- 3 credit packs: Single ($2.99/5cr), Album ($9.99/20cr), Tour ($19.99/50cr)
- 3 subscription tiers: Debut (free), Speak Now ($4.99/mo), Midnights ($9.99/mo)
- 2 annual tiers: Speak Now Annual ($3.99/mo), Midnights Annual ($7.99/mo)
- Set `credits` in price metadata for webhook to read
- Update edge function price ID maps
- Set Netlify env vars: `VITE_STRIPE_PRICE_SINGLE`, etc.
- Configure webhook endpoint in Stripe Dashboard

### 5.2 PostHog Events
Wire key funnel events:
- `signup_completed`
- `generation_started` / `generation_completed`
- `checkout_initiated` / `checkout_completed`
- `credit_exhausted`
- `gallery_viewed`

### 5.3 Soft Launch Plan
1. Subreddit: r/TaylorSwift (1.8M members) — share a free ebook + link
2. TikTok: Create 3-5 "making an AI Taylor Swift storybook" videos
3. Pinterest: Pin ebook covers with SEO-optimized descriptions
4. Twitter/X: Thread showing the generation process

---

## Appendix: File-Level Checklist

### Critical Path Files (must be correct for money to flow)
| File | Status | Action |
|---|---|---|
| `supabase/functions/create-checkout/index.ts` | 🔴 Bug | Fix price ID mapping, CORS, API version |
| `supabase/functions/stripe-webhook/index.ts` | 🟡 Works but CORS wrong | Remove CORS headers |
| `supabase/functions/credits-validate/index.ts` | 🟡 Works | Coordinate with groq-storyline |
| `supabase/functions/groq-storyline/index.ts` | 🔴 Double-charges | Remove or gate credit deduction |
| `supabase/functions/credits/index.ts` | ✅ | Read-only, correct |
| `supabase/functions/stripe-portal/index.ts` | ✅ | Correct |
| `src/config/stripe-products.ts` | 🟡 Placeholders | Set real Stripe price IDs |
| `src/app/pages/Checkout.tsx` | ✅ | Calls edge function correctly |
| `src/modules/user/components/CreditPurchaseModal.tsx` | ✅ | Calls edge function correctly |
| `src/modules/credits/hooks/useCredits.ts` | ✅ | Correct |

### Dead Code to Remove
| File | Reason |
|---|---|
| `src/modules/subscriptions/billing.ts` | In-memory stubs, nothing calls them |
| `src/core/integrations/opentelemetry.ts` | No collector, 200KB dead weight |
| `src/modules/creator/` (entire directory) | Duplicate of `src/modules/creators/` |
| 6+ Radix UI packages | Unused shadcn components |

### Naming Cleanup
| Current | Target |
|---|---|
| `useClerkAuth` | `useAuth` |
| `ClerkAuthProvider` | `AuthProvider` |
| `ClerkAuthContext.tsx` | Delete |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `VITE_SUPABASE_ANON_KEY` (matches Supabase docs) |

---

## Timeline Summary

| Week | Focus | Outcome |
|---|---|---|
| **Days 1-3** | Fix payment flow (create-checkout, double-charge, CORS) | Money can flow |
| **Days 4-7** | Gallery, dead code cleanup, naming | Users can retain + codebase is clean |
| **Days 8-10** | Bundle optimization (-300KB), dedup, build fix | Fast mobile experience |
| **Days 11-14** | Edge function tests, CI pipeline | Confidence to ship |
| **Day 14+** | Stripe setup, PostHog, soft launch | 🚀 Revenue |

**Total estimated effort: 12-14 focused days.**
**Recommended agent: Sonnet 4 for mechanical fixes, Opus 4 for payment logic.**
