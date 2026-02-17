# Netlify Sentry Plugin Fix

## ⚠️ Important Update
**The `@sentry/netlify-build-plugin` has been ARCHIVED/DEPRECATED by Netlify.** It's no longer maintained and should be removed.

## Problem
The Netlify build is failing because the Sentry Netlify build plugin (`@sentry/netlify-build-plugin`) is trying to create a release but `SENTRY_AUTH_TOKEN` is missing or invalid. Since the plugin is deprecated, **the recommended solution is to remove it**.

## Solution Options

### ✅ Option 1: Remove Sentry Plugin (RECOMMENDED - Plugin is deprecated)

**This is the recommended solution** since the plugin is archived:

1. **Go to Netlify Dashboard:**
   - Navigate to your site
   - Go to **Site configuration** → **Plugins**
   - Find **"Sentry"** or **"@sentry/netlify-build-plugin"** in the list
   - Click **"Remove"** or **"Uninstall"**

2. **Redeploy:**
   - Trigger a new deployment
   - The build should now succeed

**Note:** Sentry error tracking will still work perfectly via the Sentry SDK in your code. The plugin only handled release creation, which is optional.

### Option 2: Add Sentry Auth Token (Only if you need release tracking)

**Note:** This option requires maintaining a deprecated plugin. Option 1 is recommended.

1. **Get a Sentry Auth Token:**
   - Go to [Sentry.io](https://sentry.io)
   - Navigate to **Settings** → **Auth Tokens**
   - Click **"Create New Token"**
   - Name it (e.g., "Netlify Build Plugin")
   - Select scopes: `project:releases`, `org:read`, `project:write`
   - Click **"Create Token"**
   - Copy the token (you won't see it again!)

2. **Add to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Select your site
   - Go to **Site configuration** → **Environment variables**
   - Click **"Add variable"**
   - **Key:** `SENTRY_AUTH_TOKEN`
   - **Value:** Paste your token
   - **Scopes:** ✅ Production (and optionally Deploy previews)
   - Click **"Save"**

3. **Redeploy:**
   - Trigger a new deployment
   - The build should now succeed

## What Each Option Does

- **Option 1 (Recommended):** Removes the deprecated plugin - errors will still be captured by Sentry SDK, but releases won't be automatically created
- **Option 2:** Enables Sentry release tracking - each deployment creates a release in Sentry, making it easier to track which deployment introduced errors (requires maintaining deprecated plugin)

## Current Status

✅ **The Sentry SDK is still configured and will capture errors in production.** The plugin only handled release creation, which is optional for error tracking.

⚠️ **The plugin is deprecated** - Netlify recommends using Sentry's AWS Lambda integration for Netlify Functions error tracking instead.

## Verification

After applying either solution:
1. Trigger a new deployment
2. Check the build logs - it should complete successfully
3. Visit your site and verify it's working
4. (If Option 2) Check Sentry dashboard - you should see a new release created

