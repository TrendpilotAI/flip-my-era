# Sentry DSN Setup Guide

This guide walks you through finding your Sentry DSN and adding it to Netlify.

---

## Step 1: Create or Access Your Sentry Account

### If you don't have a Sentry account:
1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up for a free account (free tier includes 5,000 events/month)
3. Choose your organization name

### If you already have an account:
1. Log in at [https://sentry.io/login/](https://sentry.io/login/)

---

## Step 2: Create a Sentry Project (if needed)

1. **After logging in**, you'll see the dashboard
2. **Click "Create Project"** or navigate to **Projects** in the sidebar
3. **Select Platform**: Choose **"React"**
4. **Project Details**:
   - **Name**: Enter a name (e.g., "FlipMyEra" or "Flip My Era Production")
   - **Platform**: Should be pre-selected as "React"
5. **Click "Create Project"**

---

## Step 3: Find Your Sentry DSN

Once your project is created, you'll be shown a **DSN (Data Source Name)**. It looks like this:

```
https://[your-key]@[your-org].ingest.sentry.io/[project-id]
```

### If you need to find it later:

1. **Navigate to your project** in Sentry dashboard
2. Go to **Settings** → **Projects** → **[Your Project Name]**
3. Click on **"Client Keys (DSN)"** in the left sidebar
4. You'll see your DSN listed
5. **Click the copy icon** next to the DSN to copy it

**Example DSN format:**
```
https://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5@o123456.ingest.sentry.io/7890123456
```

---

## Step 4: Add DSN to Netlify Environment Variables

### Method 1: Through Netlify Dashboard (Recommended)

1. **Log in to Netlify**: Go to [https://app.netlify.com](https://app.netlify.com)

2. **Select Your Site**:
   - Click on your site name from the dashboard
   - Or navigate to **Sites** → **[Your Site Name]**

3. **Navigate to Site Settings**:
   - Click **"Site configuration"** in the top menu
   - Then click **"Environment variables"** in the left sidebar
   - Or go directly: **Site Settings** → **Build & deploy** → **Environment**

4. **Add the Environment Variable**:
   - Click **"Add variable"** or **"Add a variable"** button
   - **Key**: Enter `VITE_SENTRY_DSN` (exactly as shown, case-sensitive)
   - **Value**: Paste your Sentry DSN (the full URL you copied)
   - **Scopes**: 
     - ✅ Check **"Production"** for production builds
     - ✅ Check **"All scopes"** if you want it in all environments
     - Optional: Check **"Deploy previews"** if you want to test Sentry in preview deployments
   - Click **"Save"**

5. **Redeploy Your Site** (Important!):
   - After adding the variable, you need to trigger a new deployment
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or push a new commit to trigger automatic deployment

### Method 2: Through netlify.toml (Not Recommended for Secrets)

⚠️ **Warning**: Don't add your DSN directly in `netlify.toml` as it will be committed to git. Use the dashboard method above instead.

However, if you need to reference it, you can add a placeholder:

```toml
[build.environment]
  VITE_SENTRY_DSN = "your-dsn-here"  # ⚠️ Only for local dev, use dashboard for production
```

---

## Step 5: Verify Sentry is Working

### Option 1: Test Error Capture (Recommended)

1. **After deployment**, visit your production site
2. **Open browser console** (F12 → Console tab)
3. **Manually trigger a test error** by running:
   ```javascript
   throw new Error("Test Sentry error");
   ```
4. **Check Sentry Dashboard**:
   - Go to [https://sentry.io](https://sentry.io)
   - Navigate to your project
   - Click **"Issues"** in the sidebar
   - You should see your test error appear (may take 1-2 minutes)

### Option 2: Test with Real Application Error

1. Navigate to your deployed site
2. Try to trigger a real error (e.g., invalid API call, broken feature)
3. Check Sentry dashboard for the error

### Option 3: Check Browser Network Tab

1. Open browser DevTools → **Network** tab
2. Filter by **"sentry"**
3. Look for requests to `sentry.io` - if you see them, Sentry is initialized

---

## Step 6: Optional - Set Environment Variable

Your code also checks for `VITE_APP_ENV` to set the environment name in Sentry. You can optionally add this:

1. In Netlify Environment Variables:
   - **Key**: `VITE_APP_ENV`
   - **Value**: `production` (or `staging` for staging sites)
   - **Scopes**: Production (or appropriate scope)

**Note**: This is optional. If not set, it defaults to `'development'`, but Sentry will only be enabled in production builds anyway (due to `import.meta.env.PROD` check).

---

## Verification Checklist

- [ ] Sentry account created
- [ ] Sentry project created (React platform)
- [ ] DSN copied from Sentry dashboard
- [ ] `VITE_SENTRY_DSN` added to Netlify environment variables
- [ ] Variable scoped to "Production" (and optionally "Deploy previews")
- [ ] Site redeployed after adding the variable
- [ ] Test error appears in Sentry dashboard

---

## Troubleshooting

### Sentry not capturing errors?

1. **Check environment variable name**: Must be exactly `VITE_SENTRY_DSN` (case-sensitive)
2. **Verify deployment**: Make sure you redeployed after adding the variable
3. **Check build logs**: Look for any errors related to Sentry in Netlify build logs
4. **Browser console**: Check for Sentry initialization messages or errors
5. **DSN format**: Make sure you copied the entire DSN URL, including `https://`
6. **Environment**: Sentry only initializes in production builds (`import.meta.env.PROD`)

### Testing locally?

For local development, create a `.env.local` file:

```bash
VITE_SENTRY_DSN=https://your-dsn@your-org.ingest.sentry.io/your-project-id
VITE_APP_ENV=development
```

**Note**: Sentry will still only capture errors when `import.meta.env.PROD` is true, which is only in production builds. For local testing, you may need to temporarily modify the code or use `npm run build` instead of `npm run dev`.

### Can't find DSN in Sentry?

1. Make sure you're in the correct project
2. Go to: **Settings** → **Projects** → **[Project Name]** → **Client Keys (DSN)**
3. If you don't see it, you may need to create a new project or check permissions

---

## Current Configuration

Your Sentry setup is configured to:
- ✅ Only initialize in production builds
- ✅ Sample 10% of transactions (performance monitoring)
- ✅ Filter out authorization headers (privacy)
- ✅ Set user context when available
- ✅ Track performance with BrowserTracing

**Files using Sentry:**
- `src/core/integrations/sentry.ts` - Main Sentry service
- `src/App.tsx` - Initializes Sentry on app start
- `src/modules/shared/components/ErrorBoundary.tsx` - Captures React errors
- `src/core/utils/logger.ts` - Logs errors to Sentry
- `src/core/utils/performance.ts` - Sends performance breadcrumbs

---

## Next Steps

After setting up Sentry:

1. ✅ Deploy to production
2. ✅ Monitor Sentry dashboard for errors
3. ✅ Set up alerts (optional): Sentry → Settings → Alerts
4. ✅ Configure release tracking (optional): Add version info to Sentry

---

## Quick Reference

**Environment Variable Name:** `VITE_SENTRY_DSN`  
**Sentry Dashboard:** [https://sentry.io](https://sentry.io)  
**Netlify Dashboard:** [https://app.netlify.com](https://app.netlify.com)  
**DSN Format:** `https://[key]@[org].ingest.sentry.io/[project-id]`

---

**Need Help?**
- Sentry Docs: [https://docs.sentry.io/platforms/javascript/guides/react/](https://docs.sentry.io/platforms/javascript/guides/react/)
- Netlify Docs: [https://docs.netlify.com/environment-variables/overview/](https://docs.netlify.com/environment-variables/overview/)
