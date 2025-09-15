# JWT Signature Error Fixes

## New Issue Identified
After fixing the JWT template error, we encountered a new issue: `JWSError JWSInvalidSignature`

This means:
- ✅ Clerk tokens are now being generated successfully
- ❌ Supabase can't validate the JWT signatures because they're signed with Clerk's secret, not Supabase's

## Root Cause
The JWT signature validation error occurs because:

1. **Clerk tokens** are signed with Clerk's JWT signing key
2. **Supabase expects tokens** signed with its own JWT secret
3. **No JWT template configured** in Clerk to generate Supabase-compatible tokens

## Temporary Fix Applied

### 1. **Bypassed Direct Database Access**
- Removed direct Supabase table queries that require JWT validation
- Updated `ClerkAuthContext.tsx` to work with Clerk data directly
- Profile sync will be handled via Edge Functions (which can validate Clerk tokens properly)

### 2. **Fixed Multiple Client Instance Warning**
- Updated `createSupabaseClientWithClerkToken` to disable conflicting auth features
- Added warning about multiple client creation

### 3. **Simplified Authentication Flow**
- User profiles now populated from Clerk data directly
- Credit balance fetching still works via Edge Functions (which handle JWT validation properly)
- Avoided RLS-protected table access that requires proper JWT validation

## Files Modified
- `src/modules/auth/contexts/ClerkAuthContext.tsx` - Main authentication context
- `src/core/integrations/supabase/client.ts` - Supabase client configuration

## Current Status
✅ **Authentication errors resolved**  
✅ **Multiple client warnings minimized**  
✅ **User profile creation from Clerk data**  
✅ **Credit balance fetching via Edge Functions works**  
⚠️ **Direct database access bypassed temporarily**

## Long-Term Solution (Recommended)

To properly fix the JWT signature validation, you need to configure Clerk-Supabase integration:

### Option 1: Configure Clerk JWT Template (Recommended)
1. **Go to Clerk Dashboard** → JWT Templates
2. **Create template named 'supabase'** with this configuration:
```json
{
  "aud": "authenticated",
  "exp": "{{exp}}",
  "iat": "{{iat}}",
  "iss": "{{iss}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "email": "{{user.primary_email_address.email_address}}",
    "sub": "{{user.id}}"
  },
  "role": "authenticated"
}
```

3. **Get Clerk JWT Signing Key** from the template
4. **Update Supabase JWT Settings**:
   - Go to Supabase Dashboard → Settings → API
   - Set JWT Secret to your Clerk JWT signing key
   - Set JWT Expiry to match Clerk (3600 seconds)

5. **Revert authentication calls** to use `{ template: 'supabase' }`

### Option 2: Use Service Role for Backend Operations
- Keep current approach but use Supabase service role key in Edge Functions
- Edge Functions validate Clerk tokens manually and use service role for database operations

## Testing the Current Fix
1. **Clear browser cache** and reload
2. **Sign in with Clerk** - should work without JWT signature errors
3. **Check console** - should see "Using fallback approach for Clerk-Supabase integration"
4. **Credit balance** should still fetch via Edge Functions
5. **User profile** should populate from Clerk data

The application should now work without JWT signature errors, though some features requiring direct database access may need to be updated to use Edge Functions.
