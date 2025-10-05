# Test Coverage Improvement Plan

_Last updated: Sat Oct 04 22:09:47 UTC 2025_

## Session Log

### Session: Sat Oct 04 21:58:39 UTC 2025 → Sat Oct 04 21:58:58 UTC 2025
- **Initial plan**
  - Audit failing suites (ClerkAuthContext, ProtectedRoute, ErrorBoundary, AI service)
  - Repair mock implementations and unblock tests
  - Outline steps to boost coverage toward 60%
- **Checklist**
  - [x] Review current branch diff and test failures
  - [x] Draft actionable todo list for test repairs
  - [x] Define follow-on coverage and automation steps
  - [ ] Implement mock fixes and rerun suites
  - [ ] Raise coverage baseline with new targeted tests
- **Session summary**
  - Documented blockers (mock errors, incomplete exports, brittle assertions)
  - Established phased todo list covering immediate fixes through long-term goals
  - Created ongoing coverage plan file with session tracking for future updates

### Session: Sat Oct 04 22:01:32 UTC 2025 → Sat Oct 04 22:03:22 UTC 2025
- **Initial plan**
  - Repair syntax error in `src/test/mocks/clerk.ts`
  - Ensure Supabase mocks expose `mockSupabase`
  - Rerun ClerkAuthContext tests to confirm mocks load
- **Checklist**
  - [x] Fix Clerk mock syntax issues
  - [x] Export `mockSupabase` utilities for tests
  - [ ] Verify ClerkAuthContext tests compile and run
- **Session summary**
  - Renamed `src/test/mocks/clerk.ts` to `.tsx` to satisfy JSX parsing
  - Added `mockSupabase` export alias and reran tests
  - ClerkAuthContext test still fails due to hoisted `vi.mock` expecting in-scope mocks; follow-up needed

### Session: Sat Oct 04 22:03:22 UTC 2025 → Sat Oct 04 22:09:47 UTC 2025
- **Initial plan**
  - Adjust ClerkAuthContext tests to avoid hoisted `vi.mock` referencing runtime variables
  - Verify Supabase mock availability inside test factories
  - Re-run targeted test suite
- **Checklist**
  - [x] Refactor ClerkAuthContext test mocks for hoist-safe usage
  - [x] Confirm tests import `mockSupabase` from updated location
  - [x] Re-run `vitest` for auth context suite
  - [x] Re-run ./scripts/run-tests.sh to capture current failures
- **Session summary**
  - Rebuilt ClerkAuthContext test suite with hoist-safe mocks and shared Supabase client helpers
  - Auth context tests now pass consistently; overall run still fails on ErrorBoundary text assertions and AI service mocks
  - Logged remaining blockers and updated TODOs for upcoming sessions

## Active Todo List (master copy)
1. Fix Clerk and Supabase mock implementations to unblock existing test suites
2. Stabilize ErrorBoundary and ProtectedRoute tests (update assertions, resolve DOM queries)
3. Repair AI service mocks and add missing exports so story service tests pass
4. Add targeted unit tests for StoryForm, UserDashboard, and ClerkAuthProvider happy path
5. Introduce integration tests for authentication and story workflows to push coverage toward 60%
6. Deepen test coverage beyond 60% (error branches, Supabase sync, subscription gating)
7. Introduce regression smoke suites and wire into CI
8. Automate test scripts in CI with coverage thresholds and reporting
9. Document test/mocking patterns and maintain coverage dashboard
10. Integrate production monitoring to validate error boundaries

## Tracking Guidelines
- Update the timestamp at the top at the start and end of every working session
- For each session add:
  - Start and end times (UTC)
  - Initial plan for the session
  - Checklist with completion state
  - Concise summary of outcomes and follow-up items
- Keep the todo list synchronized with individual task management tools (e.g., project TODOs)
- Compact older session summaries if the file grows large, but retain key decisions
