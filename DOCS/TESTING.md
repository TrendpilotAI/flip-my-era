# FlipMyEra Testing Guide

## 🎯 Testing Strategy Overview

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← 10% (Critical user journeys)
                    │   (Playwright)  │
                ┌───┴─────────────────┴───┐
                │  Integration Tests      │ ← 20% (API & service integration)
                │     (Vitest)           │
            ┌───┴─────────────────────────┴───┐
            │      Unit Tests                 │ ← 70% (Individual functions/components)
            │       (Vitest)                  │
            └─────────────────────────────────┘
```

### Testing Principles

1. **Fast Feedback**: Quick test execution for rapid development
2. **Reliable**: Tests should be deterministic and not flaky
3. **Maintainable**: Tests should be easy to update and understand
4. **Comprehensive**: Cover critical business logic and user flows
5. **Isolated**: Tests should not depend on external services

## 🛠️ Testing Setup

### Dependencies Installation

```bash
# Install testing dependencies
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  playwright \
  @playwright/test \
  msw \
  c8 \
  happy-dom
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.{ts,tsx}",
    "test:integration": "vitest run tests/integration/**/*.test.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## 🧪 Unit Testing Examples

### Authentication Module Tests

```typescript
// src/modules/auth/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { LoginForm } from './LoginForm'

const mockSignIn = vi.fn()

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isLoading: false,
    error: null,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
  })

  it('should render login form fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<LoginForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})
```

### Story Service Tests

```typescript
// src/modules/story/services/storyService.test.ts
import { vi } from 'vitest'
import { storyService } from './storyService'
import { generateWithGroq } from '@/utils/groq'

vi.mock('@/utils/groq')

describe('StoryService', () => {
  describe('generateStory', () => {
    it('should generate story with valid prompt', async () => {
      const mockContent = 'Once upon a time...'
      vi.mocked(generateWithGroq).mockResolvedValue(mockContent)

      const prompt = {
        name: 'John',
        birthDate: new Date('1990-01-01'),
        location: 'New York',
        personality: 'adventurous',
      }

      const result = await storyService.generateStory(prompt)

      expect(result.content).toBe(mockContent)
      expect(generateWithGroq).toHaveBeenCalled()
    })
  })
})
```

## 🔗 Integration Testing

### API Integration Tests

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const server = setupServer(
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.json({
        user: { id: '123', email: 'test@example.com' },
        token: 'mock-token',
      })
    )
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('API Integration', () => {
  it('should authenticate user', async () => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    })

    const data = await response.json()
    expect(data.user.email).toBe('test@example.com')
  })
})
```

## 🎭 End-to-End Testing

### Complete User Journey

```typescript
// tests/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test'

test('complete story creation flow', async ({ page }) => {
  await page.goto('/')
  
  // Fill story form
  await page.fill('[data-testid="character-name"]', 'Alice')
  await page.fill('[data-testid="story-location"]', 'Wonderland')
  await page.fill('[data-testid="birth-date"]', '1990-01-01')
  
  // Generate story
  await page.click('[data-testid="generate-story"]')
  
  // Wait for story generation
  await expect(page.locator('[data-testid="story-result"]')).toBeVisible({ timeout: 30000 })
  
  // Create ebook
  await page.click('[data-testid="create-ebook"]')
  
  // Verify ebook creation
  await expect(page.locator('[data-testid="ebook-chapters"]')).toBeVisible()
})
```

## 📊 Test Coverage Requirements

### Coverage Thresholds

- **Unit Tests**: 90%+ coverage for critical modules
- **Integration Tests**: 80%+ coverage for API endpoints
- **E2E Tests**: Cover all critical user journeys

### Module-Specific Requirements

- **Auth Module**: 95% coverage (security critical)
- **Story Module**: 90% coverage (core functionality)
- **Ebook Module**: 85% coverage (complex generation logic)
- **Shared Utils**: 90% coverage (widely used)

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🎯 Testing Best Practices

1. **Write tests first** for new features (TDD)
2. **Keep tests simple** and focused
3. **Use descriptive test names** that explain the behavior
4. **Mock external dependencies** to ensure test isolation
5. **Regularly review and update** test coverage
6. **Run tests in CI/CD** to catch issues early

---

*This testing strategy ensures FlipMyEra maintains high quality and reliability throughout development and production.* 