# Pull Request Details

## Branch
**Source:** `cursor/create-next-steps-build-plan-7d93`  
**Target:** `main`

## PR Title
```
feat: Sentry integration and OpenTelemetry monitoring setup
```

## PR Description

```markdown
## Summary

This PR integrates Sentry error tracking and OpenTelemetry performance monitoring for FlipMyEra.

## Changes

### Sentry Integration
- ✅ Added Sentry loader script to `index.html` for early error capture
- ✅ Configured Sentry SDK with DSN support
- ✅ Added `sendDefaultPii` configuration option
- ✅ Set up error filtering to protect sensitive data

### OpenTelemetry Integration
- ✅ Installed OpenTelemetry packages for browser instrumentation
- ✅ Created OpenTelemetry initialization in `src/core/integrations/opentelemetry.ts`
- ✅ Automatic instrumentation for:
  - HTTP fetch requests
  - XMLHttpRequest calls
  - Document load performance
  - User interactions (clicks, keyboard events)
- ✅ Configured to send traces to Sentry OTLP endpoint

### Code Quality
- ✅ Fixed duplicate imports in `App.tsx`
- ✅ Updated `.env.example` with new environment variables

## Environment Variables Required

Add these to Netlify before deploying:

1. **VITE_SENTRY_DSN** - Sentry DSN for error tracking
2. **VITE_OTLP_ENABLED** - Set to `true` to enable OpenTelemetry
3. **VITE_OTLP_ENDPOINT** - Sentry OTLP endpoint URL
4. **VITE_SENTRY_SEND_DEFAULT_PII** (optional) - Enable PII collection

## Documentation

- Created setup guides for Sentry and OpenTelemetry
- Updated environment variable documentation

## Testing

- ✅ No linter errors
- ✅ All changes tested locally
- ⚠️ Requires environment variables in production to activate

## Related

- Sentry loader script: https://js.sentry-cdn.com/795b1c31933c205555ef8ca0565d0bd7.min.js
- OpenTelemetry OTLP endpoint configured
```

## Commits Included

The following commits will be included in this PR:

1. `c886cef` - feat: Add Sentry loader script for early error capture
2. `187119a` - feat: Integrate OpenTelemetry for performance monitoring
3. `a92920c` - feat: Configure Sentry error tracking and PII settings
4. `224524b` - feat: Add Sentry DSN setup guide
5. `4845317` - feat: Add next steps build plan and summary
6. `46fe364` - Add script to fix GitHub CLI permissions
7. `5344a13` - docs: Add GitHub CLI permissions setup guide
8. `62528a5` - Add documentation for applying Supabase migrations
9. `736aa9f` - feat: Implement production readiness improvements
10. `1c61d53` - feat: Complete Sentry integration with @sentry/react and @sentry/tracing
11. `f40bf6f` - feat: Enhanced production readiness with rate limiting, timeouts, and monitoring
12. `627a36d` - Refactor: Improve error handling and logging
13. `b2422dd` - feat: Integrate Sentry and enhance security
14. `632e472` - Refactor: Improve security and AI integration

## How to Create the PR

### Option 1: Via GitHub Web UI
1. Go to: https://github.com/TrendpilotAI/flip-my-era
2. Click "Pull requests" → "New pull request"
3. Select base: `main` and compare: `cursor/create-next-steps-build-plan-7d93`
4. Copy the PR description from above
5. Click "Create pull request"

### Option 2: Via GitHub CLI (after fixing permissions)
```bash
gh pr create --base main --head cursor/create-next-steps-build-plan-7d93 \
  --title "feat: Sentry integration and OpenTelemetry monitoring setup" \
  --body-file PR_DETAILS.md
```

### Option 3: Direct URL
https://github.com/TrendpilotAI/flip-my-era/compare/main...cursor/create-next-steps-build-plan-7d93
