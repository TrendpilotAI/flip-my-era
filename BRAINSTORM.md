# FlipMyEra — Engineering & Growth Brainstorm
> Generated: 2026-02-26 | Analyst: Compound Engineering Brainstorming Agent

---

## 🏆 TOP 10 HIGHEST-ROI ITEMS (Quick Reference)

| # | Item | Category | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Complete 5 missing era prompt files | New Features | S | **Very High** |
| 2 | Move GROQ/OpenAI keys from VITE_ to Edge Functions | Security | M | **Very High** |
| 3 | Add subscription tiers (Swiftie / Superfan / Collector) | Monetization | M | **Very High** |
| 4 | Wire gallery + sharing pages to real Supabase data | New Features | M | **High** |
| 5 | Integrate print-on-demand (Printful/Printify) | Integrations | M | **High** |
| 6 | Add Playwright E2E to CI pipeline | Workflows | S | **High** |
| 7 | Eliminate creator/ vs creators/ duplicate modules | Code Quality | S | **Medium** |
| 8 | Dynamic XML sitemap + schema.org markup | SEO/Growth | S | **High** |
| 9 | Voice narration via Fish Audio / ElevenLabs TTS | New Features | M | **High** |
| 10 | RLS policy audit + rate limiting hardening | Security | M | **Very High** |

---

## 1. New Features

### 🏆 #1 — Complete Missing Era Prompt Files
**Effort: S | Impact: Very High**

5 of 7 eras (Showgirl, Folklore, Red, Reputation, Lover) have zero AI prompt files. The prompt system already exists (`storyPrompts.ts` is working for the eras present). This is the single fastest path to shipping a complete product. Each era needs ~5-8 well-crafted story prompts with the existing `StoryPrompt` schema (`vibeCheck`, `genZHook`, `swiftieSignal`). Era-specific prompts are the product's creative soul — incomplete coverage makes the app feel half-baked to Swifties.

**Action:** Write prompt sets for each era mirroring the Showgirl and 1989 style. Budget 2 hours of careful writing + LLM assistance per era.

---

### 🏆 #4 — Wire Gallery & Sharing Pages to Real Data
**Effort: M | Impact: High**

`ShareablePreview.tsx` and `ShareButtons.tsx` exist but sharing module tests are empty (`__tests__/` dir is empty). Gallery presumably loads static or mock data. Real sharing drives organic virality — each shared story is a free acquisition channel. Priority order:
1. Wire gallery to `stories` table via React Query
2. Implement public story URLs (`/story/:shareId`) with server-rendered OG tags via Netlify Edge
3. Surface share buttons post-story-creation with pre-filled caption copy
4. Add view counts and a "Most Popular" sort to gallery

---

### 🏆 #9 — Voice Narration (TTS)
**Effort: M | Impact: High**

`supabase/functions/text-to-speech/` already exists — this is further along than it looks. The gap is likely the frontend player UI and connecting it to generated story chapters.

**Implementation path:**
- Add audio player component to story viewer (Howler.js or native `<audio>`)
- Call `text-to-speech` edge function per chapter, cache audio blob in Supabase Storage
- Use Fish Audio (workspace already has API key) — $0.015/min, 6.5x cheaper than ElevenLabs
- Gate audio as a premium feature (Superfan tier)

**Revenue angle:** Audio narration is a natural upsell. Swifties already consume Spotify-style content. "Hear your story come to life" is a compelling CTA.

---

### AI Album Artwork Generator
**Effort: M | Impact: High**

Runware integration is live. Add a dedicated "Album Cover" generation mode that creates Taylor Swift era-styled artwork using the user's name and chosen era. Output: downloadable 3000×3000px PNG with era-specific aesthetic.

- Creates shareable content ("My Reputation album cover!")
- Natural add-on purchase (2-3 credits)
- Highly viral — album covers spread across Twitter/TikTok naturally

---

### Era Challenge / Community Mode
**Effort: L | Impact: Medium**

Weekly community challenges: "This week: write your Folklore forest story." Submissions go to a public gallery. Community votes for favorites. Top stories get featured on the home page.

- Drives recurring engagement (weekly return rate)
- Creates social proof content
- Low-effort moderation via existing `ContentModeration.tsx`

---

### Collaborative Stories
**Effort: XL | Impact: Medium**

Real-time co-writing where two users contribute alternating chapters. Complex but differentiated.

**Defer until:** Gallery + sharing is solid and you have >1K MAU.

---

### Dark Mode
**Effort: S | Impact: Medium**

Taylor Swift's aesthetic lends itself perfectly to dark mode. The app uses Tailwind + Radix which both support `dark:` variants. Add a theme toggle, store preference in `localStorage` and Supabase user profile. Swiftie audiences skew toward aesthetics-obsessed users who love dark mode.

---

## 2. Code Quality

### 🏆 #7 — Remove creator/ vs creators/ Duplicate Module
**Effort: S | Impact: Medium**

`src/modules/creator/` has 4 files: `CreatorAnalytics.tsx`, `CreatorProfile.tsx`, `FeaturedCreators.tsx`, `VerificationBadge.tsx`.  
`src/modules/creators/` has the same 3 plus: `CreatorBadges.tsx`, `TipJar.tsx`, `types.ts` — a superset.

**Action:**
1. Confirm `creator/` (without S) is unused via grep for imports
2. Delete `src/modules/creator/` entirely
3. Update any stray imports

One-day task that prevents future maintainer confusion.

---

