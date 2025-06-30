# FlipMyEra Development Setup Guide

## 🚀 Quick Start

### Prerequisites

```bash
# Required software versions
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.34.0
Docker >= 20.10.0 (optional, for backend services)
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/flip-my-era.git
cd flip-my-era

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🏗️ Project Structure

### Current Structure
```
flip-my-era/
├── src/
│   ├── components/          # Current components (to be modularized)
│   ├── pages/              # Route components
│   ├── utils/              # Utility functions
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── integrations/       # External service integrations
│   └── types/              # TypeScript type definitions
├── supabase/               # Supabase backend functions
├── public/                 # Static assets
├── DOCS/                   # Documentation
└── tests/                  # Test files
```

### Target Modular Structure
```
src/
├── modules/
│   ├── auth/
│   │   ├── components/     # Authentication UI components
│   │   ├── hooks/          # Auth-related hooks
│   │   ├── services/       # Auth API services
│   │   ├── types/          # Auth type definitions
│   │   ├── tests/          # Auth module tests
│   │   └── index.ts        # Module exports
│   ├── story/
│   │   ├── components/     # Story creation/display components
│   │   ├── hooks/          # Story-related hooks
│   │   ├── services/       # Story generation services
│   │   ├── types/          # Story type definitions
│   │   ├── tests/          # Story module tests
│   │   └── index.ts        # Module exports
│   ├── ebook/
│   │   ├── components/     # Ebook generation components
│   │   ├── services/       # Ebook creation services
│   │   ├── types/          # Ebook type definitions
│   │   ├── tests/          # Ebook module tests
│   │   └── index.ts        # Module exports
│   ├── user/
│   │   ├── components/     # User profile/dashboard components
│   │   ├── services/       # User management services
│   │   ├── types/          # User type definitions
│   │   ├── tests/          # User module tests
│   │   └── index.ts        # Module exports
│   └── shared/
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Shared hooks
│       ├── utils/          # Utility functions
│       ├── types/          # Shared type definitions
│       ├── tests/          # Shared module tests
│       └── index.ts        # Module exports
├── core/
│   ├── api/               # API client configuration
│   ├── config/            # App configuration
│   ├── constants/         # App constants
│   └── types/             # Core type definitions
└── app/
    ├── layout/            # App layout components
    ├── pages/             # Page components
    └── routing/           # Route configuration
```

## 🔧 Environment Configuration

### Environment Variables

```bash
# .env.local
# App Configuration
VITE_APP_URL=http://localhost:8080
VITE_APP_ENV=development

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication (Future)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_RUNWARE_API_KEY=your_runware_api_key

# SamCart Integration
VITE_SAMCART_API_KEY=your_samcart_api_key
VITE_SAMCART_MERCHANT_ID=your_merchant_id

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_TEST_DATA=true
VITE_ENABLE_ANALYTICS=false
```

### Environment-Specific Configurations

```typescript
// src/core/config/environments.ts
interface EnvironmentConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableDebugMode: boolean
    enableTestData: boolean
    enableAnalytics: boolean
  }
  services: {
    supabase: {
      url: string
      anonKey: string
    }
    clerk?: {
      publishableKey: string
    }
  }
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development'
  
  const baseConfig = {
    api: {
      baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
      timeout: 10000,
    },
    services: {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  }

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        features: {
          enableDebugMode: true,
          enableTestData: true,
          enableAnalytics: false,
        },
      }
    
    case 'staging':
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: 'https://staging.flipmyera.com',
        },
        features: {
          enableDebugMode: true,
          enableTestData: false,
          enableAnalytics: true,
        },
      }
    
    case 'production':
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: 'https://flipmyera.com',
          timeout: 5000,
        },
        features: {
          enableDebugMode: false,
          enableTestData: false,
          enableAnalytics: true,
        },
      }
    
    default:
      throw new Error(`Unknown environment: ${env}`)
  }
}
```

## 🧩 Modular Development Workflow

### Creating a New Module

1. **Create Module Structure**
```bash
# Create new module directory
mkdir -p src/modules/new-module/{components,hooks,services,types,tests}

# Create index file
touch src/modules/new-module/index.ts
```

2. **Module Template**
```typescript
// src/modules/new-module/index.ts
export * from './components'
export * from './hooks'
export * from './services'
export * from './types'

