# 🎵 FlipMyEra — Phased Development Plan
**Created:** 2026-02-20 | **Judge Score:** 6.8/10 | **Target:** 8.5/10

## Current State
- **Live:** flipmyera.com (Netlify)
- **Stack:** React + Vite, TypeScript, Supabase, Stripe, Tailwind/shadcn
- **Monitoring:** Sentry + OpenTelemetry + PostHog
- **Tests:** 42 files | **CI:** GitHub Actions (lint→typecheck→test→build)
- **Modules:** 19 modules (auth, ebook, story, billing, admin, referral, etc.)
- **Migrations:** 23 Supabase migrations
- **Key gaps:** No dark mode, bloated deps, no E2E in CI, narrow niche, gallery/sharing incomplete

---

## Phase 1: Trim & Harden (Week 1-2)
**Goal:** Cut the fat, shore up what exists

### 1.1 Dependency Audit
- [ ] Audit all 40+ Radix packages — identify unused ones
- [ ] Remove unused Radix/shadcn components (check imports)
- [ ] Audit OpenTelemetry packages — likely over-instrumented for a frontend app
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Target: reduce dependency count by 30%+
- [ ] Measure bundle size before/after

### 1.2 E2E Tests in CI
- [ ] Revive Playwright config (exists but dormant)
- [ ] Write E2E tests for critical paths:
  - [ ] Landing → Sign up → Story creation
  - [ ] Credit purchase → Story generation → Ebook view
  - [ ] Admin dashboard access
- [ ] Add Playwright to GitHub Actions CI
- [ ] Set up E2E test screenshots on failure

### 1.3 Fix Incomplete Features
- [ ] **Gallery** — audit current state, wire to real data or remove from nav
- [ ] **Sharing** — social share buttons + OG meta tags for generated stories
- [ ] **Image Review** — clarify purpose, complete or consolidate into admin
- [ ] **TestCredits page** — dev-only? Gate behind env flag or remove

### 1.4 Dead Code Removal
- [ ] Identify duplicate modules: `creator/` vs `creators/` — consolidate
- [ ] Audit `affiliates/` module — is this active?
- [ ] Audit `marketplace/` module — is this built?
- [ ] Audit `templates/` module — used or aspirational?
- [ ] Remove any dead pages/routes

**Exit criteria:** Leaner bundle, E2E in CI, no dead features in nav
**Score impact:** Performance 6→7, Code Quality 7→8

---

## Phase 2: UX & Polish (Week 3-4)
**Goal:** Make it feel premium — worthy of charging money

### 2.1 Dark Mode
- [ ] Add Tailwind `dark:` variants to all components
- [ ] Theme toggle in header/settings
- [ ] Persist preference in localStorage
- [ ] Test all pages in dark mode (especially ebook reader)
- [ ] Dark mode for admin dashboard too

### 2.2 Ebook Reader Enhancement
- [ ] Improve reading experience (font size, line height controls)
- [ ] Add chapter navigation sidebar
- [ ] Implement bookmarking/progress tracking
- [ ] Add "Continue Reading" on dashboard
- [ ] Print/PDF export option

### 2.3 Onboarding & Conversion
- [ ] Add guided tour for first-time users (3-4 steps max)
- [ ] Improve landing page CTA clarity
- [ ] Add social proof (testimonials, usage stats)
- [ ] Optimize credit purchase flow (reduce friction)
- [ ] A/B test headline variations (PostHog already integrated)

### 2.4 Mobile Experience
- [ ] Audit all pages on mobile viewports
- [ ] Fix any overflow/layout issues
- [ ] Optimize touch targets (44px minimum)
- [ ] Test ebook reader on mobile (most important screen)
- [ ] Add PWA manifest for home screen install

**Exit criteria:** Dark mode live, mobile-polished, onboarding flow, reader upgraded
**Score impact:** UX 7→8, Ease of Use 6→8

---

## Phase 3: Growth Engine (Week 5-7)
**Goal:** Build the features that drive organic growth

### 3.1 SEO & Discoverability
- [ ] SEO-optimized landing pages for key themes/eras
- [ ] Add sitemap.xml generation
- [ ] Implement dynamic OG tags per story (for social sharing)
- [ ] Blog/content section for organic traffic
- [ ] Schema.org markup for creative works

### 3.2 Social & Viral Features
- [ ] One-click share to Instagram, TikTok, Twitter
- [ ] Shareable story preview pages (public URLs)
- [ ] "Made with FlipMyEra" watermark on shared previews
- [ ] Referral rewards amplification (double credits for viral referrals)
- [ ] Embeddable story widgets

### 3.3 Content Expansion (Beyond Taylor Swift)
- [ ] Add era packs: 80s synthwave, Victorian gothic, cyberpunk, medieval fantasy
- [ ] Allow user-defined eras/themes
- [ ] Genre expansion: mystery, romance, sci-fi, horror
- [ ] Collaborative stories (multiple contributors)
- [ ] Story remix — transform someone else's story into a different era

### 3.4 Monetization Optimization
- [ ] Implement tiered subscriptions (Free/Pro/Creator)
- [ ] Add gifting feature (complete the `gifting/` module)
- [ ] Creator marketplace (complete the `marketplace/` module)
- [ ] Bulk credit discounts
- [ ] Analytics dashboard for creators

**Exit criteria:** Shareable stories, broader themes, subscription tiers, SEO pages
**Score impact:** X-Factor 6→8, Capabilities 7→8

---

## Phase 4: Infrastructure & Scale (Week 8-9)
**Goal:** Prepare for real traffic

