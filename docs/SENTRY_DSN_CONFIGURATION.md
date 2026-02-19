# Sentry DSN Configuration Guide

## Quick Setup Steps

### Step 1: Get Your Sentry DSN (5 minutes)

1. **Log into Sentry**
   - Go to https://sentry.io
   - Sign in to your account

2. **Navigate to Project Settings**
   - Click on your organization name (top left)
   - Select your project (or create a new one if needed)
   - Go to **Settings** → **Projects** → [Your Project Name]

3. **Find Client Keys (DSN)**
   - In the left sidebar, click **Client Keys (DSN)**
   - You'll see a DSN URL like:
     ```
     https://[key]@[org-id].ingest.sentry.io/[project-id]
     ```
   - Click **Copy** to copy the DSN

4. **Verify DSN Format**
   - Should start with `https://`
   - Should contain `@` symbol
   - Should end with a project ID number
   - Example: `https://795b1c31933c205555ef8ca0565d0bd7@o4508910123941888.ingest.us.sentry.io/4508910174666752`

---

### Step 2: Add to Netlify (5 minutes)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign in to your account

2. **Select Your Site**
   - Click on your FlipMyEra site

3. **Navigate to Environment Variables**
   - Go to **Site Settings** (gear icon in top navigation)
   - Click **Environment Variables** in left sidebar

4. **Add Sentry DSN**
   - Click **Add a variable** button
   - **Key**: `VITE_SENTRY_DSN` (exactly as shown, case-sensitive)
   - **Value**: Paste your Sentry DSN URL
   - **Scopes**: 
     - ✅ Check **Production**
     - ✅ Check **Staging** (if you have a staging environment)
     - ❌ Do NOT check **All scopes** (unless you want it in development too)
   - Click **Save**

5. **Verify Variable Added**
   - You should see `VITE_SENTRY_DSN` in the list
   - Value should be masked (showing only first few characters)

---

### Step 3: Verify Configuration (5 minutes)

#### Code Verification
The code is already configured correctly. Verify these files:

1. **`src/core/integrations/sentry.ts`** (Line 176)
   ```typescript
   const dsn = import.meta.env.VITE_SENTRY_DSN;
   ```
   ✅ This reads the DSN from environment variables

2. **`src/App.tsx`** (Line 30)
   ```typescript
   initSentry();
   ```
   ✅ This initializes Sentry on app startup

3. **`src/core/integrations/sentry.ts`** (Line 188)
   ```typescript
   enabled: import.meta.env.PROD, // Only enable in production
   ```
   ✅ This ensures Sentry only runs in production

#### Deployment Verification
1. **Redeploy Your Site**
   - After adding the environment variable, trigger a new deployment
   - Go to **Deploys** → **Trigger deploy** → **Deploy site**
   - Or push a commit to trigger automatic deployment

2. **Check Build Logs**
   - Watch the deployment build logs
   - Verify build completes successfully
   - No errors related to Sentry

3. **Test Error Capture**
   - Visit your production site
   - Open browser console
   - Intentionally trigger an error (e.g., navigate to `/invalid-page`)
   - Wait 1-2 minutes
   - Check Sentry dashboard → **Issues** tab
   - Error should appear

---

## Troubleshooting

### DSN Not Working

**Problem**: Errors not appearing in Sentry dashboard

**Solutions**:
1. **Verify DSN Format**
   - Must start with `https://`
   - Must contain `@` symbol
   - Check for typos or extra spaces

2. **Check Environment Variable Name**
   - Must be exactly `VITE_SENTRY_DSN` (case-sensitive)
   - No spaces before or after the name

3. **Verify Deployment**
   - Environment variables only apply to new deployments
   - Must redeploy after adding variable
   - Check deployment logs for errors

4. **Check Sentry Project**
   - Verify you're checking the correct Sentry project
   - Check project settings → **Client Keys** to confirm DSN matches

5. **Browser Console Check**
   - Open browser DevTools → Console
   - Look for Sentry initialization errors
   - Should see no errors related to Sentry

### Sentry Initialization Errors

**Problem**: Console shows "Sentry not initialized" or similar errors

**Solutions**:
1. **Check DSN is Set**
   - Verify `VITE_SENTRY_DSN` is in Netlify environment variables
   - Verify it's set for Production scope

2. **Check Production Build**
   - Sentry only initializes in production builds
   - Verify `VITE_APP_ENV=production` is set
   - Or verify Netlify is building in production mode

3. **Check Code**
   - Verify `initSentry()` is called in `src/App.tsx`
   - Verify `src/core/integrations/sentry.ts` exists and is correct

### Environment Variable Not Found

**Problem**: Build fails or DSN is undefined

**Solutions**:
1. **Check Variable Name**
   - Must be `VITE_SENTRY_DSN` (not `SENTRY_DSN` or `VITE_SENTRY_DSN_URL`)
   - Vite requires `VITE_` prefix for client-side variables

2. **Check Scope**
   - Verify variable is set for Production scope
   - Check if you need it for other scopes (Staging, Branch deploys)

3. **Redeploy**
   - Environment variables only apply to new deployments
   - Must trigger a new deployment after adding variable

---

## Verification Checklist

After configuration, verify:

- [ ] DSN copied from Sentry dashboard
- [ ] DSN format is correct (starts with `https://`)
- [ ] `VITE_SENTRY_DSN` added to Netlify environment variables
- [ ] Variable set for Production scope
- [ ] Site redeployed after adding variable
- [ ] Build completes successfully
- [ ] Test error appears in Sentry dashboard
- [ ] No Sentry errors in browser console

---

## Quick Reference

**Sentry Dashboard**: https://sentry.io  
**Netlify Dashboard**: https://app.netlify.com  
**Environment Variable Name**: `VITE_SENTRY_DSN`  
**Code Location**: `src/core/integrations/sentry.ts`  
**Initialization**: `src/App.tsx` line 30

---

## Next Steps

After configuring Sentry DSN:

1. ✅ Complete production deployment checklist
2. ✅ Run smoke tests
3. ✅ Monitor Sentry dashboard for 24 hours
4. ✅ Set up Sentry alerts (optional)
5. ✅ Review error trends weekly

---

**Estimated Time**: 15 minutes total
**Difficulty**: Easy (configuration only, no code changes)