### Dead Module Inventory
**Effort: S | Impact: Medium**

Several modules are clearly aspirational stubs:
- `src/modules/marketplace/` — `ContentModeration.tsx`, `Marketplace.tsx`, `ReviewSystem.tsx` (likely unrouted)
- `src/modules/gifting/` — only `GiftCard.tsx` and `index.ts`
- `src/modules/affiliates/` — tests exist, unclear if wired to UI

**Action:** Run a dead-code audit using `ts-prune` or `knip`. Remove or clearly flag aspirational modules with `// TODO: ASPIRATIONAL` comments so future contributors don't think they're production code.

---

### Type Safety — Eliminate `any` and Unsafe Casts
**Effort: M | Impact: Medium**

Run `grep -r ": any" src/` and `grep -r "as any" src/` to surface type holes. Common patterns to fix:
- Supabase query results often get cast to `any` — use generated types from `supabase gen types typescript`
- Event handlers with implicit `any`
- API response shapes untyped

Add `"strict": true` to `tsconfig.json` if not already set (and fix the resulting errors).

---

### Consolidate Duplicate Supabase Clients
**Effort: S | Impact: Medium**

There are two Supabase client locations: `src/core/integrations/supabase/client.ts` and `src/integrations/supabase/`. This is a footgun — components importing from different paths may use different instances.

**Action:** Pick one canonical path (`src/core/integrations/supabase/`), delete the other, run `find . -name "*.ts" -o -name "*.tsx" | xargs grep "from.*integrations/supabase" | grep -v core` to identify and update all stale imports.

---

### Hook: `useStoryGeneration` God Hook Decomposition
**Effort: M | Impact: Medium**

Story generation likely has a fat hook or context that handles too many concerns (prompts, images, chapters, credits). Decompose into:
- `useStoryPrompt` — prompt selection/customization
- `useChapterGeneration` — streaming chapter content
- `useImageGeneration` — Runware calls per chapter
- `useCreditLedger` — debit/balance checks

This improves testability and makes unit testing each concern trivial.

---

## 3. Testing

### 🏆 #6 — Wire Playwright E2E into CI
**Effort: S | Impact: High**

10 Playwright spec files exist (`wizard-flow.spec.ts`, `auth-flow.spec.ts`, `smoke.spec.ts`, etc.) but the `ci.yml` only runs Vitest. This is the easiest high-value testing win: add one GitHub Actions job with `npx playwright install --with-deps && npx playwright test --reporter=html`.

**Minimal CI addition:**
```yaml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 22 }
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npx playwright test --reporter=github
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    # ... test user credentials
```

---

### Critical Path Zero-Coverage Areas

**Story generation pipeline** — The end-to-end flow (user inputs → Groq stream → chapter display → image generation) is the app's core value. If this breaks silently, the product is dead. Needs:
- Unit tests for each edge function (`groq-storyline`, `stream-chapters`, `ebook-generation`)
- MSW mocks for Groq streaming in Vitest
- E2E test asserting full story generates

**Payment + Credits Flow** — `stripe-webhook` edge function tests exist, but frontend credit deduction and Stripe checkout flow likely have no E2E coverage.

**Auth Migration Regression** — Auth was just migrated from Clerk to Supabase. Regression tests for login, signup, session persistence, and logout are essential. `auth-flow.spec.ts` exists — confirm it runs.

**Sharing + Gallery** — Zero tests in `sharing/__tests__/`. Add unit tests for URL generation, OG tag construction, and share button rendering.

---

### Missing Test Categories

| Path | Test Type | Priority |
|------|-----------|----------|
| `supabase/functions/ebook-generation` | Unit (Deno) | High |
| `supabase/functions/text-to-speech` | Unit (Deno) | Medium |
| `supabase/functions/runware-proxy` | Unit (Deno) | High |
| `modules/sharing/` | Unit (Vitest) | High |
| `modules/gifting/` | Unit (Vitest) | Medium |
| Full checkout flow | E2E (Playwright) | High |
| Gallery pagination | Unit + E2E | Medium |
| Rate limiter under load | Integration | High |

---

## 4. Integrations

### 🏆 #5 — Print-on-Demand (Printful / Printify)
**Effort: M | Impact: High**

Physical e-books and merch are a massive revenue multiplier. Users who create a story would pay $15-30 for a physical printed book mailed to them. Integration path:

1. **Printful API:** After ebook PDF is generated, POST to Printful `/orders` with book PDF + user address
2. **Printify alternative:** More SKU flexibility, better pricing
3. **UI:** Add "Print My Book" CTA on story completion screen
4. **Pricing:** $18.99 for softcover, $24.99 for hardcover — margin ~40-50% after Printful cut

**Revenue estimate:** Even 5% of users ordering a physical copy at $20 profit = significant LTV boost.

---

### Resend for Transactional Email
**Effort: S | Impact: High**

Brevo edge function exists (`brevo-email/`), but Resend is significantly more developer-friendly and has better deliverability. Migration path:

Key emails to build/improve:
- **Story ready** — "Your [ERA] story is ready! 📖" with preview image
- **Credit low** — "You're down to 2 credits — top up to keep creating"
- **Gift received** — "Someone sent you a FlipMyEra gift!"
- **Weekly digest** — Community challenge reminder

---

### TikTok / Instagram Sharing API
**Effort: M | Impact: High**

`tiktok-share-analytics/` and `tiktok-auth/` edge functions already exist — this is partially built. Complete the loop:

