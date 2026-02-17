# Clerk-Supabase JWT Integration Setup Guide

## Current Status
✅ **Code restored** - All authentication calls now use `{ template: 'supabase' }`  
✅ **Database queries restored** - User profiles, credits, stories will be fetched from Supabase  
❌ **JWT template missing** - You need to configure this in Clerk Dashboard  
❌ **Supabase JWT settings** - Need to be updated to accept Clerk tokens  

## Step 1: Configure Clerk JWT Template

1. **Go to your Clerk Dashboard**
   - Open https://dashboard.clerk.com
   - Select your application

2. **Navigate to JWT Templates**
   - In the left sidebar, click **"JWT Templates"**
   - Click **"New template"**

3. **Create Supabase Template**
   - **Name**: `supabase` (exactly this name)
   - **Token lifetime**: `3600` (1 hour)
   - **Custom claims**: Use this JSON configuration:

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

4. **Save the template** and **copy the signing key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Configure Supabase JWT Settings

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings**
   - Go to **Settings** → **API**
   - Scroll down to **"JWT Settings"**

3. **Update JWT Configuration**
   - **JWT Secret**: Paste the Clerk signing key from Step 1
   - **JWT Expiry**: Set to `3600` (to match Clerk template)
   - **Click "Save"**

## Step 3: Verify Database Schema

Your Supabase database should have these tables with proper RLS policies:

### profiles table
```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,  -- Clerk user ID (not UUID)
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.jwt() ->> 'sub' = id);
```

### user_credits table
```sql
CREATE TABLE user_credits (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id),
  balance INTEGER DEFAULT 0,
  subscription_type TEXT,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON user_credits
FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
```

### stories table
```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  birth_date DATE,
  initial_story TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stories" ON stories
FOR ALL USING (auth.jwt() ->> 'sub' = user_id);
```

## Step 4: Test the Integration

After completing Steps 1-3:

1. **Clear browser cache** completely
2. **Restart your development server**
3. **Sign in with Clerk**
4. **Check browser console** for any JWT errors
5. **Verify user profile creation** in Supabase dashboard

## Expected Behavior

Once properly configured:

✅ **Authentication**: Clerk tokens will be accepted by Supabase  
✅ **User Profiles**: Automatically created/updated from Clerk data  
✅ **Credits**: Fetched from user_credits table  
✅ **Stories**: User can access their saved stories  
✅ **Ebooks**: User can access their generated ebooks  
✅ **Subscription**: Subscription status stored in profiles table  

## Troubleshooting

### If you see "No JWT template exists with name: supabase"
- Double-check the template name is exactly `supabase`
- Make sure the template is saved and active

### If you see "JWSError JWSInvalidSignature"
- Verify the Clerk signing key is correctly copied to Supabase JWT Secret
- Check that there are no extra spaces or characters

### If you see "Unauthorized" errors
- Verify RLS policies are correctly configured
- Check that the JWT claims include the correct `sub` field

### If database operations fail
- Ensure user_id fields in all tables are TEXT type (not UUID)
- Verify foreign key relationships are correct

## Current Code Status

The application code has been restored to properly use Clerk-Supabase integration:

- All `getToken()` calls now use `{ template: 'supabase' }`
- User profile sync restored in `ClerkAuthContext.tsx`
- Database queries for credits, stories, and ebooks restored
- Proper error handling maintained

Once you complete the Clerk and Supabase configuration steps above, the application should work seamlessly with full access to user data, credits, stories, and ebooks stored in Supabase.
