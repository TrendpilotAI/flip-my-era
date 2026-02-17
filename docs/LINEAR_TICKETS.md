# Linear Tickets for FlipMyEra

**Generated:** $(date)  
**Project:** FlipMyEra  
**Status:** Ready for Import

---

## 🔴 P0 - Critical (Production Launch Blockers)

### P0-1: Configure Sentry DSN in Production
**Priority:** Critical  
**Status:** To Do  
**Labels:** production, monitoring, p0  
**Assignee:** TBD  
**Estimate:** 1h

**Description:**
Sentry package is installed but needs production DSN configuration. Error tracking infrastructure is ready but not activated.

**Tasks:**
- [ ] Add `VITE_SENTRY_DSN` environment variable in Netlify
- [ ] Set `VITE_APP_ENV=production` in Netlify (optional)
- [ ] Verify Sentry DSN from sentry.io dashboard
- [ ] Test error capture after deployment
- [ ] Verify breadcrumbs are working

**Acceptance Criteria:**
- Sentry captures errors in production/staging
- Performance monitoring active (10% sample rate)
- No console errors in production build

**Files:**
- `src/core/integrations/sentry.ts` ✅ (already implemented)
- `src/App.tsx` ✅ (already initialized)
- Netlify environment variables ⚠️ (needs configuration)

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P0: Finalize Production Monitoring)

---

### P0-2: Production Deployment Verification
**Priority:** Critical  
**Status:** To Do  
**Labels:** production, testing, p0  
**Assignee:** TBD  
**Estimate:** 4h

**Description:**
Complete end-to-end verification of all systems in production environment before launch.

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Create staging Netlify site
- [ ] Deploy Edge Functions to Supabase
- [ ] Configure staging environment variables
- [ ] Run full smoke test
- [ ] Complete user journey: Sign up → Select ERA → Generate story → Create e-book
- [ ] Verify credit system works
- [ ] Test payment flow (if Stripe integrated)
- [ ] Check streaming generation works
- [ ] Verify image generation
- [ ] Measure Core Web Vitals (LCP, FID, CLS)
- [ ] Check bundle sizes
- [ ] Verify code splitting works
- [ ] Test on mobile devices
- [ ] Test rate limiting (should return 429)
- [ ] Test timeout handling (should return 408)
- [ ] Test invalid input rejection
- [ ] Verify error boundaries catch failures

**Acceptance Criteria:**
- All critical flows work in production
- Performance metrics within targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Error handling works correctly
- No critical bugs discovered

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P0: Production Deployment Verification)

---

### P0-3: Fix Memory Leak in ClerkAuthContext
**Priority:** Critical  
**Status:** To Do  
**Labels:** bug, memory-leak, auth, p0  
**Assignee:** TBD  
**Estimate:** 2h

**Description:**
useEffect hook in ClerkAuthContext lacks cleanup function, causing potential memory leaks when component unmounts during async operations.

**Location:**
- `src/modules/auth/contexts/ClerkAuthContext.tsx` (line 132)

**Tasks:**
- [ ] Add cleanup function to useEffect hook
- [ ] Implement AbortController for async operations
- [ ] Test component unmounting during async operations
- [ ] Verify no memory leaks in production

**Acceptance Criteria:**
- All useEffect hooks have cleanup functions
- No memory leaks detected
- Async operations properly cancelled on unmount

