# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                 # Start dev server on port 8081 with Supabase proxy
npm run build              # Production build
npm run build:dev          # Development build
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript checks
npm test                   # Run tests with Vitest
npm run test:ui            # Run tests with UI
npm run test:coverage      # Run tests with coverage

# Supabase
supabase start             # Start local Supabase (port 54321)
supabase stop              # Stop local Supabase
supabase db reset          # Reset database with migrations
```

## Project Architecture

FlipMyEra is a React/TypeScript application for AI-powered story generation with e-book creation capabilities. 

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Clerk (JWT integration with Supabase)
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Payment**: Stripe integration
- **AI Services**: Groq for text generation, FLUX 1.1 Pro for images

### Module Structure
The codebase uses a modular architecture in `src/modules/`:

- **auth/**: Clerk authentication components and contexts
- **ebook/**: E-book generation components and streaming chapters
- **story/**: Story generation with personality-based prompts
- **user/**: User dashboard, credit management, profile settings
- **shared/**: Common UI components, layouts, utilities

### Authentication Flow
- Clerk handles OAuth and JWT tokens
- Custom `ClerkAuthContext` provides `useClerkAuth()` hook
- JWT tokens authenticate with Supabase Edge Functions
- Credit system managed through Supabase functions

### Key Features
- Real-time streaming story/chapter generation
- Credit-based premium features ($2.99 per e-book)
- Taylor Swift-inspired themes and personalities
- Professional e-book formatting with AI-generated images
- Admin dashboard for user/credit management

### Database Schema (Supabase)
- `profiles`: User profiles with subscription status and credits
- `stories`: Generated stories with metadata
- `ebook_generations`: E-book generation tracking
- `tiktok_shares`: Social sharing analytics
- `user_activities`: Activity logging

### Development Environment
- Vite dev server proxies to Supabase local instance (port 54321)
- CORS configured for API endpoints `/api/functions`, `/api/rest`
- Environment variables for Clerk, Supabase, Stripe, AI services

### Important Patterns
- All new components should use TypeScript
- Use `useClerkAuth()` for authentication state
- Import UI components from `@/modules/shared/components/ui/`
- API calls use Supabase client from `@/core/integrations/supabase/client`
- Form handling uses React Hook Form with Zod validation
- Error handling with toast notifications via `useToast()`
- Edge Functions use `Deno.serve()` with JWT validation

### Path Aliases
- `@/*` maps to `src/*`
- `@core/*` maps to `src/core/*`

### Testing
- Vitest for unit tests
- React Testing Library for component tests
- Coverage reporting available