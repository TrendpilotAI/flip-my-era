---
title: "feat: FlipMyEra Phased Development Roadmap"
type: feat
status: active
date: 2026-02-20
judge_score: 6.8
target_score: 8.7
---

# feat: FlipMyEra — Phased Development Roadmap

## Overview

Elevate FlipMyEra from a functional Taylor Swift ebook creator (6.8/10) into a polished, growth-ready AI storytelling platform (8.7/10) through 5 focused phases over 12 weeks. Core strategy: trim bloat, polish UX, expand beyond the Swiftie niche, then scale.

## Problem Statement / Motivation

FlipMyEra is the most mature project in the portfolio — real Stripe payments, Sentry monitoring, CI/CD, 42 tests, 19 modules. But critical gaps hold it back:

- **Bloated dependencies** — 40+ Radix packages, heavy OTel instrumentation for a frontend app
- **No dark mode** — table stakes in 2026
- **Narrow niche** — Taylor Swift fans who want AI ebooks is a tiny market
- **Incomplete features** — Gallery, Sharing, Marketplace, Gifting are partial
- **Duplicate modules** — `creator/` and `creators/` both exist
- **No E2E tests in CI** — Playwright config exists but isn't wired up
- **No staging environment** — deploying straight to prod on Netlify

## Proposed Solution

Five phases, each compounding on the last:

1. **Trim & Harden** → Cut dead code, add E2E, audit deps (Weeks 1-2)
2. **UX & Polish** → Dark mode, reader upgrade, mobile, onboarding (Weeks 3-4)
3. **Growth Engine** → Expand themes, social sharing, SEO, subscriptions (Weeks 5-7)
4. **Infrastructure & Scale** → Staging, performance, security (Weeks 8-9)
5. **Market Expansion** → API, creator economy, multi-audience testing (Weeks 10-12)

## Technical Approach

### Architecture

Current module structure (19 modules — some redundant):
```
src/modules/
├── admin/          # Admin dashboard pages
├── affiliates/     # ❓ Active or dead?
├── auth/           # Authentication (Supabase)
├── billing/        # ❓ vs subscriptions?
├── creator/        # ❓ vs creators?
├── creators/       # ❓ vs creator?
├── ebook/          # Core ebook generation ✅
├── email/          # Email templates
├── gifting/        # 🔶 Partial
├── images/         # AI image generation ✅
├── marketplace/    # 🔶 Partial
├── onboarding/     # User onboarding
├── referral/       # Referral system ✅
├── shared/         # Cross-cutting components
├── sharing/        # 🔶 Partial
├── story/          # Core story generation ✅
├── subscriptions/  # Stripe billing ✅
├── templates/      # Story templates
└── user/           # User profile/dashboard
```

Target: consolidate to 12-14 focused modules, eliminate duplicates.

### Implementation Phases

#### Phase 1: Trim & Harden (Weeks 1-2)

**Dependency Audit:**
- [ ] Run `npx depcheck` to identify unused packages
- [ ] Audit Radix packages: `grep -r "@radix-ui" src/ | cut -d: -f2 | sort -u` — remove unused
- [ ] Evaluate OTel instrumentation — 10+ OTel packages for a frontend app is overkill
  - Keep: `@opentelemetry/api`, web SDK
  - Likely remove: individual instrumentations (document-load, user-interaction, xml-http-request)
- [ ] Run `npm audit fix` for security vulnerabilities
- [ ] Measure bundle before: `npx vite-bundle-visualizer`
- [ ] **Target:** reduce dependency count by 30%, bundle by 20%

**E2E Tests:**
- [ ] Audit existing Playwright config in `playwright.config.ts`
- [ ] Write E2E for critical path 1: Landing → Sign Up flow
- [ ] Write E2E for critical path 2: Story creation → Streaming generation → Ebook view
- [ ] Write E2E for critical path 3: Credit purchase → Checkout → Success
- [ ] Write E2E for admin dashboard access
- [ ] Add Playwright to GitHub Actions CI: `.github/workflows/ci.yml`
- [ ] Configure screenshot-on-failure for debugging

