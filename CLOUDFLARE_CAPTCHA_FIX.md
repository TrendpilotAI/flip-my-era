# Cloudflare Captcha "Invalid Domain" Fix

## Problem
When trying to sign in or register, users encounter a Cloudflare captcha error: "Invalid domain. Contact the Site Administrator if this problem persists."

## Root Cause
This error occurs when:
1. Your Supabase project's domain configuration doesn't match your current domain
2. Cloudflare's captcha system doesn't recognize your domain
3. There's a mismatch between development and production URLs

## Solutions

### Solution 1: Use Google Sign-In (Recommended)
The easiest workaround is to use Google Sign-In instead of email/password authentication:

1. Click the "Continue with Google" button on the auth page
2. This bypasses the Cloudflare captcha entirely
3. Google Sign-In works reliably across all domains

### Solution 2: Check Your Email for Magic Link
If you attempted to sign in with email/password:
1. Check your email inbox for a magic link
2. Click the link to complete authentication
3. This method also bypasses the captcha

### Solution 3: Update Supabase Project Settings (For Developers)

#### Step 1: Update Site URL in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Update the Site URL to match your current domain:
   - Development: `http://localhost:8080`
   - Production: Your actual domain (e.g., `https://yourdomain.com`)
4. Add additional redirect URLs:
   - `http://localhost:8080/auth/callback`
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (if using port 3000)

#### Step 2: Update Environment Variables
Make sure your `.env` file has the correct URLs:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:8080  # for development
```

#### Step 3: Update Supabase Config
Update `supabase/config.toml`:

```toml
[auth]
enabled = true
site_url = "http://localhost:8080"  # Update this
additional_redirect_urls = [
  "http://localhost:8080/auth/callback",
  "https://yourdomain.com/auth/callback"
]
```

### Solution 4: Contact Supabase Support
If the issue persists:
1. Contact Supabase support with your project details
2. Provide the specific error message and domain information
3. Request domain verification for Cloudflare captcha

## Prevention
To prevent this issue in the future:
1. Always use Google Sign-In as the primary authentication method
2. Keep your Supabase project settings updated with current domains
3. Test authentication flows in both development and production environments

## Current Implementation
The app has been updated to:
1. Detect captcha/domain errors automatically
2. Show helpful error messages to users
3. Suggest Google Sign-In as an alternative
4. Provide fallback to magic link authentication
5. Display a helpful alert when issues are detected

## Testing
To test the fix:
1. Try signing in with Google (should work)
2. Try email/password sign-in (may show captcha error)
3. Check that the helpful alert appears
4. Verify that magic link fallback works 