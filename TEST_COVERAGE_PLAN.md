# Test Coverage Plan - Flip My Era

## Current Status (Post QA Branch Merge)

### Test Coverage Metrics
- **Overall Coverage**: ~40% (up from <5%)
- **Passing Tests**: 84+
- **Skipped Tests**: ~30 (documented reasons)
- **Test Files**: 7 suites
- **Infrastructure**: ✅ Complete

### Coverage by Module

| Module | Coverage | Tests | Status |
|--------|----------|-------|--------|
| **Auth Context** | 0%* | 0/24 | ⏭️ Skipped (mocking issues) |
| **Error Boundary** | 90% | 11/12 | ✅ Excellent |
| **Protected Route** | 100% | 16/16 | ✅ Excellent |
| **AI Services** | 85% | 11/18 | 🟡 Good (7 skipped) |
| **Utility Functions** | 100% | 3/3 | ✅ Excellent |
| **Ebook Components** | 85% | 11/11 | ✅ Good |
| **Story Components** | 60% | 32/32 | ✅ Good |

*Skipped due to complex mocking requirements

---

## Phase 1: Immediate Priorities (1-2 weeks)

### 1.1 Fix Skipped Tests
**Goal**: Get to 60% overall coverage

#### High Priority
- [ ] **ClerkAuthContext Tests** (24 tests)
  - Refactor production code to make `runwareService` injectable
  - Use factory pattern or dependency injection
  - **Estimated**: 2-3 days
  - **Impact**: Critical - tests core authentication

- [ ] **AI Service Image Generation** (7 tests)
  - Implement dependency injection for `RunwareService`
  - Extract image generation to separate testable service
  - **Estimated**: 1 day
  - **Impact**: Medium - tests image generation edge cases

#### Medium Priority
- [ ] **API Mock Structure Issues**
  - Standardize all API mocks to use consistent structure
  - Create helper functions for common mock patterns
  - **Estimated**: 4 hours
  - **Impact**: Low - improves developer experience

### 1.2 Add Missing Critical Path Tests
**Goal**: Cover user-facing functionality

- [ ] **User Dashboard Tests**
  - Story list display
  - Story creation flow
  - Credit balance display
  - Subscription status checks
  - **Estimated**: 1 day

- [ ] **Story Generation Tests**
  - Form validation
  - API integration
  - Error handling
  - Loading states
  - **Estimated**: 1 day

- [ ] **Payment Flow Tests**
  - Checkout process
  - Subscription management
  - Credit purchase
  - **Estimated**: 1 day

### 1.3 Set Up CI/CD Integration
**Goal**: Automate testing

- [ ] **GitHub Actions Workflow**
  - Run tests on every PR
  - Generate coverage reports
  - Block merge if coverage drops
  - **Estimated**: 4 hours

- [ ] **Coverage Reporting**
  - Integrate with Codecov or Coveralls
  - Add coverage badges to README
  - Set minimum threshold: 60%
  - **Estimated**: 2 hours

---

## Phase 2: Expand Coverage (3-4 weeks)

### 2.1 Component Testing (Target: 70% coverage)

#### Admin Components
- [ ] Admin Dashboard
- [ ] User Management
- [ ] Credits Management
- [ ] Integration Settings
- **Estimated**: 2 days

#### Ebook Components
- [ ] Chapter Generation
- [ ] Book Preview
- [ ] Download/Export
- [ ] Cover Design
- **Estimated**: 2 days

#### Story Components
- [ ] Story Preview
- [ ] Share functionality
- [ ] Edit/Delete operations
- **Estimated**: 1 day

### 2.2 Integration Testing

- [ ] **Authentication Flow**
  - Login → Dashboard
  - Signup → Onboarding
  - Logout → Redirect
  - **Estimated**: 1 day

- [ ] **Story Creation Workflow**
  - Form → Generation → Preview → Save
  - Error recovery at each step
  - **Estimated**: 1 day

- [ ] **Payment Workflow**
  - Select plan → Checkout → Confirmation
  - Failed payment handling
  - **Estimated**: 1 day

### 2.3 Utility & Service Testing

- [ ] **API Utilities**
  - Request retry logic
  - Error handling
  - Token management
  - **Estimated**: 4 hours

- [ ] **Supabase Client**
  - CRUD operations
  - RPC functions
  - File uploads
  - **Estimated**: 4 hours

- [ ] **Social Share Utils**
  - TikTok integration
  - URL generation
  - Analytics tracking
  - **Estimated**: 4 hours

---

## Phase 3: E2E & Advanced Testing (5-6 weeks)

### 3.1 End-to-End Testing

- [ ] **Set Up Playwright/Cypress**
  - Configure test environment
  - Create page objects
  - **Estimated**: 1 day

- [ ] **Critical User Journeys**
  - New user signup → Create first story → Download ebook
  - Existing user → Upgrade plan → Use premium features
  - **Estimated**: 2 days

### 3.2 Performance Testing

- [ ] **Load Testing**
  - Story generation under load
  - Image generation performance
  - Database query optimization
  - **Estimated**: 2 days

- [ ] **Bundle Size Analysis**
  - Code splitting verification
  - Lazy loading tests
  - **Estimated**: 1 day

### 3.3 Accessibility Testing

- [ ] **WCAG 2.1 AA Compliance**
  - Automated accessibility tests
  - Keyboard navigation
  - Screen reader compatibility
  - **Estimated**: 2 days

