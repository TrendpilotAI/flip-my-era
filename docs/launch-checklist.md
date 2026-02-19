# FlipMyEra — Pre-Launch Checklist

> Generated 2026-02-17. Audited against codebase.

## Infrastructure

- [ ] **DNS + SSL configured on Netlify** — ⚠️ NEEDS VERIFICATION: `netlify.toml` has CSP referencing `clerk.flipmyera.com`, suggesting custom domain is configured. Verify SSL cert is active in Netlify dashboard.
- [x] **Sentry DSN configured for production** — ✅ DONE: `src/core/integrations/sentry.ts` initializes Sentry. `VITE_SENTRY_DSN` in `.env.example`. Multiple docs confirm setup (`SENTRY_DSN_CONFIGURED.md`, `SENTRY_SETUP_GUIDE.md`). CSP allows `*.sentry.io`.
- [ ] **Supabase production project (not dev)** — ⚠️ NEEDS VERIFICATION: Code uses `VITE_SUPABASE_URL` env var. Confirm this points to a production Supabase project, not a dev/staging instance.
- [ ] **Stripe production keys (not test)** — ⚠️ NEEDS ACTION: `VITE_STRIPE_PUBLISHABLE_KEY` is referenced. Ensure production keys (`pk_live_*`) are set in Netlify env vars, not test keys (`pk_test_*`). Remove `/test-credits` route before launch.
- [ ] **Clerk production instance** — ⚠️ NEEDS VERIFICATION: CSP references `clerk.flipmyera.com` (good — custom domain). Confirm Clerk dashboard is on Production instance, not Development.
- [ ] **Environment variables all set** — ⚠️ NEEDS VERIFICATION: Check Netlify env vars match `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `VITE_SENTRY_DSN`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_POSTHOG_KEY`/`VITE_PUBLIC_POSTHOG_KEY`, `VITE_RUNWARE_PROXY_URL`, `VITE_CLOUDFLARE_SITE_KEY`.

## Security

- [ ] **RLS policies enabled on all tables** — ⚠️ NEEDS VERIFICATION: `docs/rls-audit.md` documents recommended policies for `profiles`, `books`, `stories`, `chapters`, `chapter_images`, `credits`, `subscriptions`, `payments`. Verify these are ENABLED in Supabase dashboard (not just documented).
- [ ] **Service role key not exposed in frontend** — ⚠️ AUDIT: `.env.example` lists `VITE_SUPABASE_SERVICE_ROLE_KEY` — this should NOT be in the frontend build. Confirm it's only used server-side (edge functions). Remove from `.env.example` if not needed client-side.

## Monitoring & Analytics

- [x] **Error tracking (Sentry) verified** — ✅ DONE: `ErrorBoundary` component wraps app, Sentry integration in `src/core/integrations/sentry.ts`, OpenTelemetry integration also present.
- [x] **Analytics (PostHog) verified** — ✅ DONE: `src/core/integrations/posthog.ts` exists. AB testing in `src/core/analytics/abTest.ts`. Event tracking in `src/core/analytics/events.ts`. CSP allows PostHog domains.
- [x] **Performance monitoring** — ✅ DONE: `performanceMonitor.init()` called in App.tsx.

## Legal & Compliance

- [x] **Terms of Service page** — ✅ DONE (just created): `/terms` route added.
- [x] **Privacy Policy page** — ✅ DONE (just created): `/privacy` route added.
- [ ] **Cookie consent banner** — ⚠️ NEEDS ACTION: PostHog and analytics are active but no cookie consent banner found in codebase. Required for GDPR compliance.

## Code Quality

- [ ] **Remove test/debug routes** — ⚠️ NEEDS ACTION: `/test-credits` route should be removed or gated behind admin before production launch.
- [ ] **Build passes clean** — Run `npx vite build` and verify no warnings.
- [ ] **Tests pass** — Run `npx vitest run` and verify all green.

## Marketing

- [ ] **Product Hunt listing prepared** — See `docs/launch-content.md`
- [ ] **Social media announcements ready** — See `docs/launch-content.md`
- [ ] **Landing page copy finalized** — Review `src/app/pages/Index.tsx`

## Post-Launch

- [ ] **Monitoring dashboard set up** (Sentry alerts, PostHog dashboards)
- [ ] **Stripe webhook endpoint verified** (checkout.session.completed, etc.)
- [ ] **Backup strategy for Supabase** (Point-in-time recovery enabled)
- [ ] **Rate limiting on edge functions**
