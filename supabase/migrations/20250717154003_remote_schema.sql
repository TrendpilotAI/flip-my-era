create schema if not exists "chapters";


create extension if not exists "wrappers" with schema "extensions";


create type "public"."story_status" as enum ('draft', 'generating', 'completed', 'published', 'archived');

drop policy "Users can insert own credit transactions" on "public"."credit_transactions";

drop policy "Users can view own credit transactions" on "public"."credit_transactions";

drop policy "Users can delete own ebook generations" on "public"."ebook_generations";

drop policy "Users can insert own ebook generations" on "public"."ebook_generations";

drop policy "Users can update own ebook generations" on "public"."ebook_generations";

drop policy "Users can view own ebook generations" on "public"."ebook_generations";

drop policy "Users can delete own memory books" on "public"."memory_books";

drop policy "Users can insert own memory books" on "public"."memory_books";

drop policy "Users can update own memory books" on "public"."memory_books";

drop policy "Users can view own memory books" on "public"."memory_books";

drop policy "Users can delete own stories" on "public"."stories";

drop policy "Users can insert own stories" on "public"."stories";

drop policy "Users can update own stories" on "public"."stories";

drop policy "Users can view own stories" on "public"."stories";

drop policy "Users can delete own shares" on "public"."tiktok_shares";

drop policy "Users can insert own shares" on "public"."tiktok_shares";

drop policy "Users can update own shares" on "public"."tiktok_shares";

drop policy "Users can view own shares" on "public"."tiktok_shares";

drop policy "Users can insert own activities" on "public"."user_activities";

drop policy "Users can view own activities" on "public"."user_activities";

drop policy "Users can insert own profile" on "public"."profiles";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Users can view own profile" on "public"."profiles";

drop policy "Users can insert own credits" on "public"."user_credits";

drop policy "Users can update own credits" on "public"."user_credits";

drop policy "Users can view own credits" on "public"."user_credits";

revoke delete on table "public"."memory_books" from "anon";

revoke insert on table "public"."memory_books" from "anon";

revoke references on table "public"."memory_books" from "anon";

revoke select on table "public"."memory_books" from "anon";

revoke trigger on table "public"."memory_books" from "anon";

revoke truncate on table "public"."memory_books" from "anon";

revoke update on table "public"."memory_books" from "anon";

revoke delete on table "public"."memory_books" from "authenticated";

revoke insert on table "public"."memory_books" from "authenticated";

revoke references on table "public"."memory_books" from "authenticated";

revoke select on table "public"."memory_books" from "authenticated";

revoke trigger on table "public"."memory_books" from "authenticated";

revoke truncate on table "public"."memory_books" from "authenticated";

revoke update on table "public"."memory_books" from "authenticated";

revoke delete on table "public"."memory_books" from "service_role";

revoke insert on table "public"."memory_books" from "service_role";

revoke references on table "public"."memory_books" from "service_role";

revoke select on table "public"."memory_books" from "service_role";

revoke trigger on table "public"."memory_books" from "service_role";

revoke truncate on table "public"."memory_books" from "service_role";

revoke update on table "public"."memory_books" from "service_role";

revoke delete on table "public"."stories" from "anon";

revoke insert on table "public"."stories" from "anon";

revoke references on table "public"."stories" from "anon";

revoke select on table "public"."stories" from "anon";

revoke trigger on table "public"."stories" from "anon";

revoke truncate on table "public"."stories" from "anon";

revoke update on table "public"."stories" from "anon";

revoke delete on table "public"."stories" from "authenticated";

revoke insert on table "public"."stories" from "authenticated";

revoke references on table "public"."stories" from "authenticated";

revoke select on table "public"."stories" from "authenticated";

revoke trigger on table "public"."stories" from "authenticated";

revoke truncate on table "public"."stories" from "authenticated";

revoke update on table "public"."stories" from "authenticated";

revoke delete on table "public"."stories" from "service_role";

revoke insert on table "public"."stories" from "service_role";

revoke references on table "public"."stories" from "service_role";

revoke select on table "public"."stories" from "service_role";

revoke trigger on table "public"."stories" from "service_role";

revoke truncate on table "public"."stories" from "service_role";

revoke update on table "public"."stories" from "service_role";