1. **TikTok:** Use TikTok Creator API to post a short video (slideshow of story illustrations + narration audio) directly from the app
2. **Instagram:** Reels format — 5-image carousel with era-themed captions
3. **Download-first fallback:** If API sharing fails, offer a pre-packaged ZIP (images + caption copy)

The TikTok angle is the highest-upside viral channel for Taylor Swift content.

---

### PostHog Funnels & Session Replay
**Effort: S | Impact: High**

PostHog integration already exists. Ensure these critical funnels are instrumented:
- Landing → Signup → First story created → Credit purchase
- Story abandoned at which step?
- Which eras convert best?
- Which prompts get selected most?

Use PostHog Session Replay to watch where users drop off in the story wizard.

---

### Webhook Reliability — Retry Queue
**Effort: S | Impact: Medium**

`webhook-retry-processor/` edge function exists. Confirm it's wired to a Supabase cron job and actually retrying failed Stripe webhooks. A missed `payment_intent.succeeded` event = lost credit grant = angry user.

---

## 5. Workflows

### 🏆 #6 (continued) — CI Improvements

Beyond Playwright, improve the CI pipeline:

**Add to `ci.yml`:**
```yaml
- name: Check for unused exports
  run: npx knip --no-exit-code

- name: Bundle size check
  run: npm run build && npx bundlesize
```

**Pre-commit hooks (Husky + lint-staged):**
```bash
npm install --save-dev husky lint-staged
npx husky init
```
`.husky/pre-commit`:
```bash
npx lint-staged
```
`package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,json,md}": ["prettier --write"]
}
```

---

### Automated Netlify Deploy Previews with E2E
**Effort: M | Impact: Medium**

Configure Netlify to run Playwright E2E against each deploy preview URL before auto-promoting to production. Uses `DEPLOY_URL` environment variable Netlify injects.

---

### Supabase Migration Testing in CI
**Effort: M | Impact: Medium**

Before pushing migrations to production, spin up a local Supabase instance in CI (`supabase start`) and run migrations against it to catch syntax errors before they hit production. The `deploy-supabase.yml` workflow would benefit from a `test-migration` step.

---

### Dependabot / Renovate Auto-Updates
**Effort: S | Impact: Low**

Add `.github/dependabot.yml` for npm and GitHub Actions. 40+ Radix packages + 15+ OpenTelemetry packages = significant drift risk over time.

---

## 6. Performance

### Bundle Size — 40+ Radix Packages
**Effort: M | Impact: High**

The `package.json` lists every Radix UI component individually. Many may be unused. Steps:

1. **Audit:** Run `npx vite-bundle-visualizer` to see what's actually in the bundle
2. **Tree shake:** Ensure Vite's `build.rollupOptions.treeshake` is aggressive
3. **Replace unused Radix:** `@radix-ui/react-menubar`, `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-collapsible` — audit if actually used
4. **Lazy load heavy deps:** `jspdf`, `framer-motion`, and `groq-sdk` should be code-split with `React.lazy()`

Target: Under 500KB initial JS bundle. Current estimate without audit: likely 800KB+.

---

### Image Optimization
**Effort: S | Impact: High**

Generated story images (via Runware) are stored and served — confirm:
- Images are WebP format (not PNG/JPEG — WebP is 30-40% smaller)
- Supabase Storage has CDN caching enabled
- React rendering uses `loading="lazy"` on gallery images
- Add `srcSet` with multiple resolutions for responsive display

Add `vite-plugin-imagemin` for any local static assets.

---

### Lazy Loading & Code Splitting
**Effort: M | Impact: High**

The admin dashboard, story wizard, and SEO landing pages should be separate chunks. React Router lazy loading:
```tsx
const AdminDashboard = React.lazy(() => import('./modules/admin'));
const StoryWizard = React.lazy(() => import('./modules/story'));
```

Target: First Contentful Paint under 1.5s on mobile 4G.

---

### React Query Cache Tuning
**Effort: S | Impact: Medium**

