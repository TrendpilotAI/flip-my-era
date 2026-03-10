# FlipMyEra — Execution Plan
> Updated: 2026-03-08 | Judge Agent v2

## Architecture Overview

FlipMyEra is a React/Vite SPA with Supabase backend (auth + DB + edge functions), Stripe payments, AI generation via Groq (text) + Runware (images), deployed on Netlify.

```
Browser (React/Vite SPA)
  ↕ Supabase Auth (JWT + Google OAuth)
  ↕ Supabase DB (Postgres + RLS)
  ↕ Supabase Edge Functions (22 functions):
      groq-api              → Groq LLM (story generation)
      groq-storyline        → Groq LLM (storyline planning)
      stream-chapters       → Groq streaming (chapter streaming)
      runware-proxy         → Runware (image generation)
      stripe-webhook        → Stripe events (payment processing)
      create-checkout       → Stripe checkout session
      stripe-portal         → Stripe customer portal
      customer-portal       → Billing access
      deduct-credits        → Credit system (idempotent)
      credits               → Credit balance
      credits-validate      → Credit validation
      check-subscription    → Subscription gating
      admin-credits         → Admin credit management
      ebook-generation      → PDF ebook creation
      brevo-email           → Transactional email (EF exists, frontend stub)
      tiktok-auth           → TikTok OAuth
      tiktok-share-analytics → TikTok sharing analytics
      generate-video        → Video generation
      text-to-speech        → TTS
      webhook-retry-processor → Retry logic
      migrate-email-templates → One-time migration
  ↕ Netlify (CDN + deploy + preview)
  ↕ Stripe (checkout + subscriptions + portal)
```

## Current Scores (2026-03-08)
- revenue_potential: 7/10
- strategic_value: 6/10
- completeness: 7/10
- urgency: 5/10
- effort_remaining: 6/10

## Recent Progress
- ✅ Subscription upsell flow — CreditExhaustionModal + useCredits hook (e6a7d9a)
- ✅ SENTRY_AUTH_TOKEN removed from client bundle (5074c28)
- ✅ 471 tests passing (de2a24a)
- ✅ Credit deduction server-side with idempotency (2642ee4)
- ✅ SEO: h1 tag, JSON-LD schema, heading hierarchy (e059545)

## Dependency Graph

```
FME-001 (remove VITE_OPENAI_API_KEY)
FME-002 (remove VITE_GROQ_API_KEY)
  └── both must ship together to avoid breaking generation flow

FME-003 (fix billing.ts → real checkout)
  └── enables: real subscription purchases
  └── blocks: all subscription revenue (P0)

FME-004 (wire gallery to Supabase)
  └── independent, ship anytime
  └── improves: retention, discovery

FME-005 (social sharing cards)
  └── depends: FME-004 (need real story URLs)
  └── enables: viral growth

FME-006 (guard TestCredits page)
  └── independent, 30 min fix

FME-007 (E2E checkout tests)
  └── depends: FME-003 (need real checkout working first)

FME-008 (referral/gifting)
  └── depends: FME-003 (credits must work)
  └── new DB: referral_codes column in profiles

FME-013 (Brevo email flows)
  └── depends: brevo-email EF (exists ✅)
  └── independent frontend wiring
```

## Recommended Execution Order

### Sprint 1 — Revenue Unblock (1 week)
1. **FME-001 + FME-002**: Remove API keys from client bundle (1 day)
2. **FME-003**: Audit + fix billing.ts → create-checkout EF (2 days)
3. **FME-006**: Guard TestCredits route (30 min)

### Sprint 2 — Retention + Growth (1 week)
4. **FME-004**: Wire gallery to Supabase with pagination (2 days)
5. **FME-013**: Wire Brevo email flows (1 day)
6. **FME-007**: E2E tests for checkout flow (2 days)

### Sprint 3 — Viral Growth (2 weeks)
7. **FME-005**: Social sharing cards (TikTok/IG format) (3 days)
8. **FME-008**: Referral/gifting mechanic (4 days)
9. **FME-011**: Complete all 13 Taylor Swift era templates (2 days)

### Sprint 4 — Polish + Scale
10. **FME-009 + FME-010**: Console.log cleanup + debug file removal (1 day)
11. **FME-014**: Rate limiting on generation edge functions (2 days)
12. **FME-012**: ePub download support (2 days)
13. **FME-015**: A/B test $2.99 vs $4.99 (1 day)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| API key exposure causes billing abuse | High (keys are live) | Critical | FME-001/002 is P0 |
| Billing stub = $0 revenue to date | High | Critical | Audit this immediately |
| TestCredits abuse by users | Medium | High | Simple feature flag fix |
| TikTok EF not fully wired | Medium | High | Test end-to-end before marketing |
| Groq rate limits at scale | Low | Medium | Add retry logic + fallback |
| PDF generation failures at scale | Low | High | Add retry queue (webhook-retry-processor) |

## TODO Files to Create

Each sprint item maps to a TODO file in `/data/workspace/todos/`:

- `FME-001-pending-p0-flip-my-era-remove-openai-api-key-client-bundle.md`
- `FME-002-pending-p0-flip-my-era-remove-groq-api-key-client-bundle.md`
- `FME-003-pending-p0-flip-my-era-fix-billing-stub-checkout.md`
- `FME-004-pending-p1-flip-my-era-wire-gallery-supabase.md`
- `FME-005-pending-p1-flip-my-era-social-sharing-cards.md`
- `FME-006-pending-p1-flip-my-era-guard-test-credits-route.md`
- `FME-007-pending-p1-flip-my-era-e2e-checkout-tests.md`
- `FME-008-pending-p1-flip-my-era-referral-gifting-flow.md`
