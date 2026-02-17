# Applying Supabase Migrations

## Status
- ✅ Supabase CLI installed (v2.54.11)
- ✅ 18 migration files in `supabase/migrations/`
- ⚠️  Project needs to be linked first

## Steps to Apply Migrations

### 1. Authenticate with Supabase CLI

First, login to Supabase:
```bash
supabase login
```

Or set the access token:
```bash
export SUPABASE_ACCESS_TOKEN=your_access_token
```

Get your access token from: Supabase Dashboard → Account Settings → Access Tokens

### 2. Link Your Supabase Project

Project reference ID found: `tusdijypopftcmlenahr`

Run:
```bash
cd /workspace
supabase link --project-ref tusdijypopftcmlenahr
```

### 3. Check Migration Status

```bash
supabase migration list
```

### 4. Apply All Migrations

```bash
supabase db push
```

This will apply all migrations from `supabase/migrations/` that haven't been applied yet.

## Migration Files (in order):

1. `20240314000000_create_profiles_table.sql`
2. `20240315000000_add_tiktok_shares.sql`
3. `20250115_001_create_ebook_generations_table.sql`
4. `20250116_001_create_stories_table.sql`
5. `20250117_001_convert_uuid_to_text.sql`
6. `20250118_001_create_user_activities_table.sql`
7. `20250629_001_create_credit_system.sql`
8. `20250630_001_enhance_ebook_generations.sql`
9. `20250701_001_fix_clerk_integration.sql`
10. `20250702_001_create_memory_books.sql`
11. `20250703_001_fix_ebook_generations_user_id.sql`
12. `20250704_005_comprehensive_rls_setup.sql`
13. `20250914_001_create_stripe_webhook_logs.sql`
14. `20250914_002_create_credit_transactions.sql`
15. `20250914_003_create_webhook_retry_queue.sql`
16. `20250914_004_create_credit_usage_logs.sql`
17. `20250915_001_add_stories_is_public.sql`
18. `20251007_era_images_tables.sql`

## Alternative: Manual Application

If you prefer to apply migrations manually:
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order
3. Or use the consolidated `APPLY_MIGRATIONS.sql` file

## Verify After Migration

Run `verify-database-state.sql` in the SQL Editor to verify all tables and policies are created correctly.
