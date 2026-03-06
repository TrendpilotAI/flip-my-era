# FlipMyEra — Execution Plan
> Generated: 2026-03-06 | Judge Agent v2

## Architecture Overview

FlipMyEra is a React/Vite SPA with Supabase backend (auth + DB + edge functions), Stripe payments, and AI generation via Groq (text) + Runware (images).

```
Browser (React/Vite)
  ↕ Supabase Auth (JWT)
  ↕ Supabase DB (Postgres + RLS)
  ↕ Supabase Edge Functions:
      groq-api           → Groq LLM (story generation)
      groq-storyline     → Groq LLM (storyline planning)
      stream-chapters    → Groq streaming (chapter streaming)
      runware-proxy      → Runware (image generation)
      stripe-webhook     → Stripe events (payment processing)
      deduct-credits     → Credit system (idempotent)
  ↕ Netlify (CDN + deploy)
  ↕ Stripe (checkout + subscriptions)
```

## Current Scores
- revenue_potential: 7/10
- strategic_value: 6/10
- completeness: 7/10
- urgency: 7/10
- effort_remaining: 6/10 (moderate work to production-ready)

## Dependency Graph

```
TODO-726 (subscription upsell)
  └── requires: Stripe products setup (scripts/setup-stripe-products.js)
  └── requires: TODO-015 (wire subscription tiers) — check if already done

TODO-727 (social sharing)
  └── requires: public story route (new)
  └── requires: Supabase RLS update (new is_public column)
  └── independent of payment flow

TODO-728 (rate limiting)
  └── requires: new DB migration
  └── blocks: nothing else, safe to add anytime

TODO-729 (debug cleanup)
  └── independent, can run anytime
  └── should run BEFORE next production deploy
```

## Recommended Execution Order

### Sprint 1 — Revenue & Security (Week 1)
1. **TODO-726**: Subscription upsell flow — direct revenue impact
2. **TODO-729**: Debug file cleanup — pre-deploy hygiene  
3. **TODO-728**: Rate limiting — cost protection before growth
4. **TODO-011**: E2E tests in CI — quality gate before scaling

### Sprint 2 — Growth (Week 2)
5. **TODO-727**: Social sharing (TikTok/Instagram) — primary growth channel
6. **TODO-014**: Dynamic OG tags for stories — SEO + social previews
7. **TODO-010**: Wire gallery to Supabase — user retention

### Sprint 3 — Polish (Week 3)
8. Complete all era prompt templates
9. Email notifications (story ready, welcome)
10. Lazy-load 4 eagerly-loaded pages
11. PostHog analytics integration

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Stripe webhook fails silently | High | Add dead letter queue + alerting |
| Runware/Groq rate limits hit at scale | High | Already have credit system; add API-level retry |
| CORS misconfig on edge functions | Medium | Audit before launch |
| No E2E in CI — regressions slip | Medium | TODO-011 fixes this |
| Cost blowout from abuse | Medium | TODO-728 rate limiting |
| Social share images look bad | Low | Design review before ship |

## TODO Files Created This Run
- `/data/workspace/todos/726-pending-p0-flip-my-era-subscription-upsell-flow.md`
- `/data/workspace/todos/727-pending-p1-flip-my-era-social-sharing-tiktok.md`
- `/data/workspace/todos/728-pending-p1-flip-my-era-rate-limiting-edge-functions.md`
- `/data/workspace/todos/729-pending-p2-flip-my-era-cleanup-debug-files.md`

## Pre-Existing TODO Files
- 010: wire-gallery-to-supabase (P1)
- 011: e2e-tests-in-ci (P1)  
- 012: consolidate-creator-modules (P1)
- 013: dark-mode-toggle (P2)
- 014: dynamic-og-tags-for-stories (P1)
- 015: wire-subscription-tiers-stripe (P1) ← may overlap TODO-726
- 016: move-secrets-to-edge-functions (P1) ← partially done
- 017: dynamic-sitemap (P2)
- 226: voice-narration-fish-audio (Medium)
- 227: print-on-demand (Medium)
- 228: fix-stripe-checkout-stub (High) ← check if resolved
- 629: remove-sentry-auth-token-from-client (P0) ← DONE in commit 5074c28