**Related:**
- DOCS/QA_REPORT.md (Critical Issue #1)

---

### P0-4: Fix Race Condition in User Profile Sync
**Priority:** Critical  
**Status:** To Do  
**Labels:** bug, race-condition, auth, p0  
**Assignee:** TBD  
**Estimate:** 3h

**Description:**
Multiple async operations in ClerkAuthContext without proper cancellation, causing stale data updates and inconsistent state.

**Location:**
- `src/modules/auth/contexts/ClerkAuthContext.tsx` (lines 132-233)

**Tasks:**
- [ ] Implement proper cancellation for async operations
- [ ] Add request deduplication
- [ ] Ensure only latest request updates state
- [ ] Test rapid profile updates
- [ ] Verify no stale data updates

**Acceptance Criteria:**
- Only latest async operation updates state
- No race conditions in profile sync
- Consistent state across rapid updates

**Related:**
- DOCS/QA_REPORT.md (Critical Issue #2)

---

## 🟠 P1 - High Priority (Production Optimization)

### P1-1: Bundle Size Optimization
**Priority:** High  
**Status:** To Do  
**Labels:** performance, optimization, p1  
**Assignee:** TBD  
**Estimate:** 6h

**Description:**
Improve initial load time and reduce bandwidth by optimizing bundle size and implementing code splitting.

**Tasks:**
- [ ] Install bundle analyzer: `npm install --save-dev rollup-plugin-visualizer`
- [ ] Add to `vite.config.ts`
- [ ] Generate bundle report
- [ ] Identify large dependencies
- [ ] Lazy load `StoryWizard` component
- [ ] Lazy load `EbookGenerator` component
- [ ] Lazy load heavy image components
- [ ] Split vendor chunks more granularly
- [ ] Analyze large dependencies (Framer Motion, Chart libraries, etc.)
- [ ] Consider tree-shaking unused exports
- [ ] Replace heavy dependencies if alternatives exist
- [ ] Compress images in `public/images/`
- [ ] Optimize ERA images (use WebP/AVIF)
- [ ] Add image lazy loading
- [ ] Implement responsive images

**Acceptance Criteria:**
- Initial bundle size < 500KB gzipped
- All routes lazy-loaded
- Lighthouse performance score > 90

**Files to Modify:**
- `vite.config.ts` (bundle analyzer, lazy loading)
- `src/App.tsx` (lazy route imports)
- `src/pages/Index.tsx` (lazy StoryWizard)

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P1: Bundle Size Optimization)

---

### P1-2: Implement Server-Side Rate Limiting
**Priority:** High  
**Status:** To Do  
**Labels:** security, rate-limiting, p1  
**Assignee:** TBD  
**Estimate:** 4h

**Description:**
Add distributed rate limiting to Edge Functions to prevent API cost escalation and abuse.

**Current State:**
- Client-side rate limiting exists
- Server-side rate limiting missing
- TODO comment in `supabase/functions/groq-api/index.ts` (line 106)
- TODO comment in `supabase/functions/_shared/rateLimitStorage.ts` (line 26)

**Tasks:**
- [ ] Choose storage backend (Redis recommended, or Supabase database table with TTL)
- [ ] Update `supabase/functions/_shared/rateLimitStorage.ts`
- [ ] Add Redis client or database queries
- [ ] Handle connection failures gracefully
- [ ] Implement rate limiting middleware for Edge Functions
- [ ] Add rate limiting to `groq-api` function
- [ ] Add rate limiting to `groq-storyline` function
- [ ] Test under load with multiple concurrent requests
- [ ] Verify rate limits work across instances
- [ ] Verify cleanup of expired records

**Acceptance Criteria:**
- Rate limits enforced across all Edge Function instances
- No memory leaks
- Graceful degradation on storage failure
- Returns 429 status with Retry-After header

**Files:**
- `supabase/functions/groq-api/index.ts`
- `supabase/functions/groq-storyline/index.ts`
- `supabase/functions/_shared/rateLimitStorage.ts`

**Related:**
- PRODUCTION_READINESS_IMPROVEMENTS.md (Priority 1)
- NEXT_STEPS_BUILD_PLAN.md (P2: Distributed Rate Limiting)

---

### P1-3: Add Request Timeout Handling
**Priority:** High  
**Status:** To Do  
**Labels:** reliability, edge-functions, p1  
**Assignee:** TBD  
**Estimate:** 3h

**Description:**
Add explicit timeouts to Edge Functions to prevent long-running requests from consuming resources.

**Current State:**
- No explicit timeouts on Edge Functions
- Long-running requests can consume resources

**Tasks:**
- [ ] Add timeout middleware to Edge Functions
- [ ] Set reasonable timeouts (30s for Groq API calls)
- [ ] Return proper timeout error responses (408 status)
- [ ] Test timeout behavior
- [ ] Verify proper cleanup on timeout

**Acceptance Criteria:**
- All Edge Functions have timeout handling
- Timeout errors return 408 status
- Resources properly cleaned up on timeout

**Files:**
- `supabase/functions/groq-api/index.ts`
- `supabase/functions/groq-storyline/index.ts`
- `supabase/functions/stream-chapters/index.ts`

**Related:**
- PRODUCTION_READINESS_IMPROVEMENTS.md (Priority 2)

---

### P1-4: Performance Monitoring Activation
**Priority:** High  
**Status:** To Do  
**Labels:** monitoring, performance, p1  
**Assignee:** TBD  
**Estimate:** 3h

**Description:**
Activate performance monitoring to track real user performance metrics and Core Web Vitals.

**Tasks:**
- [ ] Verify `src/core/utils/performance.ts` is initialized
- [ ] Verify Core Web Vitals are being tracked
- [ ] Confirm metrics are sent to Sentry
- [ ] Set performance budgets in CI/CD
- [ ] Add performance regression alerts
- [ ] Create dashboard for monitoring
- [ ] Enable Sentry RUM if available
- [ ] Track slow API calls
- [ ] Monitor Edge Function performance

**Acceptance Criteria:**
- Core Web Vitals tracked in production
- Performance alerts configured
- Performance dashboard accessible
- Slow API calls identified and tracked

**Files:**
- `src/core/utils/performance.ts`
- `src/core/integrations/sentry.ts`

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P1: Performance Monitoring Activation)

