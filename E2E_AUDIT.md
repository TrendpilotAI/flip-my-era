# FlipMyEra — E2E UI/UX Audit Report

**Date:** 2026-02-17  
**Test Framework:** Playwright (Chromium headless)  
**Score: 25/38 tests passing (66%)**

---

## ✅ What's Working Well (25 passed)

### Navigation & Routing — 6/6 ✅
- All public routes (`/`, `/plans`, `/faq`, `/auth`) load without JS crashes
- 404 routes handled gracefully (SPA catch-all)
- Back button navigation works correctly
- No broken images on landing page
- No critical console errors on load
- Page title set correctly ("FlipMyEra")

### Performance — 4/5 ✅
- Landing page loads under 3s ✅
- No JS bundles over 2MB ✅
- All images under 5MB ✅
- CSS loaded before first paint (no FOUC) ✅
- ⚠️ Over 100 network requests on initial load (see below)

### UX Quality — 6/8 ✅
- Buttons have pointer cursor on hover ✅
- Color contrast on CTAs is sufficient ✅
- Keyboard navigation works (Tab focuses elements) ✅
- Forms have proper labels/placeholders ✅
- Loading states visible during transitions ✅
- FAQ items expandable ✅

### Auth Flow — 3/5 ✅
- Unauthenticated users redirected from `/dashboard` ✅
- Unauthenticated users redirected from `/stories` ✅
- Auth page accessible (reasonable alt text count) ✅

### Responsive — 2/2 ✅
- Landing page: no horizontal overflow on mobile ✅
- Plans page: no horizontal overflow on mobile ✅

---

## ❌ Issues Found (13 failures)

### 🔴 Critical: SEO & Accessibility

**1. No `<h1>` on landing page**  
The main hero heading uses `<h3>` instead of `<h1>`. This hurts SEO ranking and screen reader navigation.  
**File:** `src/modules/shared/components/HeroGallery.tsx` line 209  
**Fix:** Change `<h3>` to `<h1>` for the main heading.

**2. No `<h1>` means improper visual hierarchy**  
Page jumps from no h1 to h3, confusing screen readers and search engines.

### 🟡 Medium: Auth Page

**3. Auth page login form not detected**  
Clerk renders the login form in an iframe/shadow DOM, making it hard for Playwright to find standard form elements. This means automated testing of auth flows requires Clerk test mode.

**4. Google OAuth button not found**  
Same issue — Clerk's social login buttons render in their own container. Not a real bug, but limits automated testing.

### 🟡 Medium: Plans/Pricing Page

**5-9. New pricing tiers not rendering on `/plans`**  
The new PricingPage component was created but the `/plans` route may still render the old `PlanSelector` component. Tests couldn't find:
- "Debut" / "Speak Now" / "Midnights" tier names
- Monthly/annual toggle
- Credit pack options (Single/Album/Tour)
- Feature comparison checklist
- CTA buttons with expected text

**Action needed:** Verify `PlanSelector` renders the new `PricingPage` component. Check that the import was updated.

### 🟢 Low: Content

**10. Landing page body text doesn't contain era keywords**  
The test looked for "era|taylor|swift|folklore|midnights" in page text. Content may be in images/SVGs rather than text.

**11. FAQ page has minimal text content**  
The FAQ page renders less than 200 characters of body text, suggesting content is inside collapsed accordions that don't count as text content until expanded.

### 🔵 Info: Performance

**12. Over 100 network requests on landing page**  
The app makes 100+ requests on initial load (JS chunks, fonts, images, analytics). Consider:
- Lazy loading below-fold images
- Combining analytics scripts
- Preloading critical resources

---

## Recommendations (Priority Order)

1. **Fix h1 heading** — Change HeroGallery `<h3>` to `<h1>` (5 min, huge SEO impact)
2. **Verify pricing page route** — Ensure `/plans` renders new PricingPage with tier names
3. **Add Clerk test keys** — Configure Playwright with Clerk test instance for auth flow E2E
4. **Reduce network requests** — Audit and lazy-load non-critical resources
5. **Add structured data** — JSON-LD for the landing page (product schema)

---

## Test Files

```
e2e/
├── landing.spec.ts      — 5/7 passed (hero heading + nav detection failed)
├── auth.spec.ts         — 3/5 passed (Clerk iframe issues)
├── navigation.spec.ts   — 6/6 passed ✅
├── plans.spec.ts        — 1/6 passed (new pricing not rendering on route)
├── performance.spec.ts  — 4/5 passed (network request count)
└── ux-quality.spec.ts   — 6/9 passed (h1 hierarchy + FAQ content)
```
