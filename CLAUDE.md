# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlipMyEra is a React/TypeScript application that transforms user stories into AI-generated, era-specific narratives with professional illustrations. The platform creates e-books inspired by Taylor Swift's musical eras, targeting teenage fans (13-19 years old) interested in creative writing.

**Core Value Proposition**: Multi-step wizard that guides users from ERA selection through story generation, producing professional-quality illustrated e-books.

## Essential Commands

### Development
```bash
npm run dev              # Start development server (localhost:8081)
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
```

### Type Checking & Linting
```bash
npm run typecheck        # TypeScript type checking (no emit)
npm run lint             # ESLint checking
```

### Testing
```bash
npm test                 # Run Vitest tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
```

### Utilities
```bash
npm run generate:images  # Generate ERA images using Runway API (requires VITE_RUNWAY_API_KEY)
npm run clean            # Clean dist and node_modules
```

### Supabase Local Development
```bash
supabase start           # Start local Supabase instance (port 54321)
supabase stop            # Stop local instance
supabase status          # Check service status
supabase db reset        # Reset database with migrations
```

## Architecture

### Module Structure (Feature-Based Organization)

The codebase uses a **feature-module architecture** under `src/modules/`:

- **`auth/`** - Clerk authentication integration, auth context, protected routes
- **`story/`** - Core story generation wizard, ERA system, storyline generation, streaming
- **`ebook/`** - E-book generation, chapter display, PDF export
- **`user/`** - User profiles, dashboard, credit management
- **`admin/`** - Admin panels, credit management, usage analytics
- **`shared/`** - Reusable components, utilities, and services used across modules

Each module follows this internal structure:
```
module/
├── components/      # React components
├── contexts/        # React contexts
├── hooks/          # Custom hooks
├── services/       # API/business logic
├── utils/          # Pure utility functions
├── types/          # TypeScript types
├── data/           # Static data/configs
└── index.ts        # Public exports
```

### Key Architectural Patterns

**1. ERA-Based Story Generation**
- 7 Taylor Swift-inspired eras (Showgirl, Folklore/Evermore, 1989, Red, Reputation, Lover, Midnights)
- Each ERA has unique color schemes, character archetypes (35 total), and curated story prompts (5 per ERA)
- Two-tiered prompt system: Master System Prompt + ERA-specific prompts for narrative coherence

**2. Multi-Step Wizard Flow**
- `StoryWizardContext` (`src/modules/story/contexts/`) manages state across 7 steps
- State persists to sessionStorage for refresh resilience
- Steps: Hero Gallery → ERA Selection → Story Prompts → Character Archetype → Story Details → Storyline Preview → Format Selection → Generation

**3. Storyline Generation**
- Structured three-act framework generated before full story
- Uses Groq API (`src/modules/story/services/storylineGeneration.ts`) to create:
  - Logline (one-sentence summary)
  - Three-act structure (Setup, Rising Action, Climax/Resolution)
  - Chapter outline with titles, summaries, word counts
  - Themes and total word count estimate

**4. Streaming Story Generation**
- `useStreamingGeneration` hook (`src/modules/story/hooks/`) handles real-time chapter streaming
- Backend: `supabase/functions/stream-chapters/` streams text using Groq SDK
- Frontend displays incremental updates via Server-Sent Events pattern

**5. Authentication & Authorization**
- Clerk handles authentication (Google OAuth supported)
- `ClerkAuthContext` (`src/modules/auth/contexts/`) provides `useClerkAuth` hook
- Supabase RLS (Row Level Security) enforces data access policies
- Clerk user ID syncs to Supabase `profiles` table

**6. Credit System**
- Users purchase credits for story generation
- Database tables: `credit_transactions`, `credit_usage_logs`
- Pricing varies by format: Preview (free), Short Story (paid), Novella (higher cost)
- Admin panel for manual credit adjustments

### Tech Stack Integration

**Frontend:**
- React 18 + TypeScript
- Vite (build tool, dev server on port 8081)
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- TanStack Query for data fetching

**Backend:**
- Supabase (PostgreSQL, Edge Functions, Storage)
- Clerk for authentication
- Supabase Functions use Deno runtime

**AI Services:**
- Groq API (story/storyline generation)
- Runware SDK (image generation with FLUX 1.1 Pro)
- Runway AI (Seedream 4 model for ERA images)

**Development:**
- Vitest + Testing Library for unit tests
- ESLint for linting
- Path aliases: `@/` → `src/`, `@core/` → `src/core/`

## Critical Implementation Details

### Test Setup Requirements

When writing/fixing tests, follow these patterns from `.cursorrules`:

1. **Unmocking Modules**: Global test setup mocks many dependencies. Use `vi.unmock('@/path/to/module')` at the top of test files to test real implementations.

2. **Complete Mock Interfaces**: When mocking `useClerkAuth`, include ALL properties:
   ```typescript
   const mockAuth = {
     user, isLoading, isAuthenticated, signIn, signUp, signOut,
     signInWithGoogle, refreshUser, fetchCreditBalance, getToken,
     isNewUser, setIsNewUser, SignInButton, SignUpButton, UserButton
   };
   ```

3. **Module Path Imports**: Import from `@/modules/auth/contexts` (not `@/modules/auth/contexts/ClerkAuthContext`) when mocking.

4. **Response Type Casting**: Cast mock fetch responses: `{ ok: true, json: vi.fn() } as unknown as Response`

5. **Timing Tolerance**: Add 5-10% tolerance for async timing tests to prevent flakiness.