---

### P1-5: Fix Remaining Test Failures (Low Priority)
**Priority:** Medium-High  
**Status:** To Do  
**Labels:** testing, technical-debt, p1  
**Assignee:** TBD  
**Estimate:** 8h

**Description:**
Fix remaining 10 low-priority test failures to improve test coverage from 91% to 95%+.

**Current State:**
- 154/164 tests passing (94% excluding OOM tests)
- 10 tests failing (low priority)

**Tasks:**
- [ ] Fix StoryForm date input invalid handling (valueAsDate mocking)
- [ ] Fix StoryForm gender radio button click events
- [ ] Improve Runware MockWebSocket message handling (5 tests)
- [ ] Fix Runware prompt enhancement edge cases
- [ ] Update or deprecate legacy ClerkAuthContext tests (3 tests)
- [ ] Investigate useStreamingGeneration OOM (5 tests) - memory leak investigation
- [ ] Optimize ReadableStream mocking for streaming tests

**Acceptance Criteria:**
- All non-OOM tests passing (target: 95%+)
- OOM tests fixed or skipped with documentation
- Test coverage ≥60% threshold

**Files:**
- `src/modules/story/components/__tests__/StoryForm.test.tsx`
- `src/modules/shared/utils/__tests__/runware.test.ts`
- `src/contexts/__tests__/ClerkAuthContext.test.tsx`
- `src/modules/story/hooks/__tests__/useStreamingGeneration.test.tsx`

**Related:**
- COVERAGE_PROGRESS.md
- TEST_STABILIZATION_SUMMARY.md

---

## 🟡 P2 - Medium Priority (Enhanced Features)

### P2-1: Implement Global Error Boundary
**Priority:** Medium  
**Status:** To Do  
**Labels:** error-handling, reliability, p2  
**Assignee:** TBD  
**Estimate:** 4h

**Description:**
Implement global error boundary to catch React errors and provide user-friendly error messages.

**Current State:**
- No global error boundary implementation
- Many catch blocks only console.error without user feedback
- Inconsistent error handling patterns

**Tasks:**
- [ ] Create global error boundary component
- [ ] Add component-level error boundaries for critical sections
- [ ] Implement user-friendly error messages
- [ ] Add error reporting to Sentry
- [ ] Test error boundary behavior
- [ ] Add retry mechanisms where appropriate

**Acceptance Criteria:**
- Global error boundary catches all React errors
- User-friendly error messages displayed
- Errors reported to Sentry
- Critical sections have component-level boundaries

**Files:**
- `src/components/ErrorBoundary.tsx` (new)
- `src/App.tsx` (integrate error boundary)

**Related:**
- DOCS/QA_REPORT.md (Error Handling Gaps)

---

### P2-2: Enhanced Error Context and User Messaging
**Priority:** Medium  
**Status:** To Do  
**Labels:** error-handling, ux, p2  
**Assignee:** TBD  
**Estimate:** 4h

**Description:**
Improve error messages with request ID tracking, error categorization, and user-friendly messaging.

**Tasks:**
- [ ] Generate unique request IDs for all Edge Function calls
- [ ] Include request IDs in error responses
- [ ] Log request IDs in error tracking
- [ ] Classify errors (user error, system error, external API error)
- [ ] Show appropriate messages to users
- [ ] Track error trends
- [ ] Replace technical errors with user-friendly messages
- [ ] Provide actionable next steps
- [ ] Add help/support links

**Acceptance Criteria:**
- All errors have request IDs
- User-facing errors are clear and helpful
- Error trends visible in Sentry
- Actionable error messages with next steps

**Files:**
- `supabase/functions/_shared/` (request ID middleware)
- `src/modules/shared/utils/errorHandlingUtils.ts`

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P2: Enhanced Error Context)

---

### P2-3: E2E Testing Setup
**Priority:** Medium  
**Status:** To Do  
**Labels:** testing, e2e, p2  
**Assignee:** TBD  
**Estimate:** 12h