// Module configuration
export const newModuleConfig = {
  name: 'new-module',
  version: '1.0.0',
  dependencies: ['shared'],
}
```

3. **Component Structure**
```typescript
// src/modules/new-module/components/index.ts
export { default as NewModuleComponent } from './NewModuleComponent'
export { default as NewModuleForm } from './NewModuleForm'

// src/modules/new-module/components/NewModuleComponent.tsx
import React from 'react'
import { useNewModule } from '../hooks'
import { NewModuleProps } from '../types'

export default function NewModuleComponent({ ...props }: NewModuleProps) {
  const { data, loading, error } = useNewModule()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {/* Component implementation */}
    </div>
  )
}
```

4. **Service Structure**
```typescript
// src/modules/new-module/services/index.ts
export { newModuleService } from './newModuleService'

// src/modules/new-module/services/newModuleService.ts
import { apiClient } from '@/core/api'
import { NewModuleData, NewModuleResponse } from '../types'

class NewModuleService {
  async getData(): Promise<NewModuleResponse> {
    return apiClient.get('/api/new-module')
  }
  
  async createData(data: NewModuleData): Promise<NewModuleResponse> {
    return apiClient.post('/api/new-module', data)
  }
}

export const newModuleService = new NewModuleService()
```

5. **Hook Structure**
```typescript
// src/modules/new-module/hooks/index.ts
export { useNewModule } from './useNewModule'

// src/modules/new-module/hooks/useNewModule.ts
import { useState, useEffect } from 'react'
import { newModuleService } from '../services'
import { NewModuleState } from '../types'

export function useNewModule(): NewModuleState {
  const [state, setState] = useState<NewModuleState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await newModuleService.getData()
        setState({ data, loading: false, error: null })
      } catch (error) {
        setState({ data: null, loading: false, error })
      }
    }

    fetchData()
  }, [])

  return state
}
```

### Module Testing

```typescript
// src/modules/new-module/tests/NewModuleComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import NewModuleComponent from '../components/NewModuleComponent'

vi.mock('../hooks/useNewModule', () => ({
  useNewModule: () => ({
    data: { id: '1', name: 'Test Data' },
    loading: false,
    error: null,
  }),
}))