**Dead Code & Module Consolidation:**
- [ ] **`creator/` vs `creators/`** — audit both, merge into one module
- [ ] **`billing/` vs `subscriptions/`** — audit overlap, consolidate
- [ ] **`affiliates/`** — check if any component imports from here; if not, remove
- [ ] **`marketplace/`** — assess completion level; if <30% done, move to `_future/`
- [ ] **`gifting/`** — assess completion; if stub, move to `_future/`
- [ ] **`TestCredits` page** — gate behind `import.meta.env.DEV` or remove
- [ ] Remove `e2e-screenshots/`, `screenshots/audit/` if committed (should be gitignored)

**Success criteria:** 30% fewer deps, E2E in CI, no duplicate modules, no dead code in nav
**Score impact:** Performance 6→7, Code Quality 7→8

#### Phase 2: UX & Polish (Weeks 3-4)

**Dark Mode:**
- [ ] Add `darkMode: 'class'` to Tailwind config (or verify selector strategy)
- [ ] Add `dark:` variants to all shadcn components (many support it natively)
- [ ] Theme toggle component in header nav
- [ ] Persist theme preference in localStorage
- [ ] Test every page in dark mode, especially:
  - [ ] Ebook reader (most time spent here)
  - [ ] Story generation streaming view
  - [ ] Admin dashboard charts
- [ ] Ensure Radix/shadcn popovers and modals respect dark mode

**Ebook Reader Upgrade:**
- [ ] Font size control (small/medium/large)
- [ ] Line height / spacing control
- [ ] Chapter navigation sidebar (drawer on mobile)
- [ ] Bookmarking + reading progress (save to Supabase)
- [ ] "Continue Reading" card on user dashboard
- [ ] Print-friendly CSS / PDF export option
- [ ] Night mode specific to reader (sepia, dark, paper white)

**Onboarding & Conversion:**
- [ ] 3-step guided tour for first-time users (react-joyride or custom)
- [ ] Landing page CTA improvements (A/B test via PostHog — already integrated)
- [ ] Social proof section: "X stories created" counter, sample story previews
- [ ] Streamline credit purchase: reduce clicks from 4 → 2
- [ ] Exit-intent popup with free story offer

**Mobile:**
- [ ] Viewport audit all 20 pages
- [ ] Fix overflow on ebook reader for narrow screens
- [ ] Touch targets ≥ 44px on all buttons
- [ ] Bottom sheet navigation on mobile (vs sidebar)
- [ ] Add PWA manifest + service worker for offline reading
- [ ] Test on iPhone Safari, Android Chrome

**Success criteria:** Dark mode live, reader has controls, mobile feels native, first-time UX is smooth
**Score impact:** UX 7→8, Ease of Use 6→8

#### Phase 3: Growth Engine (Weeks 5-7)

**SEO & Discovery:**
- [ ] Create `/eras/[era-name]` landing pages with unique content per era
- [ ] Generate `sitemap.xml` from Vite plugin or build script
- [ ] Dynamic OG tags per story: title, description, preview image
- [ ] Add `/blog` or `/stories` section for organic traffic
- [ ] Schema.org `CreativeWork` markup on story pages
- [ ] Target long-tail keywords: "AI story generator", "era transformation", "AI ebook maker"

**Social & Viral:**
- [ ] One-click share to Instagram Stories, TikTok, Twitter/X
- [ ] Public story preview URLs: `flipmyera.com/story/[id]` (read-only, no auth required)
- [ ] "Made with FlipMyEra ✨" watermark on shared previews
- [ ] Double referral credits for shares that convert
- [ ] Embeddable story card (iframe widget for blogs/Notion)

**Content Expansion:**
- [ ] **New era packs:** 80s Synthwave, Victorian Gothic, Cyberpunk 2077, Medieval Fantasy, Roaring 20s
- [ ] **Custom eras:** user-defined theme + tone + visual style
- [ ] **Genre expansion:** Mystery, Romance, Sci-Fi, Horror, Comedy
- [ ] **Story remix:** take any public story, transform to different era
- [ ] **Collaborative stories:** invite friend to contribute chapters

