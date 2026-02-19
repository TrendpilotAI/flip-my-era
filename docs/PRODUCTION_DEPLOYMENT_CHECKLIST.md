# Production Deployment Checklist

## Pre-Deployment Verification

### Step 1: Configure Sentry DSN (30 minutes)

#### 1.1 Get Sentry DSN
- [ ] Log into [Sentry.io dashboard](https://sentry.io)
- [ ] Navigate to: **Settings** → **Projects** → Select your project → **Client Keys (DSN)**
- [ ] Copy the DSN URL (format: `https://[key]@[org].ingest.sentry.io/[project-id]`)
- [ ] Verify DSN starts with `https://`

#### 1.2 Add to Netlify Environment Variables
- [ ] Go to [Netlify Dashboard](https://app.netlify.com)
- [ ] Select your site
- [ ] Navigate to: **Site Settings** → **Environment Variables**
- [ ] Click **Add a variable**
- [ ] Add the following:
  - **Key**: `VITE_SENTRY_DSN`
  - **Value**: [Paste your Sentry DSN URL]
  - **Scopes**: Select **Production** (and **Staging** if you have one)
- [ ] Click **Save**

#### 1.3 Verify Sentry Configuration Code
- [x] ✅ Verified: `src/core/integrations/sentry.ts` line 176 reads `VITE_SENTRY_DSN`
- [x] ✅ Verified: `src/App.tsx` line 30 calls `initSentry()`
- [x] ✅ Verified: Sentry only enables in production (line 188: `enabled: import.meta.env.PROD`)

**Code Verification Complete** - No changes needed.

---

### Step 2: Verify Required Environment Variables

#### 2.1 Netlify Environment Variables Checklist
Verify all required variables are set in Netlify:

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `VITE_SENTRY_DSN` - Sentry DSN (from Step 1.2)
- [ ] `VITE_APP_ENV` - Set to `production` for production environment

**Optional but Recommended:**
- [ ] `VITE_SENTRY_SEND_DEFAULT_PII` - Set to `false` (default) for privacy

#### 2.2 Supabase Edge Function Secrets Checklist
Verify in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- [ ] `GROQ_API_KEY` - Groq API key for story generation
- [ ] `OPENAI_API_KEY` - OpenAI API key (if used)
- [ ] `RUNWARE_API_KEY` - Runware API key (if used)
- [ ] `CLERK_SECRET_KEY` - Clerk secret key for JWT verification

#### 2.3 Supabase Database Checklist
Verify in Supabase Dashboard:

- [ ] All migrations applied (check Migration History)
- [ ] RLS (Row Level Security) policies enabled
- [ ] Edge Functions deployed and active:
  - [ ] `groq-api`
  - [ ] `groq-storyline`
  - [ ] `stream-chapters`
  - [ ] `credits-validate`
  - [ ] `ebook-generation`
  - [ ] `admin-credits`
  - [ ] `stripe-webhook` (if using Stripe)
  - [ ] `webhook-retry-processor` (if using webhook retry)

---

### Step 3: Deploy to Production

#### 3.1 Trigger Deployment
Choose one method:

**Option A: Automatic Deployment (Recommended)**
- [ ] Push to `main` branch
- [ ] Netlify will automatically trigger deployment
- [ ] Monitor deployment in Netlify dashboard

**Option B: Manual Deployment**
- [ ] Go to Netlify Dashboard → **Deploys**
- [ ] Click **Trigger deploy** → **Deploy site**
- [ ] Wait for build to complete

#### 3.2 Verify Build Success
- [ ] Check Netlify build logs for errors
- [ ] Verify build completes successfully
- [ ] Note the deployment URL

---

### Step 4: Basic Smoke Test (15 minutes)

#### 4.1 Homepage Load Test
- [ ] Visit production URL
- [ ] Verify page loads without errors
- [ ] Open browser DevTools → Console
- [ ] Check for any red errors (warnings are OK)
- [ ] Verify no Sentry initialization errors

#### 4.2 Authentication Flow Test
- [ ] Click "Sign In" button
- [ ] Complete authentication (Google OAuth or email)
- [ ] Verify redirect to `/dashboard` after authentication
- [ ] Verify user profile loads correctly

#### 4.3 Story Generation Flow Test
- [ ] Navigate to homepage (if not already there)
- [ ] Click "Choose Your Era" or start wizard
- [ ] Select an ERA (e.g., "1989")
- [ ] Select a story prompt
- [ ] Select a character archetype
- [ ] Fill in story details (name, location)
- [ ] Generate storyline (click "Generate Storyline")
- [ ] Wait for storyline to generate (should complete in < 30 seconds)
- [ ] Select format (Preview, Short Story, or Novella)
- [ ] Start story generation
- [ ] Verify at least one chapter generates successfully
- [ ] Verify progress indicators update correctly

#### 4.4 Error Tracking Verification
- [ ] Open browser DevTools → Network tab
- [ ] Intentionally trigger an error:
  - Option 1: Disconnect network during story generation
  - Option 2: Navigate to invalid URL (e.g., `/invalid-page`)
  - Option 3: Try to access protected route without auth
- [ ] Wait 1-2 minutes
- [ ] Go to [Sentry Dashboard](https://sentry.io)
- [ ] Navigate to **Issues** tab
- [ ] Verify error appears in Sentry dashboard
- [ ] Click on error to verify details are captured

#### 4.5 Console Error Check
- [ ] Review browser console for any critical errors
- [ ] Note any warnings (non-blocking)
- [ ] Verify no Sentry initialization errors
- [ ] Verify no API key exposure warnings

---

### Step 5: Post-Deployment Monitoring (24 hours)

#### 5.1 First Hour Monitoring
- [ ] Check Sentry dashboard every 15 minutes
- [ ] Review error frequency and types
- [ ] Verify user context attached to errors (if applicable)
- [ ] Check Netlify function logs for Edge Function errors
- [ ] Monitor Supabase dashboard for database issues

#### 5.2 First 24 Hours Monitoring
- [ ] Check Sentry dashboard 3-4 times throughout the day
- [ ] Monitor error rate (should be < 1% of sessions)
- [ ] Track story generation success rate (should be > 95%)
- [ ] Review performance metrics in Sentry
- [ ] Check for any user-reported issues

#### 5.3 Success Criteria
- [ ] No critical errors in first 24 hours
- [ ] Error rate < 1% of user sessions
- [ ] Story generation success rate > 95%
- [ ] No Sentry configuration errors
- [ ] All smoke tests pass

---

## Rollback Plan

If critical issues are found:

1. **Quick Rollback (Netlify)**
   - Go to Netlify Dashboard → **Deploys**
   - Find previous successful deployment
   - Click **Publish deploy** to rollback

2. **Disable Sentry Temporarily**
   - Go to Netlify → Environment Variables
   - Remove or rename `VITE_SENTRY_DSN`
   - Redeploy (Sentry will be disabled)

3. **Document Issues**
   - Create issue in GitHub or documentation
   - Note error details from Sentry
   - Plan fixes for next deployment

---

## Verification Script

Run this command to verify environment variables are set (requires Netlify CLI):

```bash
netlify env:list --context production
```

Expected output should include:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`
- `VITE_APP_ENV` = `production`

---

## Notes

- All code changes are already complete
- This checklist focuses on configuration and verification only
- Most steps are manual configuration in dashboards
- Post-launch optimizations can be done incrementally
- Monitor Sentry dashboard closely for first 24-48 hours

---

## Quick Reference Links

- **Sentry Dashboard**: https://sentry.io
- **Netlify Dashboard**: https://app.netlify.com
- **Supabase Dashboard**: https://app.supabase.com
- **Production URL**: [Your production URL here]

---

**Last Updated**: [Date]
**Status**: Ready for Production Deployment