Ensure `staleTime` and `gcTime` are configured appropriately:
- Story gallery: `staleTime: 5 * 60 * 1000` (5 min — doesn't change often)
- User credits: `staleTime: 0` (always fresh — financial data)
- Era prompt lists: `staleTime: 24 * 60 * 60 * 1000` (24h — static content)

---

### OpenTelemetry Pruning
**Effort: S | Impact: Medium**

OpenTelemetry dependencies are ~15 packages including `exporter-otlp-http` (legacy), `exporter-logs-otlp-http`, `exporter-trace-otlp-http`. Consolidate to the minimal set needed. Each OTLP package adds ~50-80KB. If not actively using distributed tracing, remove entirely and keep only Sentry for error tracking.

---

## 7. Security

### 🏆 #2 — Move GROQ/OpenAI Keys from VITE_ to Edge Functions
**Effort: M | Impact: Very High**

`src/modules/shared/utils/env.ts` has `getGroqApiKey()` and `getOpenAIApiKey()` that read from `VITE_GROQ_API_KEY` and `VITE_OPENAI_API_KEY`. Any `VITE_` variable is embedded in the client-side JavaScript bundle and visible to anyone who opens DevTools. These are live API keys that cost money per call.

**Fix:**
1. Remove `VITE_GROQ_API_KEY` and `VITE_OPENAI_API_KEY` from `.env` and Netlify env vars
2. All AI calls must go through Supabase Edge Functions (already partially done — `groq-api/` and `groq-storyline/` exist)
3. Remove `getGroqApiKey()` / `getOpenAIApiKey()` utility functions entirely
4. Ensure `env.ts` only exports public-safe keys (Supabase URL, Stripe publishable key, PostHog public key)

**Note:** `VITE_CLERK_PUBLISHABLE_KEY` still exists in `vite-env.d.ts` — remove since Clerk was migrated away from.

---

### 🏆 #10 — RLS Policy Audit
**Effort: M | Impact: Very High**

Row-Level Security is the last line of defense for multi-tenant data. With an auth migration from Clerk to Supabase, RLS policies that referenced Clerk JWTs may be broken or permissive.

**Audit checklist:**
- [ ] `stories` table: can user A read user B's private stories?
- [ ] `credits` table: can users modify their own credit balance directly?
- [ ] `user_profiles` table: are admin fields (e.g. `is_admin`) writable by users?
- [ ] `orders` / `stripe_events`: are webhook-written rows read-only for users?
- [ ] Test with a second test account attempting cross-account data reads

Use Supabase's built-in "RLS Advisor" in the dashboard or `supabase db lint`.

---

### Rate Limiting Gaps
**Effort: M | Impact: High**

`_shared/rateLimiter.ts` and `_shared/rateLimitStorage.ts` exist. Confirm they are applied to:
- `groq-storyline` — LLM calls are expensive; abuse = large bills
- `runware-proxy` — image generation = $0.01-0.10 per image
- `ebook-generation` — CPU intensive
- `create-checkout` — prevent checkout spam

Rate limit by both user ID (authenticated) and IP (unauthenticated/pre-auth). Current implementation should be audited for bypass vectors (e.g., rotating JWTs).

---

### Auth Hardening Post-Clerk Migration
**Effort: S | Impact: High**

Post-migration checklist:
- [ ] Remove all `VITE_CLERK_PUBLISHABLE_KEY` references from `vite-env.d.ts` and `.env.example`
- [ ] Confirm `supabase/functions/*/index.ts` all verify Supabase JWTs (not Clerk JWTs)
- [ ] Add auth token refresh handling in `src/core/integrations/supabase/auth.ts`
- [ ] Ensure session expiry is handled gracefully (redirect to login, not white screen)
- [ ] Add PKCE flow for OAuth (Supabase supports it natively)

---

### Content Security Policy
**Effort: S | Impact: Medium**

Add CSP headers via `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; img-src 'self' data: blob: https://*.supabase.co https://runware.ai; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com; script-src 'self' 'unsafe-inline'"
```

---

## 8. Monetization

### 🏆 #3 — Subscription Tiers
**Effort: M | Impact: Very High**

Credits-only is leaving money on the table. Recurring revenue is more valuable than one-time purchases. Proposed tiers:

| Tier | Price | Credits/mo | Perks |
|------|-------|-----------|-------|
| **Free** | $0 | 2 | 1 era, no audio |
| **Swiftie** | $7.99/mo | 15 | All eras, standard quality |
| **Superfan** | $14.99/mo | 40 | + Audio narration, HD images |
| **Collector** | $29.99/mo | 100 | + Physical book discount, early access |

Implementation: `check-subscription/` edge function already exists. Wire it to Stripe subscription products, gate features via `featureFlags.ts` (already has feature flag infrastructure).

---

### Gifting System
**Effort: M | Impact: High**

`GiftCard.tsx` exists. Complete the flow:
1. Purchaser selects credit amount ($10/$25/$50) + optional era dedication
2. Stripe checkout creates a gift code in database
3. Email sent to recipient (via Brevo/Resend) with redemption link
4. Recipient redeems → credits added to account

Taylor Swift fandom = gifting culture. "Give your friend a Reputation story" is natural for birthdays, tours, and holidays.

---

### Affiliate System
**Effort: M | Impact: Medium**

`src/modules/affiliates/` has tests — confirm the data model exists. Standard influencer affiliate program:
- Unique referral codes for Taylor Swift fan accounts (TikTok/Instagram/X)
- 20-30% commission on first purchase from referred users
- Dashboard to track clicks, conversions, earnings
- Payout via Stripe Connect or manual invoice

Target affiliates: Taylor Nation fan accounts (100K+ followers), Swiftie Substacks, era-specific fan clubs.

---

### Annual Discount
**Effort: S | Impact: Medium**

Add annual billing option at 20% discount. Simple Stripe Products addition. Users who pay annually have dramatically higher LTV and lower churn.

---

### Credit Gifting Between Users
**Effort: S | Impact: Medium**

Let users send credits to friends directly (e.g., "gifting" 5 credits to a friend's account). Builds community, reduces credit hoarding friction, and creates word-of-mouth.

---

### Marketplace Revenue Share
**Effort: XL | Impact: Low (now), High (at scale)**

`Marketplace.tsx` is aspirational. At current scale, defer. Revisit when you have >500 active creators.

---

## 9. SEO / Growth

### 🏆 #8 — Dynamic XML Sitemap + Schema.org
**Effort: S | Impact: High**

Currently there's no dynamic sitemap (only static pages are indexed). Fix:

1. **Dynamic sitemap** — Netlify Edge Function that queries Supabase for all public stories and era landing pages, returns `sitemap.xml`
2. **Schema.org markup:**
   - `Book` schema on each generated story/ebook
   - `Organization` on homepage
   - `BreadcrumbList` on era landing pages
3. **Submit to Google Search Console** and monitor impressions for Taylor Swift era terms

---

### Dynamic OG Tags for Story Sharing
**Effort: M | Impact: Very High (viral coefficient)**

Each generated story should have a unique OG image when shared on Twitter/TikTok/Discord:
- `og:title` → "My 1989 Era Story: 'The Last Great American Dynasty'"
- `og:image` → First illustration from the story (era-styled)
- `og:description` → First 150 chars of chapter 1

Use Netlify Edge Functions to server-render meta tags per story URL. This is the #1 driver of organic sharing.

---

### Taylor Swift Long-Tail SEO
**Effort: M | Impact: High**

10 landing pages already exist. Expand with:
- `/eras/[era-name]` — one per era with deep lore content
- `/prompts/[prompt-slug]` — each story prompt as a landable page
- `/blog/` — "Best Taylor Swift Reputation Era Moments," "Folklore Easter Eggs," etc.
- Target keywords: "taylor swift era generator," "swiftie story creator," "write my taylor swift era story"

Use Netlify's `_redirects` for clean URLs. Partner with Swiftie fan wikis for backlinks.

---

### Viral Loop: Share-to-Unlock
**Effort: M | Impact: High**

After creating a story, show: "Share your story to unlock 2 bonus credits." User posts to social → earns credits → more stories → more sharing. Verify share via TikTok/Twitter webhook or honor-system (with abuse controls).

---

### Email Capture on Landing Pages
**Effort: S | Impact: High**

The 10 SEO landing pages likely have no email capture. Add a "Get notified when [Era] is fully unlocked" waitlist form connected to Brevo/Resend. Captures intent from visitors who don't convert immediately.

---

### Era Launch Events / PR Moments
**Effort: S | Impact: Medium**

Taylor Swift is a cultural calendar. Plan content around:
- Tour announcements
- Album anniversaries (1989's 10th anniversary, etc.)
- "The Tortured Poets Department" release dates
- Taylor-related award shows

Each is a trigger for a promotional email blast + social push.

---

## Summary Matrix

| Category | Items | Quick Wins | Big Bets |
|----------|-------|-----------|---------|
| New Features | 6 | Era prompts, Dark mode | TTS narration, Print-on-demand |
| Code Quality | 5 | creator/ dedup, Supabase client consolidation | Hook decomposition |
| Testing | 8 | Wire Playwright to CI | Full story gen E2E |
| Integrations | 5 | PostHog funnels | Printful, TikTok API |
| Workflows | 4 | Pre-commit hooks | Netlify deploy preview E2E |
| Performance | 5 | Lazy loading, Image WebP | Bundle audit |
| Security | 5 | VITE_ key removal, Clerk cleanup | RLS audit |
| Monetization | 6 | Annual billing, Credit gifting | Subscription tiers, Gifting |
| SEO/Growth | 6 | Dynamic sitemap, Email capture | OG tags, Viral loop |

---

## Recommended Sprint Order

### Sprint 1 — Foundation (2 weeks)
- [ ] #1 Complete 5 missing era prompt files
- [ ] #2 Remove GROQ/OpenAI from VITE_ env vars
- [ ] #7 Delete creator/ module duplicate
- [ ] #6 Wire Playwright to CI
- [ ] Pre-commit hooks (Husky + lint-staged)

### Sprint 2 — Revenue (2 weeks)
- [ ] #3 Subscription tiers (Stripe + feature flags)
- [ ] #4 Wire gallery + sharing to real data
- [ ] Dynamic OG tags for story URLs
- [ ] Dynamic XML sitemap

### Sprint 3 — Growth & Delight (2 weeks)
- [ ] #9 Voice narration via Fish Audio
- [ ] #5 Print-on-demand (Printful integration)
- [ ] #10 RLS policy audit
- [ ] Dark mode
- [ ] Gifting system completion

### Sprint 4 — Scale (2 weeks)
- [ ] Bundle size optimization
- [ ] Affiliate system
- [ ] TikTok sharing API completion
- [ ] Long-tail SEO landing pages + blog
- [ ] Annual billing option

---

*This brainstorm was generated from a full analysis of the FlipMyEra codebase, including src/ module structure, supabase/functions/, GitHub Actions workflows, and package.json dependencies. Effort estimates: S=1-2 days, M=3-5 days, L=1-2 weeks, XL=2+ weeks.*

---

## 🔄 Updated Analysis — 2026-02-27

> Second-pass deep dive. Codebase-verified findings. Existing content above preserved intact.

---

### 🔐 CRITICAL: Security — VITE_ API Key Exposure (Confirmed)

**Status: Partially mitigated but NOT fixed. Keys still leak in dev builds + bundle strings.**

The `env.ts` file has a `PROD` guard that returns `undefined` in production, which is well-intentioned — but **the key strings themselves are still baked into the Vite bundle** during the build process. Vite performs static replacement at build time, meaning even dead branches can leave key fragments in source maps or minified output. Additionally:

- `VITE_GROQ_API_KEY` and `VITE_OPENAI_API_KEY` are still referenced in `vite-env.d.ts` and `src/test/setup.ts`, signaling they're live in the Netlify environment
- The Netlify deploy log will include env var names (not values), but any leaked build artifacts expose the full strings
- Dev team members running `npm run dev` locally are running with real keys pointed at production services

**Immediate fix (2–3 hours):**
1. Remove `VITE_GROQ_API_KEY` and `VITE_OPENAI_API_KEY` from Netlify env vars entirely
2. Delete `getGroqApiKey()` and `getOpenAiApiKey()` from `env.ts` (they're already `@deprecated` — finish the job)
3. Add an `EnvironmentValidator` check that **warns** (not errors) if these vars are detected in dev
4. Add a CI step: `grep -r "VITE_GROQ\|VITE_OPENAI" src/ && exit 1` to catch regressions
5. Similarly: `VITE_RUNWARE_API_KEY` in `src/modules/shared/utils/runware.ts` — **Runware charges per image**, this key must also move to edge functions

**Also discovered:** `VITE_CLERK_PUBLISHABLE_KEY` still exists in type definitions despite the Clerk → Supabase migration. Dead reference should be cleaned up.

---

### 🎙️ Voice Narration — Migrate TTS from ElevenLabs to Fish Audio

**Status: TTS edge function exists but hard-coded to ElevenLabs (expensive). Fish Audio API key is available.**

The `text-to-speech` edge function currently calls `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL` with a `ELEVEN_LABS_API_KEY` secret. Fish Audio is **6.5× cheaper** ($0.015/min vs ~$0.10/min for ElevenLabs) and the workspace API key is already available (`3b27c316ae734415b81e72db715cce61`).

**Migration path for `supabase/functions/text-to-speech/index.ts`:**

```typescript
// Replace ElevenLabs block with:
const FISH_AUDIO_KEY = Deno.env.get('FISH_AUDIO_API_KEY');
const VOICE_ID = 'b545c585f631496c914815291da4e893'; // "Friendly Women" — warm female, fits Swiftie tone

const fishResponse = await fetch('https://api.fish.audio/v1/tts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FISH_AUDIO_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: trimmedText,
    reference_id: VOICE_ID,
    format: 'mp3',
  }),
});

const audioBuffer = await fishResponse.arrayBuffer();
// Return as base64 or stream to Supabase Storage
```

**Supabase secret to add:** `FISH_AUDIO_API_KEY = 3b27c316ae734415b81e72db715cce61`

**Voice options (pre-vetted):**
| Voice ID | Character | Best For |
|----------|-----------|----------|
| `b545c585f631496c914815291da4e893` | "Friendly Women" — warm female | Default Swiftie narrator |
| `c2623f0c075b4492ac367989aee1576f` | "Paula" — professional female | Reputation/Folklore dark eras |
| `728f6ff2240d49308e8137ffe66008e2` | "Adam" — professional male | Contrast narration |

**Monetization hook:** Gate TTS narration behind Superfan tier ($14.99/mo). Show a 15-second preview clip for Free/Swiftie users with a lock icon. "Hear your story come to life" as CTA.

**Frontend integration:**
- Add `<AudioPlayer>` component to story viewer (native `<audio>` element — no Howler.js needed for MVP)
- Cache MP3 in Supabase Storage under `audio/{story_id}/{chapter_index}.mp3`
- Check cache before calling TTS edge function (stories don't change after generation)
- Show waveform animation (CSS-only, no library needed) while playing

**Estimated cost per full story (5 chapters × ~500 words each):** ~$0.04 at Fish Audio rates. At $14.99/mo subscription, even heavy users (20 stories/mo) cost $0.80 in TTS — excellent margin.

---

### 📱 TikTok Sharing — Complete the Loop

**Status: Analytics edge function exists. Actual video posting is NOT implemented.**

The `tiktok-share-analytics` edge function only **logs share events to Supabase** — it does not post to TikTok. The `tiktok-auth` function handles OAuth. The gap is video creation + posting.

**What exists:**
- `tiktok-auth/` — TikTok OAuth flow (authorization code → access token)
- `tiktok-share-analytics/` — Records `{ text, videoUrl, musicUrl }` to database

**What's missing:**
- Video asset creation (slideshow of story images + audio)
- TikTok Content Posting API call (`POST /v2/post/publish/video/init`)
- Frontend "Post to TikTok" button wired to this flow

**Recommended implementation (phased):**

**Phase 1 — Download Package (1 week):**
Skip TikTok API entirely. Generate a ZIP containing:
- 5 story illustration PNGs
- `caption.txt` with era-styled copy + hashtags
- `audio.mp3` if TTS is enabled
- A `README.txt` with posting instructions

Users manually upload to TikTok. This ships fast, no API review needed.

**Phase 2 — TikTok Creator API (2-3 weeks, pending API approval):**
TikTok's Content Posting API requires app review (1-4 weeks). Start the application immediately:
1. Create TikTok developer account + app at `developers.tiktok.com`
2. Request `video.upload` and `video.publish` scopes
3. Implement `supabase/functions/tiktok-post/index.ts`:
```typescript
// Use existing tiktok-auth tokens
// POST story slideshow video to TikTok via chunked upload
// Auto-caption with era hashtags: #swiftie #[era]era #taylorswift
```

**Hashtag strategy for each era:**
| Era | Hashtags |
|-----|---------|
| 1989 | `#1989Era #ShakeItOff #OutOfTheWoods` |
| Reputation | `#ReputationEra #LookWhatYouMadeMe #Snakegate` |
| Folklore | `#FolkloreEra #August #CardIganGate` |
| Lover | `#LoverEra #MeExclamationPoint #YouNeedToCalmDown` |

**Viral mechanic:** "My [ERA] era story" format is pre-optimized for TikTok's For You Page. Taylor Swift content reliably hits 100K+ views from cold accounts.

---

### 📦 Performance — Bundle Size Audit (27 Radix + 13 OTel Packages)

**Confirmed package counts: 27 Radix UI packages, 13 OpenTelemetry packages.**

**Step 1 — Run the audit (30 minutes):**
```bash
npm run build
npx vite-bundle-visualizer
# OR
npx source-map-explorer dist/assets/*.js
```

**Radix packages to audit for actual usage:**

Run this to find unused Radix imports:
```bash
for pkg in accordion alert-dialog aspect-ratio avatar checkbox collapsible context-menu dialog dropdown-menu hover-card label menubar navigation-menu popover progress radio-group scroll-area select separator slider switch tabs toast toggle toggle-group toolbar tooltip; do
  echo "=== $pkg ==="; grep -r "react-$pkg\|RadixUI" src/ --include="*.tsx" --include="*.ts" -l | wc -l
done
```

**High-probability dead weight (verify with grep):**
- `@radix-ui/react-context-menu` — right-click menus, unlikely in a mobile-first story app
- `@radix-ui/react-menubar` — desktop-style menu bars, probably 0 usages
- `@radix-ui/react-hover-card` — desktop hover interactions, poor mobile UX
- `@radix-ui/react-collapsible` — accordion does the same job
- `@radix-ui/react-aspect-ratio` — a 10-line CSS util that doesn't need a package

**Estimated bundle savings from removing unused Radix:** 40–120KB gzipped.

**OpenTelemetry — Nuclear option if not actively using:**
```bash
# Check if OTel is actually sending telemetry anywhere
grep -r "opentelemetry\|OTel\|tracer\|meter" src/ --include="*.ts" --include="*.tsx" | grep -v "import\|node_modules" | head -20
```

If OTel isn't wired to a backend (Honeycomb, Jaeger, etc.), **remove all 13 packages**:
```bash
npm uninstall @opentelemetry/api @opentelemetry/exporter-logs-otlp-http @opentelemetry/exporter-otlp-http @opentelemetry/exporter-trace-otlp-http @opentelemetry/instrumentation @opentelemetry/instrumentation-document-load @opentelemetry/instrumentation-fetch @opentelemetry/instrumentation-user-interaction @opentelemetry/instrumentation-xml-http-request @opentelemetry/resources @opentelemetry/sdk-trace-base @opentelemetry/sdk-trace-web @opentelemetry/semantic-conventions
```

**Estimated bundle savings from OTel removal: 150–250KB gzipped.** This is the single highest-ROI bundle optimization available.

**Other large packages to lazy-load:**
| Package | Size (est.) | Action |
|---------|-------------|--------|
| `jspdf` | ~300KB | `React.lazy()` — only on ebook download |
| `framer-motion` | ~150KB | Defer or replace with CSS animations |
| `groq-sdk` | ~50KB | Should be edge-only, not in client bundle |
| `@sentry/react` | ~80KB | Keep — worth it for error tracking |

**Target:** Under 400KB initial JS (gzipped). Current estimate: **800KB–1.1MB** based on package inventory.

**Add bundle size CI gate:**
```yaml
# In ci.yml
- name: Bundle size check
  run: |
    npm run build
    BUNDLE_SIZE=$(du -sk dist/assets/*.js | awk '{sum+=$1} END {print sum}')
    echo "Bundle size: ${BUNDLE_SIZE}KB"
    if [ $BUNDLE_SIZE -gt 2000 ]; then echo "❌ Bundle too large"; exit 1; fi
```

---

### 💰 Monetization — New Revenue Angles

#### Print-on-Demand (Printful Integration)
**Effort: M | ROI: High**

`src/modules/gifting/` and `src/modules/marketplace/` stubs exist but no Printful/Printify edge function exists yet.

**Implementation:**
1. Add `supabase/functions/printful-order/index.ts`
2. After ebook PDF is generated (via `ebook-generation` edge function), expose "Print My Book" CTA
3. Collect shipping address via a modal form
4. POST to Printful API: `POST https://api.printful.com/orders` with variant ID for softcover + PDF URL from Supabase Storage

**Pricing strategy:**
| Product | Retail Price | Printful Cost | Margin |
|---------|-------------|--------------|--------|
| Softcover (5×8") | $22.99 | ~$12 | ~$11 |
| Hardcover (6×9") | $32.99 | ~$18 | ~$15 |
| Spiral-bound + foil cover | $27.99 | ~$14 | ~$14 |

**Era-specific cover art** is already being generated by Runware — bundle it as the book cover automatically.

**Gating:** Print option available for all tiers (it's a one-time purchase). No subscription required. This keeps the conversion simple.

#### Gift Cards
**Effort: S | ROI: Medium-High**

`src/modules/gifting/GiftCard.tsx` exists. The Stripe Products layer is the only missing piece.

**Create in Stripe Dashboard:**
- Gift Card $10 (300 credits)
- Gift Card $25 (750 credits + 10% bonus)
- Gift Card $50 (1500 credits + 20% bonus)

**Occasion-based copy for each:**
- "For the Swiftie in your life 🎁"
- "Happy Birthday to an Era-obsessed friend 🎂"
- "Tour gift — create your concert story! 🎤"

**Email delivery:** Use the existing `brevo-email` edge function. Redemption page: `/redeem?code=XXXX-XXXX-XXXX`.

**Seasonal spikes to plan for:** Taylor's birthday (Dec 13), tour dates, album anniversaries, holidays.

#### Affiliate Program
**Effort: M | ROI: High (at scale)**

`src/modules/affiliates/` has tests — the data model likely exists. Missing: payout dashboard + recruitement flow.

**Commission structure:**
- **Fan Account tier** (1K–10K followers): 20% on first purchase, lifetime cookie 30 days
- **Creator tier** (10K–100K followers): 25% + co-branded landing page (`/[creator-name]`)
- **Mega tier** (100K+): Custom deal — rev share + free Collector subscription

**Targeting strategy:** Search TikTok for `#swiftie` creators posting era content. DM with affiliate pitch. Target 50 micro-affiliates before 1 macro.

**Tracking:** Use PostHog `distinctId` chained from referral code → signup → purchase. `ref_code` query param → stored in `localStorage` → attached to Stripe metadata.

**Payout:** Manual Stripe payouts or Stripe Connect. At early scale, PayPal invoices to top 10 affiliates monthly is fine.

---

### 🧪 Testing Gaps — Critical Paths at 16% Coverage

**With 46 test files but ~16% coverage, here's what's definitely untested based on codebase analysis:**

#### Untested Critical Path #1 — Full Story Generation Pipeline
```
User fills wizard → selects era → selects prompt → 
groq-storyline edge fn streams → chapters rendered → 
runware-proxy generates images → credit deducted
```
**Risk level: 🔴 CRITICAL.** This is the entire product value. A silent regression here means zero stories generated = zero revenue.

**What to add:**
```typescript
// src/modules/story/__tests__/generation-pipeline.test.ts
// Mock groq-storyline edge function with MSW
// Assert: chapters render, images load, credits deducted
// Assert: error states (Groq timeout, Runware failure) handled gracefully
```

#### Untested Critical Path #2 — Credit Purchase → Grant Flow
```
User clicks "Buy Credits" → Stripe checkout → 
stripe-webhook fires → credits added to DB → 
UI reflects new balance
```
**Risk level: 🔴 CRITICAL.** Missed webhook = user paid but got no credits = chargeback + angry user.

**What to add:**
```typescript
// supabase/functions/stripe-webhook/__tests__/credit-grant.test.ts (Deno)
// Test payment_intent.succeeded → credits row inserted
// Test idempotency key prevents double-grant on webhook retry
```

#### Untested Critical Path #3 — Auth Flow (Post-Clerk Migration)
`auth-flow.spec.ts` exists in Playwright — **verify it actually runs** (it may be in the spec files but excluded from CI). Priority assertions:
- [ ] Sign up → email verification → first story created
- [ ] Login → session persists across page refresh
- [ ] Token expiry → graceful redirect to login (not white screen)
- [ ] Logout → all cached data cleared

#### Untested Critical Path #4 — Sharing Module
`sharing/__tests__/` is empty per earlier analysis. Zero tests on:
- Story URL generation (`/story/:shareId`)
- OG tag meta content
- Share button click tracking (PostHog event)
- Copy-to-clipboard functionality

#### Untested Critical Path #5 — RLS Enforcement
**Security testing, not just coverage testing:**
```typescript
// supabase/functions/_tests__/rls-enforcement.test.ts
// Sign in as User A, attempt to read User B's private stories
// Assert: 0 rows returned (not 403 — RLS returns empty, not error)
// Attempt to directly UPDATE credits table
// Assert: blocked by RLS
```

#### Quick Coverage Wins (Lowest Effort, Highest Coverage Gain)

| File | Test Type | Estimated coverage gain |
|------|-----------|------------------------|
| `modules/gifting/GiftCard.tsx` | Unit | +0.5% |
| `modules/affiliates/*.ts` | Unit | +1% |
| `supabase/functions/text-to-speech/` | Deno unit | +0.5% |
| `supabase/functions/runware-proxy/` | Deno unit | +0.5% |
| `modules/sharing/ShareButtons.tsx` | Unit | +0.5% |
| `modules/sharing/ShareablePreview.tsx` | Unit | +0.5% |
| `supabase/functions/stripe-webhook/` (credit grant) | Deno unit | +1% |
| Full checkout E2E | Playwright | +2% |
| Full story generation E2E | Playwright | +3% |

**Realistic path to 40% coverage:** Add Deno unit tests for all 8 edge functions + MSW mocks for the story generation pipeline. Budget: ~5 dev-days.

**Add coverage thresholds to `vitest.config.ts`** to prevent regression:
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 20,      // Start here, ratchet up 5% per sprint
    functions: 25,
    branches: 15,
  }
}
```

---

### 🔄 Revised Sprint Priorities (Post-Audit)

Based on confirmed codebase findings, these items move up in priority:

| Priority | Item | Why It Moved |
|----------|------|-------------|
| 🔴 P0 | Remove `VITE_RUNWARE_API_KEY` from client | Image gen key = direct cost exposure |
| 🔴 P0 | Add stripe-webhook idempotency test | Credit double-grant risk |
| 🟠 P1 | Migrate TTS to Fish Audio | ElevenLabs ~6.5× more expensive |
| 🟠 P1 | OTel full removal (if unused) | 150–250KB bundle savings |
| 🟡 P2 | TikTok download package (Phase 1) | Ships fast, no API review wait |
| 🟡 P2 | Print-on-demand Printful edge fn | High LTV, no subscription required |
| 🟢 P3 | Affiliate recruitment (50 micro-influencers) | Growth lever, works with existing module |
| 🟢 P3 | Gift card Stripe Products setup | 1-day task, holiday revenue |

---

*Updated analysis generated 2026-02-27 from live codebase inspection of `src/`, `supabase/functions/`, `package.json`, `vitest.config.ts`, and edge function source files.*
