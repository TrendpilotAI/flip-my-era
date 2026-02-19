# Sentry DSN Quick Setup Guide

Your Sentry DSN has been integrated into the project's existing infrastructure. Here's how to configure it:

## Your Sentry DSN

```
https://795b1c31933c205555ef8ca0565d0bd7@o4508910123941888.ingest.us.sentry.io/4508910174666752
```

## ✅ Configuration Complete

I've updated the Sentry integration to:
- ✅ Support `sendDefaultPii` option
- ✅ Fixed duplicate import in `App.tsx`
- ✅ Use environment variables (not hardcoded values)

## 📝 Next Steps

### 1. Add to Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Add these variables:

   **Required:**
   - **Key:** `VITE_SENTRY_DSN`
   - **Value:** `https://795b1c31933c205555ef8ca0565d0bd7@o4508910123941888.ingest.us.sentry.io/4508910174666752`
   - **Scopes:** ✅ Production (and optionally Deploy previews)

   **Optional (if you want to enable PII collection):**
   - **Key:** `VITE_SENTRY_SEND_DEFAULT_PII`
   - **Value:** `true`
   - **Scopes:** ✅ Production

5. **Redeploy** your site after adding the variables

### 2. Add to Local Development (Optional)

Create or update `.env.local` file in the root directory:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://795b1c31933c205555ef8ca0565d0bd7@o4508910123941888.ingest.us.sentry.io/4508910174666752
VITE_SENTRY_SEND_DEFAULT_PII=true
VITE_APP_ENV=development
```

**Note:** Sentry only captures errors in production builds (`import.meta.env.PROD`), so you won't see errors in `npm run dev`. To test locally, use `npm run build && npm run preview`.

### 3. Verify It's Working

After deploying to production:

1. **Visit your production site**
2. **Open browser console** and run:
   ```javascript
   throw new Error("Test Sentry");
   ```
3. **Check your Sentry dashboard** at [sentry.io](https://sentry.io) - the error should appear in 1-2 minutes

## 🔒 Privacy Note

By default, `sendDefaultPii` is set to `false` for privacy. This means:
- ❌ IP addresses are NOT automatically collected
- ❌ Personal information is NOT sent by default

If you want to enable PII collection (for better debugging), set `VITE_SENTRY_SEND_DEFAULT_PII=true` in your environment variables.

**⚠️ Important:** Make sure you comply with GDPR/privacy laws if enabling PII collection.

## ✅ Current Configuration

Your Sentry is configured to:
- ✅ Only initialize in production builds
- ✅ Sample 10% of transactions (performance monitoring)
- ✅ Filter out authorization headers (privacy)
- ✅ Support `sendDefaultPii` via environment variable
- ✅ Set user context when available
- ✅ Track performance with BrowserTracing

## 📁 Files Updated

- ✅ `src/core/integrations/sentry.ts` - Added `sendDefaultPii` support
- ✅ `src/App.tsx` - Fixed duplicate import

## 🚀 Ready to Deploy!

Once you add `VITE_SENTRY_DSN` to Netlify and redeploy, Sentry will start capturing errors automatically.