revoke delete on table "public"."tiktok_shares" from "anon";

revoke insert on table "public"."tiktok_shares" from "anon";

revoke references on table "public"."tiktok_shares" from "anon";

revoke select on table "public"."tiktok_shares" from "anon";

revoke trigger on table "public"."tiktok_shares" from "anon";

revoke truncate on table "public"."tiktok_shares" from "anon";

revoke update on table "public"."tiktok_shares" from "anon";

revoke delete on table "public"."tiktok_shares" from "authenticated";

revoke insert on table "public"."tiktok_shares" from "authenticated";

revoke references on table "public"."tiktok_shares" from "authenticated";

revoke select on table "public"."tiktok_shares" from "authenticated";

revoke trigger on table "public"."tiktok_shares" from "authenticated";

revoke truncate on table "public"."tiktok_shares" from "authenticated";

revoke update on table "public"."tiktok_shares" from "authenticated";

revoke delete on table "public"."tiktok_shares" from "service_role";

revoke insert on table "public"."tiktok_shares" from "service_role";

revoke references on table "public"."tiktok_shares" from "service_role";

revoke select on table "public"."tiktok_shares" from "service_role";

revoke trigger on table "public"."tiktok_shares" from "service_role";

revoke truncate on table "public"."tiktok_shares" from "service_role";

revoke update on table "public"."tiktok_shares" from "service_role";

revoke delete on table "public"."user_activities" from "anon";

revoke insert on table "public"."user_activities" from "anon";

revoke references on table "public"."user_activities" from "anon";

revoke select on table "public"."user_activities" from "anon";

revoke trigger on table "public"."user_activities" from "anon";

revoke truncate on table "public"."user_activities" from "anon";

revoke update on table "public"."user_activities" from "anon";

revoke delete on table "public"."user_activities" from "authenticated";

revoke insert on table "public"."user_activities" from "authenticated";

revoke references on table "public"."user_activities" from "authenticated";

revoke select on table "public"."user_activities" from "authenticated";

revoke trigger on table "public"."user_activities" from "authenticated";

revoke truncate on table "public"."user_activities" from "authenticated";

revoke update on table "public"."user_activities" from "authenticated";

revoke delete on table "public"."user_activities" from "service_role";

revoke insert on table "public"."user_activities" from "service_role";

revoke references on table "public"."user_activities" from "service_role";

revoke select on table "public"."user_activities" from "service_role";

revoke trigger on table "public"."user_activities" from "service_role";

revoke truncate on table "public"."user_activities" from "service_role";

revoke update on table "public"."user_activities" from "service_role";

alter table "public"."memory_books" drop constraint "memory_books_original_story_id_fkey";

alter table "public"."memory_books" drop constraint "memory_books_user_id_fkey";

alter table "public"."stories" drop constraint "stories_user_id_fkey";

alter table "public"."tiktok_shares" drop constraint "tiktok_shares_story_id_fkey";

alter table "public"."tiktok_shares" drop constraint "tiktok_shares_user_id_fkey";

alter table "public"."user_activities" drop constraint "user_activities_user_id_fkey";

alter table "public"."ebook_generations" drop constraint "ebook_generations_user_id_fkey";

drop function if exists "public"."upsert_user_credits"(p_user_id text, p_balance integer, p_total_earned integer);

alter table "public"."memory_books" drop constraint "memory_books_pkey";

alter table "public"."stories" drop constraint "stories_pkey";

alter table "public"."tiktok_shares" drop constraint "tiktok_shares_pkey";

alter table "public"."user_activities" drop constraint "user_activities_pkey";

drop index if exists "public"."idx_credit_transactions_created_at";

drop index if exists "public"."idx_ebook_generations_status";

drop index if exists "public"."idx_ebook_generations_user_id";

drop index if exists "public"."idx_memory_books_status";

drop index if exists "public"."idx_memory_books_user_id";

drop index if exists "public"."idx_stories_created_at";

drop index if exists "public"."idx_stories_status";

drop index if exists "public"."idx_stories_user_id";

drop index if exists "public"."idx_tiktok_shares_story_id";

drop index if exists "public"."idx_tiktok_shares_user_id";

drop index if exists "public"."idx_user_activities_activity_type";