**Description:**
Set up automated end-to-end testing for critical user journeys.

**Tasks:**
- [ ] Choose framework (Playwright recommended)
- [ ] Install: `npm install --save-dev @playwright/test`
- [ ] Run: `npx playwright install`
- [ ] Configure Playwright
- [ ] Write authentication flow tests (sign up, sign in)
- [ ] Write story generation wizard tests (complete flow)
- [ ] Write e-book generation and download tests
- [ ] Write credit purchase flow tests (if integrated)
- [ ] Write ERA selection and preview tests
- [ ] Add to GitHub Actions CI/CD
- [ ] Run on PR and main branch
- [ ] Generate test reports

**Acceptance Criteria:**
- Critical user journeys covered
- Tests run in CI/CD
- < 5 minute test execution time
- Test reports generated

**Related:**
- NEXT_STEPS_BUILD_PLAN.md (P2: E2E Testing Setup)

---

### P2-4: Implement Token Refresh Mechanism
**Priority:** Medium  
**Status:** To Do  
**Labels:** auth, security, p2  
**Assignee:** TBD  
**Estimate:** 3h

**Description:**
Add token refresh mechanism and expiry handling to prevent authentication failures.

**Current State:**
- No token refresh mechanism
- No expiry handling
- Multiple locations using `getToken()` without refresh

**Tasks:**
- [ ] Implement token refresh logic
- [ ] Add token expiry detection
- [ ] Handle token refresh failures gracefully
- [ ] Update all `getToken()` call sites
- [ ] Test token refresh flow
- [ ] Test expiry handling

**Acceptance Criteria:**
- Tokens automatically refreshed before expiry
- Graceful handling of refresh failures
- No authentication failures due to expired tokens

**Files:**
- `src/modules/auth/contexts/ClerkAuthContext.tsx`
- `src/core/integrations/supabase/client.ts`

**Related:**
- DOCS/QA_REPORT.md (Insecure Token Handling)

---

### P2-5: Clean Up Duplicate Files
**Priority:** Medium  
**Status:** To Do  
**Labels:** cleanup, technical-debt, p2  
**Assignee:** TBD  
**Estimate:** 2h

**Description:**
Remove duplicate files and consolidate authentication logic to reduce confusion and maintenance overhead.

**Current State:**
- Multiple versions of same files (App.tsx, App 2.tsx, etc.)
- Duplicate authentication test files
- Confusion and maintenance overhead

**Tasks:**
- [ ] Identify all duplicate files
- [ ] Verify which versions are active
- [ ] Remove duplicate versions
- [ ] Consolidate authentication logic
- [ ] Update imports if needed
- [ ] Verify no broken references

**Acceptance Criteria:**
- No duplicate files in codebase
- Single source of truth for authentication logic
- All imports working correctly

**Related:**
- DOCS/QA_REPORT.md (Code Duplication)

---

## 🟢 P3 - Low Priority (Future Enhancements)

### P3-1: Enable TypeScript Strict Mode (Gradual)
**Priority:** Low  
**Status:** To Do  
**Labels:** typescript, type-safety, p3  
**Assignee:** TBD  
**Estimate:** 16h (gradual)

**Description:**
Gradually enable TypeScript strict mode to improve type safety.

**Current State:**
- Strict mode disabled
- Many 'any' types
- Type safety: 70%

**Tasks:**
- [ ] Enable `strictNullChecks` in `tsconfig.json`
- [ ] Fix resulting type errors incrementally
- [ ] Enable `noImplicitAny`
- [ ] Fix resulting type errors incrementally
- [ ] Enable remaining strict mode options gradually
- [ ] Update types for better inference

**Acceptance Criteria:**
- TypeScript strict mode enabled
- Type safety: 95%+
- No 'any' types in critical paths

**Files:**
- `tsconfig.json`
- All TypeScript files (incremental fixes)

**Related:**
- PRODUCTION_READINESS_IMPROVEMENTS.md (Priority 7)
- DOCS/QA_REPORT.md (Type Safety: 70%)

---

### P3-2: Implement Data Caching Strategy
**Priority:** Low  
**Status:** To Do  
**Labels:** performance, caching, p3  
**Assignee:** TBD  
**Estimate:** 6h

**Description:**
Implement caching strategy for API calls to reduce redundant network requests.

**Current State:**
- No caching strategy for API calls
- Redundant network requests
- Inefficient data fetching

