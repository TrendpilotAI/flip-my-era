# FlipMyEra — Engineering & Growth Brainstorm
> Generated: 2026-03-06 | Judge Agent v2 (compound-engineering) | Refreshed

---

## 🚨 P0 — IMMEDIATE ACTIONS

### 1. Subscription Upsell Flow Missing
The pricing strategy (Free → $12.99 → $25 → $49.99) is documented but NOT implemented as an in-app upgrade path. Users on free credits hit a wall with no smooth conversion. This is a direct revenue blocker.

**Fix:** Add credit exhaustion modal → pricing page CTA → Stripe checkout for subscription tiers.

### 2. Gallery/Sharing Not Wired to Real Data
The gallery/sharing UI exists but pulls from mock/static data instead of real Supabase records. Users can't browse their own ebook history or share to social.

**Fix:** Wire `ebooks` table to gallery component; add Supabase query for user's story history.

---

## 1. 💰 NEW FEATURES (Revenue Impact)

### HIGH PRIORITY
| Feature | Revenue Impact | Effort | Notes |
|---|---|---|---|
| Subscription upsell flow | 🔴 Critical | Medium | Stripe subscription creation on upgrade |
| Social sharing (TikTok/Instagram) | High | Medium | Shareable ebook preview cards |
| User ebook history/gallery | High | Low | Wire to Supabase data |
| Era prompt completion (all 13 eras) | Medium | Low | Incomplete era templates |
| Gift credits system | Medium | Medium | Viral gifting mechanic |
| Referral program | Medium | High | Friend invites = bonus credits |

### MEDIUM PRIORITY
| Feature | Revenue Impact | Effort |
|---|---|---|
| ePub download (not just PDF) | Medium | Medium |
| Animated page turns for TikTok | High | High |
| Batch generation (multiple eras at once) | Low | Medium |
| Community story feed (opt-in) | Medium | High |

---

## 2. 🔧 CODE QUALITY

### Dead Code / Cleanup
- **25 `console.log` statements** throughout production code — strip before deploy
- `image-manager.html`, `image-manager-pro.html`, `image-manager-ultimate.html`, `debug-image-viewer.html`, `debug-ultimate.html` — debug HTML files at repo root, should be removed
- `test-auth.html`, `test-image-load.html` — test files at repo root
- `e2e-test.mjs`, `e2e-test-v2.mjs`, `e2e-test-v3.mjs` — multiple test script versions; consolidate

### DRY Violations
- Error handling patterns repeated across API calls — extract to `useApiCall` hook
- Loading state UI duplicated in 5+ components — centralize with `<AsyncWrapper>`
- Supabase query patterns copy-pasted — create typed repository layer

### Type Safety
- Multiple `as unknown as X` casts in env.ts and API layer — tighten with proper generics
- Missing return type annotations on ~40% of exported functions

---

## 3. 🧪 TESTING

### Missing Coverage
| Gap | Priority | Effort |
|---|---|---|
| E2E tests NOT in CI pipeline | High | Low (config only) |
| Supabase Edge Function unit tests | High | Medium |
| Stripe webhook handler tests | High | Medium |
| Credit deduction idempotency tests | High | Low |
| Story streaming error recovery tests | Medium | Medium |
| Payment failure flow E2E | High | Medium |

### Quick Wins
- Add `playwright` to CI GitHub Actions workflow (already configured locally)
- Add `vitest --coverage` threshold enforcement (currently runs but no threshold gate)

---

## 4. 🔗 INTEGRATIONS

### High Value
| Integration | Value | Effort |
|---|---|---|
| Email (Resend/SendGrid) — welcome + story ready | High | Low |
| PostHog / Mixpanel — user behavior analytics | High | Low |
| TikTok share API — native sharing | Very High | Medium |
| Instagram share API | High | Medium |
| Discord community (Swiftie server) | Medium | Low |

### Already Integrated (Health Check)
- ✅ Stripe (payments)
- ✅ Supabase (auth + db)
- ✅ Groq (story generation via edge functions)
- ✅ Runware (image generation via proxy)
- ✅ OpenTelemetry / Sentry (observability)
- ✅ Netlify (deployment)

---

## 5. ⚙️ WORKFLOWS

### CI/CD Improvements
- Add E2E (Playwright) to GitHub Actions — currently only unit tests run in CI
- Add `pnpm audit` to CI — catch dependency vulnerabilities automatically  
- Add Lighthouse CI score gating (lighthouserc.js exists but not in CI)
- Pre-commit hook: `eslint --fix` + `tsc --noEmit` (currently manual)
- Automated Netlify preview URLs for PRs

### Deployment
- Environment variable validation on startup (fail fast vs. silent undefined)
- Supabase migration versioning with automatic rollback on deploy failure

---

## 6. ⚡ PERFORMANCE

### Bundle Size
- **4 pages eagerly loaded** — convert to `React.lazy()` + `Suspense`
- Review heavy deps: `@opentelemetry/*` (14 packages) — consider lighter alternative
- Tree-shake Radix UI: import only used primitives

### Runtime
- Image lazy loading on gallery pages
- Story streaming buffer optimization — reduce TTFB
- Supabase query optimization — add indexes on `user_id`, `created_at` for ebooks table

### Caching
- Cache generated story assets in Supabase Storage (currently regenerated on re-view)
- Add `stale-while-revalidate` headers for static assets on Netlify

---

## 7. 🔒 SECURITY (Remaining)

### Current Status
- ✅ VITE_SENTRY_AUTH_TOKEN fixed (commit 5074c28)
- ✅ Groq/OpenAI keys moved to edge functions
- ✅ Credits deducted server-side with idempotency
- ⚠️ CORS: verify edge functions restrict origins to production domain only
- ⚠️ Rate limiting: no per-user rate limit on story generation (cost risk)
- ⚠️ Input validation: story submission inputs should be sanitized server-side

### Add Rate Limiting
Implement per-user daily generation limits at the edge function level to prevent abuse and runaway costs. Even paid users should have reasonable limits (e.g., 50/day).

---

## Prioritized Recommendations Summary

| # | Item | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | Subscription upsell flow | Revenue | Medium | P0 |
| 2 | Wire gallery to real data | UX/Retention | Low | P0 |
| 3 | E2E tests in CI | Quality | Low | P1 |
| 4 | Social sharing (TikTok/IG) | Growth | Medium | P1 |
| 5 | Email notifications | Retention | Low | P1 |
| 6 | Rate limiting on edge functions | Security/Cost | Low | P1 |
| 7 | Remove debug HTML files | Cleanliness | XS | P2 |
| 8 | Strip console.logs | Cleanliness | XS | P2 |
| 9 | Lazy-load 4 pages | Performance | Low | P2 |
| 10 | Complete all era prompts | Completeness | Low | P2 |
| 11 | PostHog analytics | Insight | Low | P2 |
| 12 | ePub download support | Features | Medium | P3 |
| 13 | Referral program | Growth | High | P3 |
| 14 | Community feed | Engagement | High | P4 |
