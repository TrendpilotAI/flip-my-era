# Production Secrets Quick Checklist

## ✅ VERIFIED: Current Status

### Supabase Edge Functions Secrets (Server-Side) ✅
All secrets are correctly configured in Supabase Edge Functions:
- ✅ `GROQ_API_KEY` - Set in Supabase
- ✅ `RUNWARE_API_KEY` - Set in Supabase  
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Set in Supabase
- ✅ `STRIPE_SECRET_KEY` - Set in Supabase (if using Stripe)
- ✅ `STRIPE_WEBHOOK_SECRET` - Set in Supabase (if using Stripe)
- ✅ `BREVO_API_KEY` - Set in Supabase (if using email)
- ✅ `ELEVEN_LABS_API_KEY` - Set in Supabase (if using TTS)
- ✅ `TIKTOK_CLIENT_KEY` - Set in Supabase (if using TikTok)
- ✅ `TIKTOK_CLIENT_SECRET` - Set in Supabase (if using TikTok)
- ✅ `CLERK_JWT_KEY` - Configured in Supabase Dashboard

### Netlify Public Keys (Client-Side Safe) ✅
All public keys are correctly configured in Netlify:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- ✅ `VITE_CLERK_PUBLISHABLE_KEY`
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY`
- ✅ `VITE_CLOUDFLARE_SITE_KEY`
- ✅ `VITE_POSTHOG_KEY`
- ✅ `VITE_PUBLIC_POSTHOG_KEY`
- ✅ `VITE_PUBLIC_POSTHOG_HOST`
- ✅ `VITE_SENTRY_DSN`
- ✅ `VITE_RUNWARE_PROXY_URL`
- ✅ `VITE_SAMCART_CHECKOUT_ENDPOINT`

---

## ✅ COMPLETED: Secret Keys Removed from Netlify

These secret keys have been **successfully removed** from Netlify:

1. ✅ **`VITE_GROQ_API_KEY`** → Removed, using `GROQ_API_KEY` in Supabase only
2. ✅ **`VITE_OPENAI_API_KEY`** → Removed, using `OPENAI_API_KEY` in Supabase only (if needed)
3. ✅ **`VITE_RUNWARE_API_KEY`** → Removed, using `RUNWARE_API_KEY` in Supabase only
4. ✅ **`VITE_SUPABASE_SECRET_KEY`** → Removed, using `SUPABASE_SERVICE_ROLE_KEY` in Supabase only
5. ✅ **`VITE_SUPABASE_JWT_SECRET`** → Removed, configured in Supabase Dashboard only
6. ✅ **`VITE_CLOUDFLARE_SECRET_KEY`** → Removed (if it existed)

---

## 🔍 Verification Commands

### Check Supabase Secrets
```bash
supabase secrets list
```

### Set Missing Supabase Secrets
```bash
supabase secrets set GROQ_API_KEY=your_key
supabase secrets set RUNWARE_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
# ... etc
```

### Verify Client-Side Code
```bash
# Search for any secret key references in client code
grep -r "VITE_GROQ_API_KEY\|VITE_OPENAI_API_KEY\|VITE_RUNWARE_API_KEY" src/
# Should only find deprecated functions that return undefined in production
```

---

## 📋 Final Checklist

- [x] All Supabase Edge Functions have required secrets set
- [x] All public keys are in Netlify
- [x] Client-side code doesn't use secret keys
- [x] **Removed `VITE_*` secret keys from Netlify** ✅ COMPLETED
- [x] Netlify secrets scanning configured
- [x] Deprecated functions return `undefined` in production

---

**Status**: ✅ **PRODUCTION READY** - All secrets correctly configured!