**Monetization:**
- [ ] Tiered subscriptions: Free (1 story/mo), Pro ($9/mo, 10 stories), Creator ($29/mo, unlimited)
- [ ] Complete `gifting/` module: buy stories as gifts
- [ ] Bulk credit discounts (10 pack, 50 pack)
- [ ] Creator revenue share for popular templates
- [ ] Affiliate program via `affiliates/` module (if viable)

**Success criteria:** 5+ new era themes, public sharing URLs, subscription tiers live, SEO pages indexed
**Score impact:** X-Factor 6→8, Capabilities 7→8

#### Phase 4: Infrastructure & Scale (Weeks 8-9)

**Performance:**
- [ ] Image optimization: WebP conversion, responsive srcset, lazy loading
- [ ] Service worker for offline ebook reading
- [ ] Edge caching via Netlify Edge Functions for generated content
- [ ] Supabase query optimization: add indexes for `stories(user_id)`, `credits(user_id)`
- [ ] **Targets:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Lighthouse CI in GitHub Actions (fail build if score drops)

**Staging Environment:**
- [ ] Create staging Supabase project (separate from prod)
- [ ] Netlify branch deploys: `develop` → staging.flipmyera.com
- [ ] Staging-specific env vars in Netlify UI
- [ ] Feature flag system: `src/core/config/featureFlags.ts` (exists — wire to UI)
- [ ] QA checklist doc for staging → prod promotion

**API Security:**
- [ ] Audit all `VITE_` env vars — move secrets to Supabase Edge Functions
- [ ] Supabase RLS audit: every table must have row-level security
- [ ] Rate limiting on Supabase Functions (prevent abuse of AI generation)
- [ ] CSRF protection on state-changing operations
- [ ] Review CSP in `netlify.toml` — tighten `unsafe-inline` and `unsafe-eval`

**Monitoring:**
- [ ] Sentry alert rules: error spike >10/min, new error type
- [ ] PostHog funnels: signup → first story → payment → share
- [ ] Weekly automated health report (Sentry + PostHog → email digest)
- [ ] Supabase usage dashboard monitoring (approaching limits?)
- [ ] Netlify bandwidth tracking (free tier limits)

**Success criteria:** Staging env working, Lighthouse >90, no `VITE_` secrets exposed, alert rules active
**Score impact:** Production Ready 7→9, Performance 7→8

#### Phase 5: Market Expansion (Weeks 10-12)

**Market Testing:**
- [ ] Launch 3 non-TS landing pages: "AI Story Generator", "Fantasy Ebook Maker", "Romance Story AI"
- [ ] Small ad campaigns ($50-100 each): TikTok, Instagram, Reddit
- [ ] Instrument conversion funnels per traffic source
- [ ] 10 user interviews (5 Swifties, 5 non-Swifties)
- [ ] Analyze era/theme usage data to find PMF signal

**API & Integrations:**
- [ ] Public REST API for story generation (developer access, API key auth)
- [ ] Zapier integration: "New Story Created" trigger
- [ ] WordPress plugin: embed stories in blog posts
- [ ] Discord bot: `/flipmyera [prompt]` → generates story in channel
- [ ] Notion export integration

**Creator Economy:**
- [ ] Creator profiles: public gallery of their stories
- [ ] Creator analytics: reads, shares, revenue per story
- [ ] Featured stories and curated collections
- [ ] Community voting on stories
- [ ] Revenue sharing for template creators

**Legal & Compliance:**
- [ ] GDPR: data export and deletion endpoints
- [ ] Terms of service for user-generated content
- [ ] AI content copyright policy (who owns generated stories?)
- [ ] Content moderation: automated check for harmful content in prompts
- [ ] Age verification (target audience includes 13-17)

**Success criteria:** Multi-audience traction data, API launched, creator profiles live, legal docs complete
**Score impact:** X-Factor 8→9, Ease of Use 8→9

