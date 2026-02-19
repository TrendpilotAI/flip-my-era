# FlipMyEra — Project Audit

**Date:** 2025-02-17  
**Auditor:** Honey (AI Operator)  
**Project:** FlipMyEra — AI-powered Taylor Swift-themed ebook creator

---

## 1. Current State Assessment

### What Works ✅
- **Test suite:** 171 tests passing, 58 skipped, 0 failures — clean run in 12s
- **Modular architecture:** Well-organized `src/modules/` structure (auth, ebook, story, shared, user)
- **Auth:** Clerk integration with Supabase JWT forwarding
- **AI pipeline:** Story generation via Groq Edge Functions (server-side, no client key exposure)
- **Image generation:** Runware/FLUX 1.1 Pro integration via Supabase Edge Functions
- **Payments:** Stripe checkout with credit packs ($25/$50/$100) and subscriptions ($12.99/$25/$49.99/mo)
- **Webhook handling:** Stripe webhook with signature verification, credit allocation
- **Credit system:** Full credit transaction ledger with purchase/usage tracking
- **Security headers:** CSP, X-Frame-Options, HSTS-ready in netlify.toml
- **Streaming:** Real-time chapter generation with streaming UI
- **7 Taylor Swift eras:** Full era system with themed prompts and imagery
- **Ebook generation:** PDF creation with illustrations via jspdf
- **Error tracking:** Sentry integration (package installed, needs DSN config)
- **Observability:** OpenTelemetry + PostHog analytics stubs

### What's Not Yet Done / Broken ⚠️
- **Sentry DSN not configured** — error tracking is wired but inactive
- **No E2E tests** — only unit/integration tests exist
- **58 tests skipped** — likely streaming/WebSocket/OOM tests deferred
- **No CI/CD pipeline** — no GitHub Actions workflow
- **No staging environment** — only prod Netlify deploy
- **Bundle size unmeasured** — no rollup-plugin-visualizer
- **Rate limiting in-memory only** — won't survive restarts or scale
- **`lovable-tagger` dev dependency** — suggests Lovable.dev origin (AI-generated scaffolding)
- **Massive doc sprawl** — 60+ markdown files in root, many redundant/stale

### Production Readiness Score: **6/10**

The code is structurally sound and tests pass, but it has never been deployed to production with real users. Key gaps: no Sentry DSN, no CI/CD, no E2E tests, no performance baseline, pricing untested with real Stripe products.

---

## 2. Tech Stack Review

| Layer | Tech | Assessment |
|-------|------|------------|
| **Frontend** | React 18 + TypeScript + Vite 5 | ✅ Solid, modern |
| **Styling** | Tailwind CSS + shadcn/ui + Radix | ✅ Good component library |
| **Auth** | Clerk | ✅ Handles Google OAuth, JWT |
| **Database** | Supabase (Postgres + Edge Functions) | ✅ Good for this scale |
| **Payments** | Stripe (Checkout + Webhooks) | ✅ Properly implemented |
| **AI** | Groq (story gen) + Runware (images) | ✅ Server-side via Edge Functions |
| **Hosting** | Netlify | ✅ Simple, SPA-friendly |
| **Monitoring** | Sentry + PostHog + OpenTelemetry | ⚠️ Installed but unconfigured |
| **PDF** | jspdf | ⚠️ Limited formatting capabilities |
| **Animation** | Framer Motion | ✅ Good but adds bundle weight |

**Dependency bloat concern:** 40+ Radix packages, OpenTelemetry stack (7 packages), recharts — many likely unused. Package.json has 80+ dependencies.

---

## 3. Test Coverage Status

```
Test Files:  17 passed | 6 skipped (23)
Tests:       171 passed | 58 skipped (229)
Duration:    11.97s
```

**Pass rate: 100%** (of non-skipped). **Coverage of total: 74%** (171/229).

Covered areas:
- ProtectedRoute, ErrorBoundary, EnvironmentValidator
- Groq API utils, credit pricing, error handling, API retry
- Ebook components (BookReader, ChapterView, ActionButtons, etc.)
- Story generation hooks
- AI service layer

Skipped areas (58 tests):
- Streaming generation (OOM issues)
- WebSocket/Runware integration
- Legacy ClerkAuthContext
- StoryForm edge cases

---

## 4. Security Review

### ✅ Good
- API keys (Groq, OpenAI, Runware) moved to Supabase Edge Functions — not in client bundle
- Deprecated `getGroqApiKey()`/`getOpenAiApiKey()` return `undefined` in production
- Stripe webhook signature verification implemented
- CSP headers configured with appropriate domains
- CORS headers on Edge Functions
- Clerk JWT verification on protected endpoints
- RLS policies in Supabase migrations

