# FlipMyEra - Linear Project Summary

## Project Overview

**FlipMyEra** is an AI-powered storytelling platform that transforms user stories into beautifully crafted, era-specific narratives with professional illustrations. The platform creates e-books inspired by Taylor Swift's musical eras, targeting teenage fans (13-19 years old) interested in creative writing.

## Core Value Proposition

Multi-step wizard that guides users from ERA selection through story generation, producing professional-quality illustrated e-books (1,000-25,000 words) with real-time streaming generation.

## Target Audience

**Primary**: Teenage Taylor Swift fans (13-19 years old) - "Swifties" who love storytelling and creative expression
**Secondary**: Parents, educators, content creators, and anyone interested in AI-enhanced creative writing

## Key Features

- **7 Taylor Swift-Inspired ERAs**: Showgirl, Folklore/Evermore, 1989, Red, Reputation, Lover, Midnights
- **AI Story Generation**: Uses Groq API for storyline and chapter generation with real-time streaming
- **Professional E-Books**: Illustrated e-books with album-inspired layouts and beautiful typography
- **AI-Generated Illustrations**: FLUX 1.1 Pro model via Runware SDK for era-specific imagery
- **Multi-Step Wizard**: Hero Gallery → ERA Selection → Story Prompts → Character Archetype → Story Details → Storyline Preview → Format Selection → Generation
- **Credit-Based System**: Users purchase credits to generate e-books ($2.99 per e-book)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (dev server on port 8081)
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- TanStack Query for data fetching

**Backend:**
- Supabase (PostgreSQL, Edge Functions, Storage)
- Clerk for authentication (Google OAuth)
- Supabase Edge Functions (Deno runtime)

**AI Services:**
- Groq API (story/storyline generation)
- Runware SDK (image generation with FLUX 1.1 Pro)
- Runway AI (Seedream 4 model for ERA images)

**Deployment:**
- Netlify (frontend)
- Supabase (backend/database)

## Architecture

Feature-module architecture under `src/modules/`:
- `auth/` - Clerk authentication integration
- `story/` - Core story generation wizard, ERA system, streaming
- `ebook/` - E-book generation, chapter display, PDF export
- `user/` - User profiles, dashboard, credit management
- `admin/` - Admin panels, credit management, analytics
- `shared/` - Reusable components, utilities, services

## Business Model

- **Monetization**: Credit-based system ($2.99 per e-book generation)
- **Formats**: Preview (free), Short Story (paid), Novella (higher cost)
- **Admin Panel**: Manual credit adjustments and usage analytics

## Current Status

- ✅ Production-ready application
- ✅ 95% test pass rate (156/164 tests passing)
- ✅ Real-time streaming story generation
- ✅ Credit system and payment integration
- ✅ Admin dashboard for credit management
- ✅ Sentry error tracking
- ✅ PostHog analytics integration

## Development

- **Local Dev**: `npm run dev` (localhost:8081)
- **Testing**: Vitest with 95% pass rate
- **Type Checking**: TypeScript strict mode
- **Supabase Local**: `supabase start` (port 54321)

---

*FlipMyEra: Where your stories meet their perfect era* ✨

