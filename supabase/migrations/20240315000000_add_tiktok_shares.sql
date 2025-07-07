create table if not exists public.tiktok_shares (
  id uuid default gen_random_uuid() primary key,
  text_snippet text,
  video_url text,
  music_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text references profiles(id)
);

-- Set up RLS policies
alter table public.tiktok_shares enable row level security;

create policy "Allow authenticated users to create shares"
  on public.tiktok_shares
  for insert
  to authenticated
  with check (true);

create policy "Allow users to view their own shares"
  on public.tiktok_shares
  for select
  to authenticated
  using (user_id = auth.jwt() ->> 'sub');