---

## Phase 4: Maintenance & Optimization (Ongoing)

### 4.1 Test Maintenance Strategy

- **Weekly**: Review and update flaky tests
- **Monthly**: Coverage analysis and gap identification
- **Quarterly**: Refactor test suite for performance
- **Annual**: Major test infrastructure upgrades

### 4.2 Coverage Goals & Milestones

| Timeline | Coverage Target | Key Achievements |
|----------|----------------|------------------|
| **Week 2** | 60% | Critical paths covered |
| **Month 1** | 70% | All components tested |
| **Month 3** | 80% | Integration tests complete |
| **Month 6** | 90% | E2E tests in place |

### 4.3 Quality Metrics to Track

- **Coverage Percentage**: Overall code covered
- **Test Execution Time**: Keep under 2 minutes for unit tests
- **Flaky Test Rate**: Should be <2%
- **PR Test Success Rate**: Target 95%+
- **Bug Detection Rate**: % of bugs caught by tests before production

---

## Technical Debt & Known Issues

### Issues Requiring Refactoring

1. **Module-Level Dependencies**
   - `runwareService` in `ai.ts` makes testing difficult
   - **Solution**: Use dependency injection or factory pattern
   - **Priority**: High
   - **Effort**: 1 day

2. **Complex Mocking Requirements**
   - Clerk authentication mocks are brittle
   - **Solution**: Create more robust mock utilities
   - **Priority**: High
   - **Effort**: 2 days

3. **API Response Structure Inconsistency**
   - Some endpoints return `data.data`, others `data`
   - **Solution**: Standardize API wrapper
   - **Priority**: Medium
   - **Effort**: 4 hours

### Test Infrastructure Improvements

1. **Shared Test Utilities**
   - [ ] Create common test setup functions
   - [ ] Build custom render functions with providers
   - [ ] Standardize mock data factories
   - **Effort**: 1 day

2. **Test Data Management**
   - [ ] Create fixture files for test data
   - [ ] Build data builders for complex objects
   - [ ] Implement snapshot testing where appropriate
   - **Effort**: 1 day

3. **Mock Service Layer**
   - [ ] Create MSW (Mock Service Worker) setup
   - [ ] Build API mock handlers
   - [ ] Implement request/response interceptors
   - **Effort**: 2 days

---

## Best Practices & Guidelines

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Test Names**: Use "should ... when ..." format
4. **Test Behavior, Not Implementation**: Focus on what, not how
5. **Mock External Dependencies**: Keep tests isolated

### Test Organization

```
src/
  modules/
    feature/
      components/
        Component.tsx
        __tests__/
          Component.test.tsx       # Unit tests
          Component.integration.test.tsx  # Integration tests
      services/
        service.ts
        __tests__/
          service.test.ts
```

### Naming Conventions

- Unit tests: `*.test.tsx` or `*.test.ts`
- Integration tests: `*.integration.test.tsx`
- E2E tests: `*.e2e.test.ts`
- Test utilities: `*-utils.ts` in `test/` directory

---

## Resources & Tools

### Current Stack
- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: Vitest vi
- **Coverage**: Vitest coverage

### Recommended Additions
- **E2E**: Playwright or Cypress
- **Visual Regression**: Percy or Chromatic
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core, jest-axe
- **API Mocking**: MSW (Mock Service Worker)

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Success Criteria

### Definition of Done for Test Coverage

✅ **Minimum Requirements**
- [ ] 80% overall code coverage
- [ ] 100% coverage of critical paths
- [ ] All new features include tests
- [ ] CI/CD runs tests on every PR
- [ ] No merge without passing tests

✅ **Quality Standards**
- [ ] Test execution time <2 minutes
- [ ] Flaky test rate <2%
- [ ] Coverage doesn't decrease
- [ ] Tests are maintainable and readable
- [ ] Tests document expected behavior

---

## Next Actions (This Week)

### Day 1-2: Infrastructure
- [ ] Set up GitHub Actions workflow
- [ ] Configure coverage reporting
- [ ] Add coverage badges to README
- [ ] Document test running instructions

### Day 3-4: Critical Tests
- [ ] Refactor ClerkAuthContext for testability
- [ ] Write ClerkAuthContext tests
- [ ] Fix skipped AI service tests

### Day 5: User Dashboard
- [ ] Write UserDashboard component tests
- [ ] Test story list functionality
- [ ] Test credit balance display

---

## Review & Iteration

### Weekly Reviews
- Review test coverage reports
- Identify untested critical paths
- Address flaky tests
- Update this plan

### Monthly Goals
- Achieve next coverage milestone
- Reduce technical debt
- Improve test execution speed
- Enhance test documentation

---

## Conclusion

This plan provides a roadmap to achieve comprehensive test coverage for the Flip My Era application. By following this structured approach, we will:

1. **Increase confidence** in code changes
2. **Reduce bugs** in production
3. **Improve code quality** through better design
4. **Speed up development** with faster feedback
5. **Enable safe refactoring** of legacy code

**Current Status**: ✅ Foundation Complete  
**Next Milestone**: 60% coverage in 2 weeks  
**Long-term Goal**: 90% coverage in 6 months

---

*Last Updated: October 5, 2025*  
*Document Owner: Development Team*  
*Review Frequency: Weekly*
