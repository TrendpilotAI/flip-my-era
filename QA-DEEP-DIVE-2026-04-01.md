# FlipMyEra — QA Deep Dive Report
**Date:** 2026-04-01  
**Branch:** main  
**Repo:** TrendpilotAI/flip-my-era  
**Stack:** Vite + React 18 SPA, BetterAuth, Stripe, Supabase Edge Functions, Netlify

---

## 1. Full User Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ Landing Page │────▶│  /auth       │────▶│  /auth/callback   │
│  (Index.tsx) │     │  Sign Up /   │     │  (OAuth redirect) │
│              │     │  Sign In     │     │                    │
└──────────────┘     └──────────────┘     └────────┬───────────┘
                                                    │
                          ┌─────────────────────────▼─────────────┐
                          │        /dashboard (UserDashboard)      │
                          │  Profile sync → credits fetch → UI     │
                          └──────┬───────────────────┬─────────────┘
                                 │                   │
                    ┌────────────▼──────┐    ┌───────▼───────────┐
                    │   /stories        │    │  /checkout         │
                    │  Story Wizard:    │    │  Plan selection    │
                    │  - Era select     │    │  → create-checkout │
                    │  - Character      │    │  Edge Function     │
                    │  - Details form   │    │  → Stripe redirect │
                    │  - Generate via   │    └───────┬───────────┘
                    │    groq-api EF    │            │
                    │  - Preview        │    ┌───────▼───────────┐
                    └───────┬───────────┘    │ /checkout/success │
                            │                │ Confirm purchase  │
                    ┌───────▼───────────┐    └───────────────────┘
                    │  Ebook Generation │
                    │  - Chapter stream │     ┌──────────────────┐
                    │    (stream-chpts) │     │  /credits         │
                    │  - Image gen      │     │  CreditPurchase   │
                    │    (runware-proxy)│     │  Modal → Stripe   │
                    │  - PDF export     │     └──────────────────┘
                    └───────────────────┘

