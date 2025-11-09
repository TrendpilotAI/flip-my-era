# Production Smoke Test Guide

## Overview
Quick smoke test to verify production deployment is working correctly. Should take approximately 15 minutes.

## Prerequisites
- Production URL accessible
- Test user account ready (or ability to create one)
- Browser DevTools access
- Sentry dashboard access

---

## Test 1: Homepage Load (2 minutes)

### Steps
1. Open production URL in browser
2. Open DevTools (F12) → Console tab
3. Wait for page to fully load

### Expected Results
- ✅ Page loads without errors
- ✅ No red errors in console
- ✅ Page displays correctly (no broken images/layout)
- ✅ Navigation menu visible and functional

### What to Check
- [ ] Page loads in < 3 seconds
- [ ] No console errors (warnings OK)
- [ ] No Sentry initialization errors
- [ ] All images load correctly

---

## Test 2: Authentication Flow (3 minutes)

### Steps
1. Click "Sign In" button
2. Complete authentication (Google OAuth recommended for speed)
3. Wait for redirect

### Expected Results
- ✅ Authentication modal/page appears
- ✅ Can complete sign-in process
- ✅ Redirects to `/dashboard` after authentication
- ✅ User profile/name displays correctly

### What to Check
- [ ] Authentication flow completes successfully
- [ ] Redirect works correctly
- [ ] User session persists
- [ ] No authentication errors in console

---

## Test 3: Story Generation Flow (8 minutes)

### Steps
1. Navigate to homepage (if not already there)
2. Click "Choose Your Era" or start wizard
3. Select an ERA (e.g., "1989" or "Midnights")
4. Select a story prompt from the list
5. Select a character archetype
6. Fill in story details:
   - Character name: "Test Character"
   - Location: "New York"
   - Gender: Keep default or select option
7. Click "Generate Storyline"
8. Wait for storyline generation (should complete in < 30 seconds)
9. Review storyline preview
10. Select format: "Preview" (fastest option)
11. Click "Generate Story" or "Start Generation"
12. Wait for at least one chapter to generate

### Expected Results
- ✅ ERA selection works
- ✅ Prompt selection works
- ✅ Character selection works
- ✅ Storyline generates successfully
- ✅ Storyline preview displays correctly
- ✅ Story generation starts
- ✅ At least one chapter generates successfully
- ✅ Progress indicators update

### What to Check
- [ ] All wizard steps complete without errors
- [ ] Storyline generates in < 30 seconds
- [ ] Storyline structure is valid (has chapters, logline, etc.)
- [ ] Story generation starts without errors
- [ ] Chapter generation progress visible
- [ ] At least one chapter completes
- [ ] No API errors in console

---

## Test 4: Error Tracking Verification (2 minutes)

### Steps
1. Open Sentry dashboard in separate tab
2. In production site, intentionally trigger an error:
   - **Option A**: Disconnect network during story generation
   - **Option B**: Navigate to invalid URL (e.g., `/this-does-not-exist`)
   - **Option C**: Try to access `/admin` without admin privileges
3. Wait 1-2 minutes
4. Check Sentry dashboard → Issues tab

### Expected Results
- ✅ Error is triggered
- ✅ Error appears in Sentry dashboard within 1-2 minutes
- ✅ Error details are captured (stack trace, context, etc.)
- ✅ Error is categorized correctly

### What to Check
- [ ] Error appears in Sentry Issues list
- [ ] Error has stack trace
- [ ] Error has context (URL, user agent, etc.)
- [ ] Error is not a Sentry configuration error

---

## Test 5: Console Error Check (1 minute)

### Steps
1. Keep DevTools Console open
2. Review all errors and warnings
3. Note any critical errors

### Expected Results
- ✅ No critical errors (red)
- ✅ Warnings are acceptable (yellow)
- ✅ No Sentry initialization errors
- ✅ No API key exposure warnings

### What to Check
- [ ] No red errors in console
- [ ] No "Sentry not initialized" errors
- [ ] No "API key" or "secret" exposure warnings
- [ ] No CORS errors
- [ ] No network errors (except intentional ones)

---

## Success Criteria Summary

All tests pass if:
- ✅ Homepage loads without errors
- ✅ Authentication flow works
- ✅ Story generation completes at least one chapter
- ✅ Errors appear in Sentry dashboard
- ✅ No critical console errors

---

## Troubleshooting

### If Homepage Doesn't Load
- Check Netlify deployment status
- Verify environment variables are set
- Check browser console for specific errors
- Verify DNS is pointing to correct Netlify site

### If Authentication Fails
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Check Clerk dashboard for application status
- Verify redirect URLs are configured in Clerk
- Check browser console for Clerk errors

### If Story Generation Fails
- Check Supabase Edge Functions are deployed
- Verify `GROQ_API_KEY` is set in Supabase secrets
- Check Supabase function logs for errors
- Verify JWT token is being passed correctly

### If Sentry Not Capturing Errors
- Verify `VITE_SENTRY_DSN` is set in Netlify
- Check Sentry dashboard for project status
- Verify DSN format is correct (starts with `https://`)
- Check browser console for Sentry initialization errors
- Verify `VITE_APP_ENV` is set to `production`

---

## Quick Test Checklist

Print this checklist for quick reference:

```
[ ] Homepage loads
[ ] No console errors
[ ] Sign in works
[ ] Dashboard loads
[ ] ERA selection works
[ ] Prompt selection works
[ ] Character selection works
[ ] Storyline generates
[ ] Storyline preview displays
[ ] Story generation starts
[ ] At least one chapter generates
[ ] Error appears in Sentry
[ ] No critical console errors
```

---

## Post-Test Actions

After completing smoke test:

1. **Document Results**
   - Note any issues found
   - Record error messages
   - Take screenshots if needed

2. **Report Issues**
   - Create GitHub issue for critical problems
   - Tag with `production` label
   - Include Sentry error links if applicable

3. **Monitor**
   - Continue monitoring Sentry dashboard
   - Check for new errors periodically
   - Review user feedback

---

**Estimated Time**: 15 minutes
**Frequency**: After each production deployment

