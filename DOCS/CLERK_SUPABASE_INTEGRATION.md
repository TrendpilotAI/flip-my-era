# Clerk-Supabase Integration Guide

## Problem
The application uses Clerk for frontend authentication but Supabase Edge Functions expect Supabase JWT tokens. This causes 401 errors when trying to access protected endpoints.

## Solution
Configure Clerk to generate Supabase-compatible JWT tokens using a custom JWT template.

## Step 1: Configure Clerk JWT Template

1. Go to your Clerk Dashboard
2. Navigate to **JWT Templates**
3. Create a new template called `supabase`
4. Use the following configuration:

```json
{
  "aud": "authenticated",
  "exp": "{{exp}}",
  "iat": "{{iat}}",
  "iss": "{{iss}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "phone": "{{user.primary_phone_number.phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "email": "{{user.primary_email_address.email_address}}",
    "email_verified": "{{user.primary_email_address.verification.status}}",
    "phone_verified": "{{user.primary_phone_number.verification.status}}",
    "sub": "{{user.id}}"
  },
  "role": "authenticated"
}
```

## Step 2: Configure Supabase JWT Settings

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Find the **JWT Settings** section
4. Set the **JWT Secret** to your Clerk JWT signing key
5. Set the **JWT Expiry** to match your Clerk token expiry (default: 3600 seconds)

## Step 3: Get Clerk JWT Signing Key

1. In your Clerk Dashboard, go to **JWT Templates**
2. Click on the `supabase` template
3. Copy the **Signing Key** (starts with `sk_test_` or `sk_live_`)
4. Use this as your Supabase JWT Secret

## Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Clerk JWT Signing Key for Supabase
CLERK_JWT_KEY=your_clerk_jwt_signing_key_here
```

## Step 5: Update Supabase Functions

The Supabase Edge Functions need to be configured to accept Clerk JWT tokens. Update your functions to use the correct JWT verification.

## Testing the Integration

1. Sign in with Clerk
2. Check the browser console for successful token generation
3. Test API calls to Supabase functions
4. Verify that authentication works properly

## Troubleshooting

### 401 Errors
- Ensure the JWT template is correctly configured
- Verify the JWT secret matches between Clerk and Supabase
- Check that the token is being passed correctly in requests

### Token Generation Issues
- Verify the JWT template syntax
- Check Clerk logs for template errors
- Ensure the user has the required claims

### Supabase Function Errors
- Verify the function is using the correct auth method
- Check that the JWT is being properly decoded
- Ensure the user ID matches between Clerk and Supabase 