Auth Flow (BetterAuth):
  Browser → /api/auth/* → Netlify redirect → /.netlify/functions/auth
  auth.ts (Netlify Function) → auth-server.ts (BetterAuth + pg pool)
  Session: HttpOnly cookie, 30-day expiry

Stripe Flow:
  Client → supabase.functions.invoke('create-checkout') → Edge Function
  Edge Function resolves price server-side → Stripe Checkout Session
  Stripe → stripe-webhook Edge Function → credit allocation / subscription update

AI Flow:
  Client (with Bearer token) → groq-api / groq-storyline / stream-chapters Edge Functions
  Edge Functions hold GROQ_API_KEY server-side → Groq API → response
```

---

## 2. Issues Found

### P0 — Critical / Blocking

| # | Issue | File | Details |
|---|-------|------|---------|
| **P0-1** | **Build is broken** | `src/app/App.tsx:8` | `RouteErrorFallback` is imported from `ErrorBoundary.tsx` but NOT exported. ErrorBoundary.tsx only exports `ErrorBoundary`, `withErrorBoundary`, `useErrorHandler`. **Build fails with Rollup error.** The existing `dist/` was built from a prior working commit. |
| **P0-2** | **`access_token` always empty string** | `src/core/integrations/better-auth/AuthProvider.tsx:127` | `session.access_token` is hardcoded to `''`. Consumers that read `session.access_token` synchronously (instead of calling `getToken()`) will always send an empty Bearer token. This affects any component using `session.access_token` directly for API headers. |

### P1 — High

| # | Issue | File | Details |
|---|-------|------|---------|
| **P1-1** | **Admin route uses hardcoded email allowlist** | `src/modules/shared/components/AdminRoute.tsx:28-30` | Admin access is checked by email substring matching (`"admin@flipmyera.com"`, `"danny.ijdo@gmail.com"`, `*.trendpilot*`). No role-based access — anyone who registers with a trendpilot email domain gets admin. Should use a proper role field or admin flag in DB. |
| **P1-2** | **Checkout page uses legacy aliases** | `src/app/pages/Checkout.tsx:38-70` | Uses `STRIPE_PRODUCTS.subscriptions.starter`, `.deluxe`, `.vip` (legacy aliases via getters). These resolve to speakNow/midnights, but the plan IDs sent to the Edge Function (`"starter"`, `"deluxe"`, `"vip"`) still work due to legacy aliases in `create-checkout`. Fragile — a rename in the Edge Function breaks checkout. |
| **P1-3** | **Supabase Auth still initialized** | `src/core/integrations/supabase/client.ts` | The Supabase client is initialized with full auth config (`autoRefreshToken`, `persistSession`, `detectSessionInUrl`, `flowType: 'pkce'`). Auth is now handled by BetterAuth, but the Supabase auth listener is still active. This creates confusing dual auth state. Should configure Supabase client with `auth: { persistSession: false, autoRefreshToken: false }`. |
| **P1-4** | **`var` declarations in Edge Function** | `supabase/functions/create-checkout/index.ts:~110-115` | Uses `var authenticatedUserId` inside conditional blocks. While it works in Deno, this is error-prone and should use `let`. |
| **P1-5** | **Stripe price IDs have placeholders** | `src/config/stripe-products.ts` | Client-side product config has fallback placeholder price IDs (e.g., `"price_single_placeholder"`, `"price_midnights_monthly_placeholder"`). If `VITE_STRIPE_PRICE_*` env vars aren't set, Stripe.js `redirectToCheckout()` will fail silently. The Edge Function has real price IDs but the client also calls `stripe.redirectToCheckout()` directly in `StripeClient.redirectToCheckout()`. |
| **P1-6** | **Deprecated client-side AI functions still exist** | `src/modules/story/services/ai.ts` | `generateStory()`, `generateChapters()`, `generateTaylorSwiftChapters()`, `generateName()` all attempt to call `getGroqApiKey()` which always returns `undefined`. They immediately throw, but they still import and reference the direct Groq API endpoint `https://api.groq.com/openai/v1/chat/completions`. Should be removed entirely to avoid confusion. |

### P2 — Medium / Low

| # | Issue | File | Details |
|---|-------|------|---------|
| **P2-1** | **"Clerk" naming remnants everywhere** | Multiple files | `useClerkAuth`, `ClerkAuthContext.tsx`, `clerkToken` variable names, `ClerkAuthProvider` — all actually backed by BetterAuth. Not a bug (aliases resolve correctly) but confusing for developers. |
| **P2-2** | **Email module is a stub** | `src/modules/email/index.ts` | `sendEmail()` logs to console and returns success. No actual email delivery configured. Signup confirmation ("Check your email") message is misleading if BetterAuth doesn't handle email verification. |
| **P2-3** | **CSP header references Clerk domains** | `netlify.toml` | Content-Security-Policy includes `*.clerk.accounts.dev`, `clerk.flipmyera.com` in `script-src`, `connect-src`, `frame-src`. These are dead domains since Clerk was replaced. Should be cleaned up. |
| **P2-4** | **SECRETS_SCAN_OMIT_KEYS includes Clerk key** | `netlify.toml` | `VITE_CLERK_PUBLISHABLE_KEY` is still in the omit list. Dead config. |
| **P2-5** | **Dual Supabase client files** | `src/integrations/supabase/client.ts` + `src/core/integrations/supabase/client.ts` | Two client files exist. The first re-exports from the second. Could cause confusion about which to import. |
| **P2-6** | **Test coupon code UI is non-functional** | `src/app/pages/Checkout.tsx:185-196` | "Have a coupon?" input exists but the Apply button does nothing (no handler). |
| **P2-7** | **`window.open` for Stripe checkout** | `src/app/pages/Checkout.tsx:120` | Opens Stripe checkout in a new tab (`window.open(data.url, '_blank')`). Should use `window.location.href` for better UX and to avoid popup blockers. |
| **P2-8** | **Feature-gated routes return 404** | `src/app/App.tsx` | Many routes are behind `<FeatureGate>` with `fallback="notfound"`. If flags aren't configured, users see 404 instead of a "coming soon" page. |

---

## 3. Security Findings

### API Key Exposure Audit — ✅ PASS (with notes)

| Check | Result | Details |
|-------|--------|---------|
| GROQ_API_KEY in client bundle | ✅ Safe | `getGroqApiKey()` intentionally returns `undefined`. All Groq calls route through Edge Functions. |
| OPENAI_API_KEY in client bundle | ✅ Safe | `getOpenAiApiKey()` intentionally returns `undefined`. OpenAI calls removed from client. |
| STRIPE_SECRET_KEY in client | ✅ Safe | Only `VITE_STRIPE_PUBLISHABLE_KEY` (pk_*) exposed. Secret key is in Edge Functions only. |
| SENTRY_AUTH_TOKEN in client | ✅ Safe | Not present in dist/ bundle. Only Sentry DSN (public) is used client-side. |
| Supabase SERVICE_ROLE_KEY in client | ✅ Safe | Only anon/publishable key exposed via `VITE_SUPABASE_PUBLISHABLE_KEY`. |
| BETTER_AUTH_SECRET in client | ✅ Safe | Only in `auth-server.ts` (server-side), accessed via `process.env`. |
| `sk_test`/`sk_live` in dist/ | ✅ Safe | Grep found 0 actual Stripe secret keys. Matches in dist were from string references like `"sk_test"` in validation code. |
| `auth-server.ts` in client bundle | ✅ Safe | Not imported by any client-side code path. Vite tree-shakes it out. |
| Netlify Functions server-only | ✅ Safe | `netlify/functions/auth.ts` only imports `auth-server.ts` and runs server-side. |
| Edge Functions server-only | ✅ Safe | All `supabase/functions/` use `Deno.env.get()` for secrets. |

**⚠️ Notes:**
- `dist/assets/groq-Bpbi4ypg.js` and `dist/assets/index-RF-XgqMu.js` matched grep for `GROQ_API_KEY` — but only as error message strings (`"GROQ_API_KEY_MISSING"`), not actual key values. Safe.
- `VITE_RUNWARE_API_KEY` is declared in `vite-env.d.ts` as deprecated but no source file actually reads it (grep returned empty). Safe.

### Authentication Security

- **BetterAuth** uses HttpOnly cookies for sessions — good, not accessible via JS.
- **Session duration**: 30 days with 1-day refresh age — reasonable.
- **Google OAuth** configured with proper redirect URI.
- **Edge Functions** verify tokens via `supabase.auth.getUser()` with JWT fallback — acceptable.
- **CORS** in `create-checkout` has explicit origin allowlist (no wildcard) — good.

### ⚠️ Security Concerns

1. **P1-1**: Admin access by email pattern matching is weak. An attacker registering `evil@trendpilot.com` would get admin.
2. **JWT fallback in create-checkout**: The JWT decode fallback (`atob` without signature verification) could allow forged tokens if the Supabase auth check fails. This is a defense-in-depth concern.
3. **Stripe webhook signature verification**: ✅ Properly implemented with `stripe.webhooks.constructEvent()`.
4. **Idempotency**: ✅ Both checkout creation and webhook processing have idempotency mechanisms.

---

## 4. Test Results

```
 Test Files  50 passed (50)
      Tests  576 passed | 3 skipped (579)
   Start at  00:35:28
   Duration  19.56s
```

**All 50 test files pass. 576/579 tests pass, 3 skipped.**

Test coverage areas:
- Auth provider (BetterAuth)
- Protected routes
- Story generation components (CharacterSelector, EraSelector, StoryForm, etc.)
- Credit system (balance, validation)
- Revenue dashboard
- Affiliates, marketplace, referral
- Ebook components (BookReader, StreamingChapterView)
- Subscription tiers
- Environment validation
- Groq API utilities

**Minor warning**: `react-dom` testing env has an `act(...)` warning in `StreamingChapterView.test.tsx` — cosmetic only.

---

## 5. Build Results

```
❌ BUILD FAILS

Error: "RouteErrorFallback" is not exported by
  "src/modules/shared/components/ErrorBoundary.tsx",
  imported by "src/app/App.tsx"
```

**Root cause**: `App.tsx` line 8 imports `RouteErrorFallback` from `ErrorBoundary.tsx`, but that component doesn't export it. `ErrorBoundary.tsx` exports: `ErrorBoundary` (class), `withErrorBoundary`, `useErrorHandler`.

**Fix**: Either:
1. Add `RouteErrorFallback` export to `ErrorBoundary.tsx`, or
2. Remove the import from `App.tsx` and replace usage with inline fallback or `ErrorBoundary`

**Note**: The `dist/` directory contains a previously successful build from an older commit.

---

## 6. BetterAuth Wiring Assessment

### ✅ What works:
- `auth-client.ts` creates BetterAuth browser client with correct `baseURL`
- `auth-server.ts` configures BetterAuth with pg pool, email/password, Google OAuth
- `AuthProvider.tsx` provides full `AuthContextType` interface
- Sign up → profile creation in Supabase `profiles` table
- Sign up → 3 free credits allocation
- Google OAuth with `callbackURL`
- `netlify.toml` redirects `/api/auth/*` → Netlify Function correctly
- Session management via cookies

### ⚠️ Issues:
- **Email verification not configured** in BetterAuth server config — no `emailVerification` plugin. The Auth component shows "Check your email" toast on signup but no email is actually sent (email module is a stub).
- **Password reset** — `ResetPassword.tsx` exists as a route but unclear if BetterAuth's `forgetPassword` flow is wired.
- **`access_token` is empty string** (P0-2) — consumers must use `getToken()` async.

### 🧹 Cleanup needed:
- `ClerkAuthContext.tsx` — just re-exports from BetterAuth. File name is misleading.
- `useClerkAuth` naming used in 15+ files — works but confusing.
- Supabase auth still initializing with full config (P1-3).
- CSP headers reference Clerk domains (P2-3).

---

## 7. Stripe Wiring Assessment

### ✅ What works:
- **Checkout flow**: Client calls `create-checkout` Edge Function → server resolves price ID → Stripe Checkout Session created → redirect URL returned
- **Webhook handler**: Handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`, `charge.refunded`
- **Idempotency**: Webhook deduplication via `webhook_events` table with unique constraint
- **Credit allocation**: On checkout completion, credits are added via `credit_transactions` table
- **Refund handling**: Credits are revoked on `charge.refunded`
- **Server-side price resolution**: Edge Function maps plan names to real Stripe price IDs — never trusts client-sent price IDs ✅

### ⚠️ Issues:
- **Dual checkout paths**: `StripeClient.redirectToCheckout()` calls Stripe.js directly with client-side `priceId` (from placeholders). Meanwhile `Checkout.tsx` calls the `create-checkout` Edge Function. Two different paths exist — the direct Stripe.js path uses potentially placeholder price IDs.
- **Legacy plan names**: Checkout page sends `"starter"`, `"deluxe"`, `"vip"` but the new naming is `"speakNow"`, `"midnights"`. Edge Function has legacy aliases so it works, but fragile.
- **Coupon code**: UI exists but no functionality.
- **No customer portal link**: `StripeBillingPortal.tsx` exists but calls `stripe-portal` Edge Function — untested whether this Edge Function is deployed.

---

## 8. Edge Cases & Gaps

### Unauthenticated User
- ✅ `ProtectedRoute` redirects to `/auth` with `from` location state
- ✅ Loading spinner shown while checking auth
- ✅ Edge Functions return 401 on missing/invalid tokens

### Stripe Payment Failure
- ✅ `invoice.payment_failed` webhook sets subscription to `past_due`
- ✅ Failed payment logged in `credit_transactions`
- ⚠️ No UI indication to user that their subscription is `past_due` — they just silently lose features

### Dead Routes / Orphaned Components
- Feature-gated routes (marketplace, gift cards, affiliates, creator profiles, image tools) — all gated but components exist. Not dead, just dormant.
- `/test-credits` — behind feature flag, only for testing.
- `/image-review` — public route, may be unintentional.
- `/plans` and `/upgrade` — both render `UpgradePlan`, redundant.
- `/onboarding` — route exists but unclear what triggers navigation to it.

### useEffect Cleanup
- ✅ `AuthProvider.tsx` uses `isMountedRef` and `cancelled` flag for cleanup — properly handles unmount.
- ✅ `useStoryGeneration.ts` has no direct cleanup issues (no subscriptions).
- ⚠️ `AuthCallback.tsx` sets a 3-second timeout but properly cleans it up on unmount.

---

## 9. Recommended Fixes (Priority Order)

### P0 (Fix immediately — build is broken)
1. **`src/modules/shared/components/ErrorBoundary.tsx`** — Add `export function RouteErrorFallback()` component, OR remove import from `src/app/App.tsx` line 8 and replace usage on line 84 with a simple fallback element.

2. **`src/core/integrations/better-auth/AuthProvider.tsx:127`** — Populate `access_token` properly. Either make `session` async-initialized or document that `getToken()` must always be used.

### P1 (Fix soon)
3. **`src/modules/shared/components/AdminRoute.tsx`** — Replace email-based admin check with a database `is_admin` flag or role column on the `profiles` table.

4. **`src/app/pages/Checkout.tsx`** — Update to use current plan names (`speakNow`, `midnights`) instead of legacy aliases. Remove non-functional coupon UI or implement it.

5. **`src/core/integrations/supabase/client.ts`** — Disable Supabase auth features since BetterAuth handles auth: `auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }`.

6. **`src/modules/story/services/ai.ts`** — Delete all deprecated functions that call `getGroqApiKey()`. They can never work and just add confusion.

7. **`src/config/stripe-products.ts`** — Remove placeholder fallbacks or make them throw clearly. Ensure all `VITE_STRIPE_PRICE_*` env vars are set in Netlify.

### P2 (Cleanup)
8. **Rename Clerk references** — Global find/replace `useClerkAuth` → `useAuth`, `clerkToken` → `authToken`, delete `ClerkAuthContext.tsx` wrapper.
9. **`netlify.toml`** — Remove Clerk domains from CSP, remove `VITE_CLERK_PUBLISHABLE_KEY` from scan omit.
10. **Email module** — Either connect to Brevo (Edge Function exists at `supabase/functions/brevo-email/`) or remove signup confirmation toast.

---

## 10. Summary

| Area | Status |
|------|--------|
| **Tests** | ✅ 576/579 pass (3 skipped) |
| **Build** | ❌ Broken — missing `RouteErrorFallback` export |
| **Security** | ✅ No API keys leaked to client. One concern: admin email pattern matching |
| **Auth (BetterAuth)** | ⚠️ Functional but `access_token` always empty, email verification missing |
| **Stripe** | ✅ Server-side price resolution, webhook handling, idempotency — all solid |
| **Code Quality** | ⚠️ Significant legacy naming debt (Clerk refs), deprecated functions not removed |
| **Edge Functions** | ✅ Properly server-side, CORS configured, secrets handled correctly |

**Overall Assessment**: The core architecture is sound — auth is properly server-side, API keys are protected, Stripe webhooks are robust. The **blocking issue** is the broken build (P0-1), which is a simple missing export. The secondary concern is the empty `access_token` (P0-2) which could cause auth failures in production depending on how consumers use it. Legacy naming and dead code need cleanup but aren't breaking anything.
