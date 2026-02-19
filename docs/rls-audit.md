# Supabase RLS Audit — FlipMyEra

> Generated 2026-02-17. Review against actual Supabase dashboard policies.

## Tables & Recommended RLS Policies

### 1. `profiles`
- **SELECT**: Users can read their own profile (`auth.uid() = id`)
- **UPDATE**: Users can update their own profile
- **INSERT**: Triggered by auth hook / service role only
- ⚠️ Admin may need broader SELECT for admin dashboard

### 2. `books`
- **SELECT**: Owner only (`auth.uid() = user_id`)
- **INSERT**: Authenticated users, `user_id = auth.uid()`
- **UPDATE**: Owner only
- **DELETE**: Owner only

### 3. `stories`
- **SELECT**: Owner only (`auth.uid() = user_id`)
- **INSERT**: Authenticated, `user_id = auth.uid()`
- **UPDATE/DELETE**: Owner only

### 4. `chapters`
- **SELECT**: Owner via join to parent story/book
- **INSERT/UPDATE/DELETE**: Owner via join

### 5. `chapter_images`
- **SELECT**: Owner via join to chapter → story
- **INSERT/UPDATE**: Owner via join

### 6. `ebook_generations`
- **SELECT**: Owner (`auth.uid() = user_id`)
- **INSERT**: Authenticated, `user_id = auth.uid()`
- **UPDATE**: Owner only (status updates may need service role)

### 7. `memory_books`
- **SELECT**: Owner (`auth.uid() = user_id`)
- **INSERT/UPDATE/DELETE**: Owner only

### 8. `payments`
- **SELECT**: Owner only
- **INSERT**: Service role only (from Stripe webhooks)
- **UPDATE**: Service role only
- ⚠️ Users should never be able to INSERT/UPDATE payments directly

### 9. `published_stories`
- **SELECT**: Public (these are published)
- **INSERT/UPDATE/DELETE**: Owner only

### 10. `tiktok_shares`
- **SELECT/INSERT**: Owner only
- **UPDATE/DELETE**: Owner only

### 11. `api_settings`
- ⚠️ **HIGH RISK** — Contains API keys (Groq, DeepSeek, Runware)
- **SELECT**: Service role only OR admin users only
- **INSERT/UPDATE/DELETE**: Service role only
- 🔴 **Flag**: Ensure RLS is ENABLED and no public access exists. If RLS is disabled, this table leaks all API keys.

## Key Risks

1. **`api_settings`** — Most sensitive table. Must have RLS enabled with service-role-only access.
2. **`payments`** — Should be read-only for users, write-only via service role.
3. **`chapters` / `chapter_images`** — Need join-based policies to the parent story's `user_id`.
4. **Admin access** — Consider a `is_admin` column on `profiles` or use Clerk metadata + a Supabase function.

## Action Items

- [ ] Verify RLS is **enabled** on ALL tables in Supabase dashboard
- [ ] Verify `api_settings` has no public SELECT policy
- [ ] Verify `payments` has no public INSERT/UPDATE policy
- [ ] Add join-based RLS for `chapters` and `chapter_images` if missing