**Tasks:**
- [ ] Choose caching solution (React Query already installed)
- [ ] Configure React Query caching
- [ ] Add cache invalidation strategies
- [ ] Cache ERA data
- [ ] Cache story prompts
- [ ] Cache user profile data
- [ ] Test cache behavior
- [ ] Verify cache invalidation works

**Acceptance Criteria:**
- API calls cached appropriately
- Reduced redundant network requests
- Cache invalidation working correctly

**Files:**
- `src/modules/story/services/` (add caching)
- `src/modules/user/services/` (add caching)

**Related:**
- DOCS/QA_REPORT.md (Inefficient Data Fetching)

---

### P3-3: Add React.memo and Performance Optimizations
**Priority:** Low  
**Status:** To Do  
**Labels:** performance, react, p3  
**Assignee:** TBD  
**Estimate:** 8h

**Description:**
Add React.memo, useMemo, and useCallback to prevent unnecessary re-renders and improve performance.

**Current State:**
- Missing memoization in context providers
- Unnecessary re-renders
- Performance degradation with large component trees

**Tasks:**
- [ ] Add React.memo to expensive components
- [ ] Add useMemo for expensive computations
- [ ] Add useCallback for event handlers
- [ ] Memoize context values
- [ ] Test performance improvements
- [ ] Verify no unnecessary re-renders

**Acceptance Criteria:**
- Expensive components memoized
- No unnecessary re-renders
- Performance improved with large component trees

**Files:**
- `src/modules/auth/contexts/ClerkAuthContext.tsx`
- Various component files

**Related:**
- DOCS/QA_REPORT.md (Unnecessary Re-renders)

---

### P3-4: Clean Up Vite Config
**Priority:** Low  
**Status:** To Do  
**Labels:** cleanup, technical-debt, p3  
**Assignee:** TBD  
**Estimate:** 1h

**Description:**
Remove console.log statements from vite.config.ts proxy handlers and use logger utility instead.

**Current State:**
- Console.log statements in vite.config.ts proxy handlers
- Only affects development but should be cleaned up

**Tasks:**
- [ ] Remove console.log statements from proxy handlers
- [ ] Use logger utility instead
- [ ] Verify logging still works

**Acceptance Criteria:**
- No console.log statements in vite.config.ts
- Logger utility used for logging

**Files:**
- `vite.config.ts`

**Related:**
- PRODUCTION_READINESS_IMPROVEMENTS.md (Priority 6)

---

### P3-5: Add Offline Detection and Handling
**Priority:** Low  
**Status:** To Do  
**Labels:** reliability, offline, p3  
**Assignee:** TBD  
**Estimate:** 4h

**Description:**
Add offline detection and handling to improve user experience when network is unavailable.

**Current State:**
- No offline detection or handling
- No retry logic for failed API calls (except in some services)

**Tasks:**
- [ ] Add offline detection (navigator.onLine)
- [ ] Add offline event listeners
- [ ] Show offline indicator to users
- [ ] Queue requests when offline
- [ ] Retry queued requests when online
- [ ] Handle offline gracefully

**Acceptance Criteria:**
- Offline state detected
- Users notified when offline
- Requests queued and retried when online

**Files:**
- `src/core/utils/offline.ts` (new)
- `src/App.tsx` (integrate offline handling)

**Related:**
- DOCS/QA_REPORT.md (Network Error Recovery)

---

## 📊 Summary

**Total Tickets:** 20
- **P0 (Critical):** 4 tickets
- **P1 (High Priority):** 5 tickets
- **P2 (Medium Priority):** 5 tickets
- **P3 (Low Priority):** 6 tickets

**Estimated Total Effort:** ~100 hours

**Recommended Order:**
1. Complete all P0 tickets before production launch
2. Complete P1 tickets in first 2 weeks after launch
3. Complete P2 tickets in first month after launch
4. Complete P3 tickets as ongoing improvements

---

## 🔧 How to Import into Linear

### Option 1: Manual Creation
1. Copy each ticket section above
2. Create new issue in Linear
3. Paste ticket content
4. Add labels and assignee
5. Set priority and estimate

### Option 2: Linear CLI (if installed)
```bash
# Install Linear CLI
npm install -g @linear/cli

# Authenticate
linear auth

# Create issues from file (requires custom script)
# See: https://linear.app/docs/cli
```

### Option 3: Linear API
Use Linear GraphQL API to bulk create issues:
- API Docs: https://linear.app/docs/api
- GraphQL endpoint: https://api.linear.app/graphql

### Option 4: Linear Import Tool
Use Linear's import feature if available in your workspace settings.