drop index if exists "public"."idx_user_activities_created_at";

drop index if exists "public"."idx_user_activities_user_id";

drop index if exists "public"."idx_user_credits_subscription_status";

drop index if exists "public"."memory_books_pkey";

drop index if exists "public"."stories_pkey";

drop index if exists "public"."tiktok_shares_pkey";

drop index if exists "public"."user_activities_pkey";

drop table "public"."memory_books";

drop table "public"."stories";

drop table "public"."tiktok_shares";

drop table "public"."user_activities";

create table "public"."api_settings" (
    "id" uuid not null default gen_random_uuid(),
    "deepseek_api_key" text,
    "runware_api_key" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "groq_api_key" text
);


alter table "public"."api_settings" enable row level security;

create table "public"."books" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "content" text not null,
    "preview" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "status" text default 'draft'::text,
    "metadata" jsonb default '{}'::jsonb
);


alter table "public"."books" enable row level security;

create table "public"."chapter_images" (
    "id" uuid not null default gen_random_uuid(),
    "chapter_id" uuid not null,
    "image_url" text not null,
    "prompt_used" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."chapter_images" enable row level security;

create table "public"."chapters" (
    "id" uuid not null default gen_random_uuid(),
    "story_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "chapter_number" integer not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."chapters" enable row level security;

create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "amount" integer not null,
    "credits_added" integer not null,
    "stripe_payment_id" text not null,
    "status" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."payments" enable row level security;

create table "public"."published_stories" (
    "id" uuid not null default gen_random_uuid(),
    "story_id" uuid,
    "original_story" text not null,
    "chapters" jsonb not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."published_stories" enable row level security;

alter table "public"."credit_transactions" drop column "stripe_session_id";

alter table "public"."credit_transactions" drop column "type";

alter table "public"."credit_transactions" add column "ebook_generation_id" uuid;

alter table "public"."credit_transactions" add column "reference_id" character varying(255);

alter table "public"."credit_transactions" add column "samcart_order_id" character varying(255);

alter table "public"."credit_transactions" add column "transaction_type" text not null;

alter table "public"."ebook_generations" drop column "share_count";

alter table "public"."ebook_generations" add column "chapter_count" bigint;

alter table "public"."ebook_generations" add column "content" text;

alter table "public"."ebook_generations" add column "credits_used" bigint default '1'::bigint;

alter table "public"."ebook_generations" add column "ebook_generation_id" uuid default gen_random_uuid();

alter table "public"."ebook_generations" add column "generation_completed_at" timestamp without time zone;

alter table "public"."ebook_generations" add column "original_story_id" text;

alter table "public"."ebook_generations" add column "paid_with_credits" boolean default false;

alter table "public"."ebook_generations" add column "story_id" text;

alter table "public"."ebook_generations" add column "story_type" text;

alter table "public"."ebook_generations" add column "transaction_id" text;

alter table "public"."ebook_generations" add column "word_count" bigint;

alter table "public"."ebook_generations" alter column "chapters" drop not null;

alter table "public"."ebook_generations" alter column "download_count" set default '0'::bigint;

alter table "public"."ebook_generations" alter column "download_count" set data type bigint using "download_count"::bigint;

alter table "public"."ebook_generations" alter column "image_style" drop default;

alter table "public"."ebook_generations" alter column "mood" drop default;

alter table "public"."ebook_generations" alter column "title" set default 'Not Null'::text;

alter table "public"."ebook_generations" alter column "title" drop not null;

alter table "public"."ebook_generations" alter column "user_id" set default 'Not Null'::text;

alter table "public"."ebook_generations" alter column "user_id" drop not null;

alter table "public"."ebook_generations" alter column "view_count" set default '0'::bigint;

alter table "public"."ebook_generations" alter column "view_count" set data type bigint using "view_count"::bigint;

CREATE UNIQUE INDEX api_settings_pkey ON public.api_settings USING btree (id);

CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id);

CREATE UNIQUE INDEX chapter_images_pkey ON public.chapter_images USING btree (id);

CREATE UNIQUE INDEX chapters_pkey ON public.chapters USING btree (id);

CREATE INDEX idx_chapter_images_chapter_id ON public.chapter_images USING btree (chapter_id);

CREATE INDEX idx_chapters_story_id ON public.chapters USING btree (story_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX published_stories_pkey ON public.published_stories USING btree (id);

alter table "public"."api_settings" add constraint "api_settings_pkey" PRIMARY KEY using index "api_settings_pkey";

alter table "public"."books" add constraint "books_pkey" PRIMARY KEY using index "books_pkey";

alter table "public"."chapter_images" add constraint "chapter_images_pkey" PRIMARY KEY using index "chapter_images_pkey";

alter table "public"."chapters" add constraint "chapters_pkey" PRIMARY KEY using index "chapters_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."published_stories" add constraint "published_stories_pkey" PRIMARY KEY using index "published_stories_pkey";

alter table "public"."chapter_images" add constraint "chapter_images_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE not valid;

alter table "public"."chapter_images" validate constraint "chapter_images_chapter_id_fkey";

alter table "public"."ebook_generations" add constraint "ebook_generations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."ebook_generations" validate constraint "ebook_generations_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, subscription_status, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'full_name'
        ELSE NULL
      END,
      NEW.email
    ),
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data->>'avatar_url'
      ELSE NULL
    END,
    'free',
    0
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating user credits for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_stories_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."api_settings" to "anon";

grant insert on table "public"."api_settings" to "anon";

grant references on table "public"."api_settings" to "anon";

grant select on table "public"."api_settings" to "anon";

grant trigger on table "public"."api_settings" to "anon";

grant truncate on table "public"."api_settings" to "anon";

grant update on table "public"."api_settings" to "anon";

grant delete on table "public"."api_settings" to "authenticated";

grant insert on table "public"."api_settings" to "authenticated";

grant references on table "public"."api_settings" to "authenticated";

grant select on table "public"."api_settings" to "authenticated";

grant trigger on table "public"."api_settings" to "authenticated";

grant truncate on table "public"."api_settings" to "authenticated";

grant update on table "public"."api_settings" to "authenticated";

grant delete on table "public"."api_settings" to "service_role";

grant insert on table "public"."api_settings" to "service_role";

grant references on table "public"."api_settings" to "service_role";

grant select on table "public"."api_settings" to "service_role";

grant trigger on table "public"."api_settings" to "service_role";

grant truncate on table "public"."api_settings" to "service_role";

grant update on table "public"."api_settings" to "service_role";

grant delete on table "public"."books" to "anon";

grant insert on table "public"."books" to "anon";

grant references on table "public"."books" to "anon";

grant select on table "public"."books" to "anon";

grant trigger on table "public"."books" to "anon";

grant truncate on table "public"."books" to "anon";

grant update on table "public"."books" to "anon";

grant delete on table "public"."books" to "authenticated";

grant insert on table "public"."books" to "authenticated";

grant references on table "public"."books" to "authenticated";

grant select on table "public"."books" to "authenticated";

grant trigger on table "public"."books" to "authenticated";

grant truncate on table "public"."books" to "authenticated";

grant update on table "public"."books" to "authenticated";

grant delete on table "public"."books" to "service_role";

grant insert on table "public"."books" to "service_role";

grant references on table "public"."books" to "service_role";

grant select on table "public"."books" to "service_role";

grant trigger on table "public"."books" to "service_role";

grant truncate on table "public"."books" to "service_role";

grant update on table "public"."books" to "service_role";

grant delete on table "public"."chapter_images" to "anon";

grant insert on table "public"."chapter_images" to "anon";

grant references on table "public"."chapter_images" to "anon";

grant select on table "public"."chapter_images" to "anon";

grant trigger on table "public"."chapter_images" to "anon";

grant truncate on table "public"."chapter_images" to "anon";

grant update on table "public"."chapter_images" to "anon";

grant delete on table "public"."chapter_images" to "authenticated";

grant insert on table "public"."chapter_images" to "authenticated";

grant references on table "public"."chapter_images" to "authenticated";

grant select on table "public"."chapter_images" to "authenticated";

grant trigger on table "public"."chapter_images" to "authenticated";

grant truncate on table "public"."chapter_images" to "authenticated";

grant update on table "public"."chapter_images" to "authenticated";

grant delete on table "public"."chapter_images" to "service_role";

grant insert on table "public"."chapter_images" to "service_role";

grant references on table "public"."chapter_images" to "service_role";

grant select on table "public"."chapter_images" to "service_role";

grant trigger on table "public"."chapter_images" to "service_role";

grant truncate on table "public"."chapter_images" to "service_role";

grant update on table "public"."chapter_images" to "service_role";

grant delete on table "public"."chapters" to "anon";

grant insert on table "public"."chapters" to "anon";

grant references on table "public"."chapters" to "anon";

grant select on table "public"."chapters" to "anon";

grant trigger on table "public"."chapters" to "anon";

grant truncate on table "public"."chapters" to "anon";

grant update on table "public"."chapters" to "anon";

grant delete on table "public"."chapters" to "authenticated";

grant insert on table "public"."chapters" to "authenticated";

grant references on table "public"."chapters" to "authenticated";

grant select on table "public"."chapters" to "authenticated";

grant trigger on table "public"."chapters" to "authenticated";

grant truncate on table "public"."chapters" to "authenticated";

grant update on table "public"."chapters" to "authenticated";

grant delete on table "public"."chapters" to "service_role";

grant insert on table "public"."chapters" to "service_role";

grant references on table "public"."chapters" to "service_role";

grant select on table "public"."chapters" to "service_role";

grant trigger on table "public"."chapters" to "service_role";

grant truncate on table "public"."chapters" to "service_role";

grant update on table "public"."chapters" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."published_stories" to "anon";

grant insert on table "public"."published_stories" to "anon";

grant references on table "public"."published_stories" to "anon";

grant select on table "public"."published_stories" to "anon";

grant trigger on table "public"."published_stories" to "anon";

grant truncate on table "public"."published_stories" to "anon";

grant update on table "public"."published_stories" to "anon";

grant delete on table "public"."published_stories" to "authenticated";

grant insert on table "public"."published_stories" to "authenticated";

grant references on table "public"."published_stories" to "authenticated";

grant select on table "public"."published_stories" to "authenticated";

grant trigger on table "public"."published_stories" to "authenticated";

grant truncate on table "public"."published_stories" to "authenticated";

grant update on table "public"."published_stories" to "authenticated";

grant delete on table "public"."published_stories" to "service_role";

grant insert on table "public"."published_stories" to "service_role";

grant references on table "public"."published_stories" to "service_role";

grant select on table "public"."published_stories" to "service_role";

grant trigger on table "public"."published_stories" to "service_role";

grant truncate on table "public"."published_stories" to "service_role";

grant update on table "public"."published_stories" to "service_role";

create policy "Enable insert access for all users"
on "public"."api_settings"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."api_settings"
as permissive
for select
to public
using (true);


create policy "Enable update access for all users"
on "public"."api_settings"
as permissive
for update
to public
using (true);


create policy "Users can create their own books"
on "public"."books"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own books"
on "public"."books"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Enable insert access for all users"
on "public"."chapter_images"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."chapter_images"
as permissive
for select
to public
using (true);


create policy "Enable insert access for all users"
on "public"."chapters"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."chapters"
as permissive
for select
to public
using (true);


create policy "Users can insert own transactions"
on "public"."credit_transactions"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can view own transactions"
on "public"."credit_transactions"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "users can delete own ebook generations"
on "public"."ebook_generations"
as permissive
for delete
to public
using (true);


create policy "users can insert own ebook generations"
on "public"."ebook_generations"
as permissive
for insert
to public
with check (true);


create policy "users can select own ebook generations"
on "public"."ebook_generations"
as permissive
for select
to public
using (true);


create policy "users can update own ebook generations"
on "public"."ebook_generations"
as permissive
for update
to public
using (true);


create policy "Users can view own payments"
on "public"."payments"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Enable insert for all users"
on "public"."published_stories"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."published_stories"
as permissive
for select
to public
using (true);


create policy "Users can insert own profile"
on "public"."profiles"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = id));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to public
using (((auth.jwt() ->> 'sub'::text) = id));


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = id));


create policy "Users can insert own credits"
on "public"."user_credits"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can update own credits"
on "public"."user_credits"
as permissive
for update
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can view own credits"
on "public"."user_credits"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.api_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