### 4.1 Performance Optimization
- [ ] Image optimization pipeline (WebP, lazy loading, CDN)
- [ ] Implement service worker for offline reading
- [ ] Add Redis/edge caching for generated content
- [ ] Optimize Supabase queries (add indexes for common patterns)
- [ ] Target: LCP < 2.5s, FID < 100ms, CLS < 0.1

### 4.2 Staging Environment
- [ ] Create staging Supabase project
- [ ] Add staging deploy target in Netlify
- [ ] Wire CI to auto-deploy `develop` → staging
- [ ] Staging-specific env vars and feature flags
- [ ] QA checklist for staging → prod promotion

### 4.3 API Security
- [ ] Audit all VITE_ exposed keys — move secrets to edge functions
- [ ] Implement Supabase Row Level Security audit
- [ ] Add rate limiting on Supabase functions
- [ ] CSRF protection on state-changing operations
- [ ] Add Supabase realtime security rules

### 4.4 Monitoring Expansion
- [ ] Set up Sentry alerts for error spikes
- [ ] PostHog funnels for conversion tracking
- [ ] Supabase dashboard monitoring
- [ ] Netlify analytics review
- [ ] Weekly automated health report

**Exit criteria:** Staging env, optimized performance, secure API, monitoring alerts
**Score impact:** Production Ready 7→9, Performance 7→8

---

## Phase 5: Market Expansion (Week 10-12)
**Goal:** Find product-market fit beyond Swifties

### 5.1 Market Testing
- [ ] Launch 3 non-TS themed landing pages (test organic interest)
- [ ] Run small ad campaigns ($50-100 each) on different audiences
- [ ] Instrument all conversion funnels
- [ ] Interview 10 users (Swifties + non-Swifties)
- [ ] Analyze which eras/themes get most usage

### 5.2 API & Integrations
- [ ] Public API for story generation (developer access)
- [ ] Zapier/Make integration for automation
- [ ] WordPress plugin for embedded stories
- [ ] Discord bot for story generation in servers
- [ ] Notion integration for story export

### 5.3 Creator Economy
- [ ] Creator profiles and public galleries
- [ ] Revenue sharing for popular templates
- [ ] Featured stories and curated collections
- [ ] Creator analytics (reads, shares, revenue)
- [ ] Community voting on stories

### 5.4 Platform Maturity
- [ ] Admin tooling: content moderation, user management
- [ ] Automated abuse detection (prevent prompt injection in stories)
- [ ] GDPR compliance (data export, deletion)
- [ ] Terms of service for user-generated content
- [ ] Copyright handling for AI-generated content

**Exit criteria:** Multi-audience traction, creator tools, API available, legal compliance
**Score impact:** X-Factor 8→9, Ease of Use 8→9

---

## Score Trajectory

| Phase | UX | Caps | Code | Perf | Ease | Prod | X | Total |
|-------|:--:|:----:|:----:|:----:|:----:|:----:|:-:|:-----:|
| Current | 7 | 7 | 7 | 6 | 6 | 7 | 6 | **6.8** |
| Phase 1 | 7 | 7 | 8 | 7 | 6 | 7 | 6 | **7.0** |
| Phase 2 | 8 | 7 | 8 | 7 | 8 | 7 | 6 | **7.4** |
| Phase 3 | 8 | 8 | 8 | 7 | 8 | 7 | 8 | **7.8** |
| Phase 4 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | **8.2** |
| Phase 5 | 8 | 9 | 8 | 8 | 9 | 9 | 9 | **8.7** |

## Dependencies & Risks
- **Niche risk** — Taylor Swift audience is passionate but small; Phase 3/5 address this
- **AI costs** — story + image generation costs per user; need unit economics model
- **Content moderation** — user-generated stories need review pipeline
- **Image generation reliability** — FLUX via proxy is a single point of failure
- **Netlify limits** — free tier has bandwidth caps; may need to move to paid

## Quick Wins (Do This Week)
1. Consolidate `creator/` and `creators/` modules (1 hour)
2. Remove/gate TestCredits page (30 min)
3. Add OG meta tags for story sharing (2 hours)
4. Run `npm audit fix` (30 min)
5. Add dark mode toggle with Tailwind dark: (3 hours)
6. Enable Playwright in CI (2 hours — config already exists)

---

## Status Update 2026-02-27

**Judge Agent v2 Run Complete**

### Scores
| Dimension | Score |
|-----------|-------|
| Revenue Potential | 7/10 |
| Strategic Value | 7/10 |
| Completeness | 6/10 |
| Urgency | 5/10 |
| Effort Remaining | 6/10 |

### Active TODOs Created
- `010` Wire gallery to Supabase (HIGH)
- `011` E2E tests in CI (HIGH)
- `012` Consolidate creator modules (HIGH)
- `013` Dark mode toggle (MEDIUM)
- `014` Dynamic OG tags (HIGH)
- `015` Wire subscription tiers to Stripe (HIGH)
- `016` Move secrets to Edge Functions (HIGH - SECURITY CRITICAL)
- `017` Dynamic sitemap (MEDIUM)
- `226` Voice narration via Fish Audio (MEDIUM)
- `227` Print-on-demand integration (MEDIUM)

### Sub-Agents Spawned
- **Brainstorming Agent** (label: brainstorm-flip-my-era-v2) — extending BRAINSTORM.md
- **Audit Agent** (label: audit-flip-my-era) — writing AUDIT.md
- **Planning Agent** — executed inline (gateway timeouts on spawn)

### Next Actions
1. Fix security critical: TODO #016 (VITE_ API key exposure)
2. Revenue: TODO #010 (gallery) + #015 (subscription tiers)
3. Quality: TODO #011 (E2E CI), #012 (creator module merge)