describe('NewModuleComponent', () => {
  it('should render component with data', () => {
    render(<NewModuleComponent />)
    expect(screen.getByText('Test Data')).toBeInTheDocument()
  })
})
```

## 🔄 Development Workflow

### Git Workflow

```bash
# Feature development workflow
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR to develop branch
```

### Branch Strategy

- `main` - Production branch
- `develop` - Development integration branch
- `feature/*` - Feature development branches
- `hotfix/*` - Production hotfix branches
- `release/*` - Release preparation branches

### Code Quality Checks

```bash
# Run before committing
npm run lint          # ESLint checks
npm run typecheck     # TypeScript checks
npm run test:unit     # Unit tests
npm run test:coverage # Coverage report
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

## 🧪 Testing in Development

### Running Tests

```bash
# Unit tests
npm run test:unit

# Watch mode for development
npm run test:watch

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:ci
```

### Test-Driven Development

1. **Write failing test**
2. **Write minimal code to pass**
3. **Refactor and improve**
4. **Repeat**

```typescript
// Example TDD workflow
describe('UserService', () => {
  it('should create user profile', async () => {
    // 1. Write test first (will fail)
    const userData = { name: 'John', email: 'john@example.com' }
    const result = await userService.createProfile(userData)
    expect(result.id).toBeDefined()
    expect(result.name).toBe('John')
  })
})

// 2. Implement minimal service method
class UserService {
  async createProfile(userData: UserData): Promise<User> {
    // Minimal implementation to pass test
    return { id: '123', ...userData }
  }
}

// 3. Refactor and improve implementation
```

## 🔧 Development Tools

### VS Code Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
```

### Recommended Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vite/bin/vite.js",
      "args": ["--mode", "development"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 📊 Performance Monitoring

### Development Performance Tools

```typescript
// src/core/performance/devTools.ts
export const performanceMonitor = {
  measureRender: (componentName: string) => {
    if (import.meta.env.DEV) {
      performance.mark(`${componentName}-start`)
      return () => {
        performance.mark(`${componentName}-end`)
        performance.measure(
          `${componentName}-render`,
          `${componentName}-start`,
          `${componentName}-end`
        )
      }
    }
    return () => {}
  },

  logMetrics: () => {
    if (import.meta.env.DEV) {
      const entries = performance.getEntriesByType('measure')
      console.table(entries.map(entry => ({
        name: entry.name,
        duration: `${entry.duration.toFixed(2)}ms`
      })))
    }
  }
}

// Usage in components
function ExpensiveComponent() {
  const endMeasure = performanceMonitor.measureRender('ExpensiveComponent')
  
  useEffect(() => {
    return endMeasure
  }, [endMeasure])
  
  return <div>Component content</div>
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for duplicate dependencies
npx duplicate-package-checker-webpack-plugin
```

## 🚀 Local Development Commands

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:host         # Start dev server with network access
npm run dev:debug        # Start dev server with debug mode

# Building
npm run build            # Production build
npm run build:dev        # Development build
npm run build:analyze    # Build with bundle analysis

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ui          # Test UI (Vitest)

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run typecheck        # TypeScript check
npm run format           # Prettier format

# Database
npm run db:reset         # Reset local database
npm run db:seed          # Seed test data
npm run db:migrate       # Run migrations

# Documentation
npm run docs:dev         # Start docs dev server
npm run docs:build       # Build documentation
```

### Custom Scripts

```json
// package.json scripts section
{
  "scripts": {
    "dev": "vite --port 8080",
    "dev:host": "vite --port 8080 --host",
    "dev:debug": "vite --port 8080 --debug",
    "build": "tsc && vite build",
    "build:dev": "tsc && vite build --mode development",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "clean": "rm -rf dist node_modules/.vite",
    "reset": "npm run clean && npm install"
  }
}
```

## 🔍 Debugging

### Frontend Debugging

```typescript
// Debug utilities
export const debugUtils = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data)
    }
  },
  
  time: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label)
    }
  },
  
  timeEnd: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label)
    }
  },
  
  trace: (message: string) => {
    if (import.meta.env.DEV) {
      console.trace(message)
    }
  }
}

// React DevTools integration
if (import.meta.env.DEV) {
  // Enable React DevTools profiler
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.settings?.profilerEnabled = true
}
```

### Backend Debugging

```typescript
// Supabase function debugging
export const debugSupabase = {
  logQuery: (table: string, query: any) => {
    if (Deno.env.get('DEBUG_MODE') === 'true') {
      console.log(`[SUPABASE] ${table} query:`, query)
    }
  },
  
  logError: (operation: string, error: any) => {
    console.error(`[SUPABASE] ${operation} error:`, error)
  }
}
```

## 📝 Development Best Practices

### Code Organization

1. **Module Boundaries**: Keep modules independent and well-defined
2. **Dependency Direction**: Dependencies should flow inward (shared ← feature modules)
3. **Single Responsibility**: Each module should have a clear purpose
4. **Interface Segregation**: Define clear interfaces between modules

### Performance Best Practices

1. **Lazy Loading**: Load modules and components on demand
2. **Memoization**: Use React.memo and useMemo appropriately
3. **Bundle Splitting**: Split code by routes and features
4. **Image Optimization**: Use WebP format and lazy loading

### Security Best Practices

1. **Input Validation**: Validate all user inputs
2. **Environment Variables**: Never commit sensitive data
3. **HTTPS**: Use HTTPS in all environments
4. **Authentication**: Implement proper session management

### Testing Best Practices

1. **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E
2. **Test Isolation**: Tests should not depend on each other
3. **Mock External Dependencies**: Mock APIs and external services
4. **Descriptive Names**: Test names should describe the behavior

## 🎯 Next Steps

1. **Set up your development environment** using this guide
2. **Review the [Architecture](./ARCHITECTURE.md)** to understand the system design
3. **Read the [Testing Guide](./TESTING.md)** for testing best practices
4. **Check the [Production Roadmap](./PRODUCTION_ROADMAP.md)** for upcoming changes
5. **Start contributing** by picking up issues from the project board

---

*Happy coding! 🚀* 