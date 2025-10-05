# Migration Fix: UUID to TEXT Conversion

## Problem
The migration `20250117_001_convert_uuid_to_text.sql` was failing with error:
```
ERROR: cannot alter type of a column used in a policy definition (SQLSTATE 0A000)
policy Users can view own profile on table profiles depends on column "id"
```

## Root Cause
PostgreSQL does not allow altering column types when Row Level Security (RLS) policies depend on those columns. The original migration was attempting to:
1. Drop foreign key constraints
2. **Alter column types** ← This failed because RLS policies still existed
3. Drop and recreate RLS policies

## Solution Applied
The migration has been reordered to follow the correct sequence:

### Step 1: Drop ALL RLS policies first
- Drop policies on `profiles`
- Drop policies on `stories` (if exists)
- Drop policies on `tiktok_shares`
- Drop policies on `ebook_generations` (if exists)
- Drop policies on `credit_transactions` (if exists)

### Step 2: Drop foreign key constraints
- All foreign keys referencing the columns we're changing

### Step 3: Convert column types
- Convert `profiles.id` from UUID to TEXT
- Convert `user_id` columns in all related tables from UUID to TEXT

### Step 4: Recreate foreign key constraints
- Re-establish all foreign key relationships

### Step 5: Recreate RLS policies
- Recreate all policies with TEXT-based user IDs using `auth.jwt() ->> 'sub'`

## What Changed
The fixed migration now follows this order:
1. ✅ Drop RLS policies FIRST
2. ✅ Drop foreign key constraints
3. ✅ Alter column types
4. ✅ Recreate foreign key constraints
5. ✅ Recreate RLS policies

## Tables Affected
- `profiles` - id column (UUID → TEXT)
- `stories` - user_id column (UUID → TEXT)
- `tiktok_shares` - user_id column (UUID → TEXT)
- `ebook_generations` - user_id column (UUID → TEXT)
- `credit_transactions` - user_id column (UUID → TEXT)

## How to Apply
1. Run the updated migration file in Supabase SQL Editor:
   ```
   supabase/migrations/20250117_001_convert_uuid_to_text.sql
   ```

2. Or use the Supabase CLI if you have it set up:
   ```bash
   supabase db reset
   ```

## Verification
After applying the migration, verify the changes by running:
```sql
-- Check column types
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name IN ('id', 'user_id')
  AND table_name IN ('profiles', 'stories', 'tiktok_shares', 'ebook_generations', 'credit_transactions');

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Important Notes
- This migration is wrapped in a transaction (BEGIN/COMMIT), so if any step fails, all changes will be rolled back
- The migration uses `IF EXISTS` checks to handle cases where tables might not exist yet
- All policies are recreated to work with Clerk's TEXT-based user IDs (`auth.jwt() ->> 'sub'`)
- Foreign key constraints maintain `ON DELETE CASCADE` behavior

## Related Files
- `supabase/migrations/20250117_001_convert_uuid_to_text.sql` - Fixed migration
- `APPLY_MIGRATIONS.sql` - Manual migration script (doesn't have this issue as it doesn't alter existing columns)
- `verify-database-state.sql` - Use this to verify the migration worked correctly