## System-Wide Impact

### Interaction Graph
- Story creation → `useStreamingGeneration` → Supabase Edge Function → Groq/OpenAI API → streaming SSE → `StreamingChapterView` → Supabase insert
- Image generation → Runware proxy (`VITE_RUNWARE_PROXY_URL`) → FLUX 1.1 Pro → Supabase Storage → `ImageReview`
- Payment → Stripe Checkout → webhook → Supabase Edge Function → credit increment → UI refresh
- Auth → Supabase Auth (was Clerk, migrated) → RLS policies → user-scoped data

### Error Propagation
- Groq API failure → `useStreamingGeneration` catches → shows retry button (good)
- Runware proxy timeout → image generation fails → story created without images (degraded but functional)
- Stripe webhook failure → credits not applied → user contacts support (needs dead letter queue)
- Supabase Auth token expiry → silent 401 → user sees blank page (needs refresh handler)

### State Lifecycle Risks
- Story generation interrupted → partial chapters in Supabase → no cleanup job
- Credit deducted but generation fails → credit lost → needs refund mechanism
- Image generation succeeds but story save fails → orphaned images in Storage

## Alternative Approaches Considered

1. **Rebuild as Next.js** — rejected; Vite + SPA is working, Netlify deployment is smooth
2. **Drop Taylor Swift entirely** — rejected; it's the brand identity, expand alongside it
3. **Move to Vercel** — rejected; Netlify is working, CSP headers configured, no reason to migrate
4. **Native mobile app** — rejected for now; PWA first, native if PMF is proven

## Score Trajectory

| Phase | UX | Caps | Code | Perf | Ease | Prod | X | Total |
|-------|:--:|:----:|:----:|:----:|:----:|:----:|:-:|:-----:|
| Current | 7 | 7 | 7 | 6 | 6 | 7 | 6 | **6.8** |
| Phase 1 | 7 | 7 | 8 | 7 | 6 | 7 | 6 | **7.0** |
| Phase 2 | 8 | 7 | 8 | 7 | 8 | 7 | 6 | **7.4** |
| Phase 3 | 8 | 8 | 8 | 7 | 8 | 7 | 8 | **7.8** |
| Phase 4 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | **8.2** |
| Phase 5 | 8 | 9 | 8 | 8 | 9 | 9 | 9 | **8.7** |

## Dependencies & Prerequisites

- **AI API costs** — Groq (story) + Runware/FLUX (images) per generation; need unit economics
- **Netlify bandwidth** — free tier may cap at scale; monitor usage
- **Supabase limits** — free tier: 500MB DB, 1GB storage, 2GB bandwidth
- **Content moderation** — user-generated stories need review (age 13+ audience)
- **Copyright clarity** — AI-generated content ownership is legally unsettled

## Risk Analysis & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Niche too small for growth | High | High | Phase 3 expands themes aggressively |
| AI costs exceed revenue | Medium | High | Cache aggressively, tiered quality (fast vs premium) |
| Netlify free tier limits hit | Medium | Medium | Monitor bandwidth, upgrade to Pro ($19/mo) if needed |
| Image generation provider changes | Medium | Medium | Abstract behind interface, support multiple providers |
| Age verification requirements | Low | High | Add age gate, COPPA-compliant data handling |

## References & Research

### Internal References
- Judge report: `/data/workspace/reports/judge-flipmyera-2026-02-20.json`
- Vite config: `vite.config.ts` (proxy, build settings)
- Netlify config: `netlify.toml` (headers, CSP, redirects)
- Feature flags: `src/core/config/featureFlags.ts`
- A/B testing: `src/core/analytics/abTest.ts`
- Sentry: `src/core/integrations/sentry.ts`
- OTel: `src/core/integrations/opentelemetry.ts`
- PostHog: `src/core/integrations/posthog.ts`

### External References
- Netlify deployment docs: https://docs.netlify.com
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Playwright CI: https://playwright.dev/docs/ci
- COPPA compliance: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