### Prompt Loading System

ERA-specific prompts are loaded from markdown files in `Prompts/` directory:
- `promptLoader.ts` utility reads markdown at runtime (Vite configured to include `.md` as assets)
- Combine Master System Prompt with ERA prompt for full context
- Prompts currently exist for 1989 and Midnights eras (others need creation)

### Image Generation

- **Generated Images**: Stored in `src/modules/story/data/generatedImages.json`
- **Placeholder URLs**: Default to `placehold.co` if real images not generated
- **Generate Real Images**: Run `npm run generate:images` with `VITE_RUNWAY_API_KEY` set
- **Image Specs**: 3:4 aspect ratio (vertical portraits), optimized for mobile

### Supabase Function Development

Local development proxy setup in `vite.config.ts`:
- `/api/functions/*` proxies to `http://127.0.0.1:54321/functions/v1/*`
- `/api/rest/*` proxies to `http://127.0.0.1:54321/rest/v1/*`
- Must run `supabase start` before `npm run dev` for functions to work
- Functions automatically get Clerk JWT via Authorization header

### Database Schema Key Tables

- **`profiles`**: User profiles, subscription status, credit balance (synced with Clerk)
- **`stories`**: Generated stories with metadata, ERA association
- **`ebook_generations`**: E-book generation jobs and status
- **`credit_transactions`**: Credit purchases and adjustments
- **`credit_usage_logs`**: Tracks credit consumption per generation
- **`stripe_webhook_logs`**: Stripe purchase webhook logs
- **`webhook_retry_queue`**: Failed webhook retry system

### State Management Patterns

- **Global State**: React Context (ClerkAuthContext, StoryWizardContext)
- **Server State**: TanStack Query for Supabase data
- **Form State**: React Hook Form + Zod validation
- **Persistence**: SessionStorage for wizard state (survives refresh)

## Environment Variables

Required in `.env.development` or `.env.local`:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_key  # Alternative name used in some contexts

# AI Services (Managed by Admin)
VITE_GROQ_API_KEY=gsk_...
VITE_OPENAI_API_KEY=sk_...  # Currently unused, legacy

# Optional: Image Generation
VITE_RUNWAY_API_KEY=your_key
VITE_RUNWAY_API_URL=https://api.runwayml.com/v1

# Optional: E-commerce
VITE_STRIPE_API_KEY=your_key
VITE_STRIPE_MERCHANT_ID=your_merchant_id
```

## Common Development Tasks

### Running a Single Test
```bash
npm test -- path/to/test.test.tsx
```

### Testing Story Generation Locally
1. Start Supabase: `supabase start`
2. Start dev server: `npm run dev`
3. Navigate to `http://localhost:8081`
4. Complete wizard flow: ERA → Prompt → Character → Details → Storyline → Format → Generate

### Adding a New ERA
1. Add ERA config to `src/modules/story/types/eras.ts` (color, ID, title, description)
2. Create character archetypes in same file
3. Add 5 story prompts to `src/modules/story/data/storyPrompts.ts`
4. Create ERA-specific prompt markdown in `Prompts/{era}_era_prompt.md`
5. Generate ERA images: update `scripts/generate-era-images.ts` and run
6. Update `EraSelector.tsx` if needed (should auto-detect new ERA)

### Debugging Streaming Issues
- Check Supabase logs: `supabase functions serve --debug`
- Verify Groq API key is valid
- Check browser Network tab for streaming response
- Confirm Vite proxy is forwarding to local Supabase (port 54321)

### Deploying to Production
1. Set environment variables in Netlify
2. Deploy Supabase functions: `supabase functions deploy`
3. Run migrations: `supabase db push`
4. Push to main branch (auto-deploys via Netlify)
5. Verify Clerk webhook is configured

## Important Files

- **`src/App.tsx`**: Main app component, routing setup
- **`src/pages/Index.tsx`**: Landing page with StoryWizard
- **`src/modules/story/components/StoryWizard.tsx`**: Main wizard orchestrator
- **`src/modules/story/contexts/StoryWizardContext.tsx`**: Wizard state management
- **`src/modules/auth/contexts/ClerkAuthContext.tsx`**: Authentication context
- **`src/modules/story/services/storylineGeneration.ts`**: Groq storyline generation
- **`supabase/functions/stream-chapters/index.ts`**: Streaming chapter generation endpoint
- **`vite.config.ts`**: Vite configuration with Supabase proxy
- **`.cursorrules`**: Project-specific development guidelines and testing patterns

## Known Constraints

- **Birthday/Star Sign Removed**: Old personality system replaced with ERA archetypes
- **Incomplete ERA Prompts**: Only 1989 and Midnights have detailed markdown prompts
- **Image Placeholders**: Default images are placeholders; real generation requires Runway API key
- **Local Supabase Required**: Functions won't work in dev without `supabase start`
- **Port Conflict**: Dev server runs on 8081 (not default 5173) to avoid conflicts
- **Test Coverage**: Currently 85% pass rate (143 passed, 26 failed) with target of ≥60%

## Additional Resources

- **Era Implementation**: See `ERA_IMPLEMENTATION_SUMMARY.md` for complete ERA system details
- **Testing Guide**: See `.cursorrules` for comprehensive testing patterns
- **API Integration**: See `RUNWARE_SEEDREAM4_INTEGRATION.md` for image generation details
- **Database Setup**: See `verify-supabase-setup.md` for database configuration
- **Clerk Integration**: See `CLERK_SUPABASE_SETUP_GUIDE.md` for auth setup
