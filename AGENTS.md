# Flip My Era Development Guidelines

## Build/Lint/Test
- Build: `vite build`
- Lint: `eslint . --ext .ts,.tsx`
- Typecheck: `tsc --noEmit`
- Test: `vitest`
- Single test: `vitest src/modules/story/services/ai.test.ts`

## Code Style
- Use TypeScript strict mode
- Tailwind classes in order: `container`, `max-w-`, `px-`, `py-`, `mt-`, `mb-`
- Components: PascalCase, hooks: `use` prefix
- Shadcn/ui components must be imported from `@/modules/shared/components/ui`
- API calls use `@/core/api/client`
- Always include `useClerkAuth()` for protected routes
- Error handling: use `useToast()` for user-facing errors
- Supabase functions require JWT validation in edge functions

## Rules
- No custom auth - use ClerkAuthContext
- Supabase queries must use RLS policies
- Credit operations require balance validation
- Video/ebook generation must handle streaming responses
- Admin features require `isAdmin` check in ClerkAuthContext

## Cursor Rules
- Follow .cursorrules project structure
- Use `@/modules/` for feature isolation
- Maintain JWT integration between Clerk and Supabase