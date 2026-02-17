# Database and Authentication Fixes

## Issues Fixed

### 1. Profiles Table Schema Mismatch
**Issue**: The `profiles` table uses `name` column but the code was trying to use `full_name`.
**Fix**: Updated `ClerkAuthContext.tsx` to use `name` instead of `full_name` in insert and update operations.

### 2. Memory Books Table Not Existing
**Issue**: The `memory_books` table doesn't exist in production yet.
**Fix**: Updated `UserBooks.tsx` to use `ebook_generations` table as the primary source for user books.

### 3. Multiple Supabase Client Instances
**Issue**: Multiple Supabase clients were being created causing warnings.
**Fix**: Implemented singleton pattern in `client.ts` to reuse Supabase clients with the same token.

## Database Migration (If Needed)

If you need to ensure the database schema is correct, run this SQL in your Supabase SQL editor:

```sql
-- Ensure profiles table has correct columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- If you have data in full_name, migrate it to name
UPDATE profiles 
SET name = full_name 
WHERE name IS NULL AND full_name IS NOT NULL;

-- Drop the full_name column if it exists (optional)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;

-- Ensure ebook_generations table exists and has proper columns
CREATE TABLE IF NOT EXISTS ebook_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_id ON ebook_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_created_at ON ebook_generations(created_at DESC);

-- Set up RLS policies for ebook_generations
ALTER TABLE ebook_generations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own ebooks
CREATE POLICY "Users can view own ebooks" ON ebook_generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- Allow users to insert their own ebooks
CREATE POLICY "Users can insert own ebooks" ON ebook_generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Allow users to update their own ebooks
CREATE POLICY "Users can update own ebooks" ON ebook_generations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Allow users to delete their own ebooks
CREATE POLICY "Users can delete own ebooks" ON ebook_generations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);
```

## Files Modified

1. `/src/modules/auth/contexts/ClerkAuthContext.tsx`
   - Changed `full_name` to `name` in insert and update operations
   - Fixed profile field mapping

2. `/src/modules/ebook/components/UserBooks.tsx`
   - Removed dependency on `memory_books` table
   - Now uses `ebook_generations` as primary table
   - Improved error handling

3. `/src/core/integrations/supabase/client.ts`
   - Implemented singleton pattern for Clerk-authenticated Supabase clients
   - Prevents multiple client instance warnings

## Testing

After applying these fixes:

1. Clear your browser's local storage and cookies
2. Sign out and sign back in to refresh authentication
3. Test user profile creation/update
4. Test ebook fetching and display
5. Check browser console for any remaining errors

## Environment Variables

Ensure these are set correctly in your `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

## Additional Notes

- The `memory_books` table is a future feature and not required for current functionality
- The app now gracefully falls back to `ebook_generations` table
- Singleton pattern ensures efficient Supabase client usage
- All authentication flows use Clerk tokens for Supabase access