### ⚠️ Concerns
1. **`VITE_GROQ_API_KEY` and `VITE_OPENAI_API_KEY` in env.example** — These VITE_ prefixed keys would be bundled into client JS if set. The code guards against it in prod, but the env template is misleading.
2. **Stripe product/price IDs hardcoded in client code** (`src/config/stripe-products.ts`) — Not a secret, but hardcoded prod IDs make it rigid.
3. **CORS `Access-Control-Allow-Origin: "*"` on webhook** — Should be restricted to Stripe IPs only.
4. **No rate limiting on Edge Functions in production** — In-memory rate limiter won't persist.
5. **`supabase` service role key used in webhook** — Correct pattern, but ensure it's only in Edge Function secrets.

---

## 5. Performance Review

### ⚠️ Unknown — No Baseline Measured
- No Lighthouse scores recorded
- No bundle size analysis done
- Manual chunks configured in Vite (vendor-react, vendor-clerk, etc.) — good practice
- Code splitting exists but no lazy loading of routes/pages
- No image optimization (WebP/AVIF)
- Framer Motion + full Radix + OpenTelemetry stack = likely large bundle

### Recommendations
1. Run `npx vite-bundle-visualizer` to get actual sizes
2. Lazy-load StoryWizard and EbookGenerator components
3. Remove unused Radix components (40+ imported, maybe 15 used)
4. Drop OpenTelemetry if not actually sending traces (7 packages)

---

## 6. UX/Design Assessment

### ✅ Strengths
- Taylor Swift era theming is the core differentiator — well-conceived
- Wizard-style story creation flow (era → prompt → character → details → generate)
- Real-time streaming text generation
- Credit system with clear pricing tiers
- Mobile-first intent stated in README

### ⚠️ Concerns
- **No screenshots or live demo URL** — can't verify actual UX without deploying
- **Target audience is 13-19 year olds** — COPPA/privacy implications for under-13s
- **$25 minimum credit pack** is steep for teens — consider a $5 "try it" pack
- **No free tier/trial** visible — users can't try before paying
- **TikTok share feature** exists but unclear if functional
- **Admin pages** (AdminCredits, AdminDashboard, AdminUsers) — no admin auth guard visible beyond route protection

---

## 7. Bugs & Issues Found

### Critical 🔴
1. **No `.env` file exists** — app won't run locally without manual setup
2. **Sentry DSN not configured** — error tracking is dead in production
3. **No CI/CD** — no automated testing on push/PR

### High 🟡
4. **58 skipped tests** — streaming/WebSocket tests deferred, potential hidden bugs
5. **`VITE_GROQ_API_KEY` in env.example** — misleading, could cause accidental client-side exposure
6. **CORS wildcard on stripe-webhook** — should restrict origin
7. **`balance_after_transaction: 0` hardcoded** in webhook — comment says "calculated by trigger" but no trigger verified
8. **Duplicate file structure** — `src/App.tsx` AND `src/app/App.tsx` both exist; `src/contexts/ClerkAuthContext.tsx` AND `src/modules/auth/contexts/ClerkAuthContext.tsx` — unclear which is canonical
9. **`ClerkAuthContext.fixed.tsx`** exists alongside `ClerkAuthContext.tsx` — dead code?
10. **Icon files with no extension** in multiple directories (macOS `.DS_Store`-like artifacts?)

### Medium 🟠
11. **60+ markdown docs in root** — overwhelming, many stale/redundant
12. **`lovable-tagger` dev dependency** — vestigial from AI scaffolding tool
13. **`audit_script.py`** in root — Python script in a Node.js project
14. **Multiple HTML debug files** in root (`debug-image-viewer.html`, `debug-ultimate.html`, etc.)
15. **`test-jwt-debug.js`, `test-webhook-retry.js`** — ad-hoc test scripts in root
16. **`session.md`** in root — likely contains session-specific notes that shouldn't be committed
17. **SamCart references** in env.example — but no SamCart integration code found (abandoned?)
18. **`generate-video` Edge Function** exists but no video feature in UI

### Low 🔵
19. **No LICENSE file** despite README claiming MIT
20. **`flip-my-era.code-workspace`** committed — IDE-specific file
21. **`node_modules` appears in ls output** — should be gitignored (may just be local)
22. **`dist` directory present** — should be gitignored

---

## 8. Summary

FlipMyEra is a **well-architected MVP** with solid fundamentals (modular code, server-side API keys, Stripe webhooks, passing tests). However, it shows clear signs of **multi-agent development**: duplicate files, stale docs, abandoned features (SamCart, video generation), and no production deployment verification.

**To ship, focus on:** cleanup dead code/docs, configure Sentry, set up CI/CD, add a free trial, and do one real end-to-end test with actual Stripe test mode.
