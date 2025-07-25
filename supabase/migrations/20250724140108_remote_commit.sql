drop trigger if exists "trigger_stories_updated_at" on "public"."stories";

drop policy "Users can create their own books" on "public"."books";

drop policy "Users can view their own books" on "public"."books";

drop policy "Enable insert access for all users" on "public"."chapter_images";

drop policy "Enable read access for all users" on "public"."chapter_images";

drop policy "Enable insert access for all users" on "public"."chapters";

drop policy "Enable read access for all users" on "public"."chapters";

drop policy "users can delete own ebook generations" on "public"."ebook_generations";

drop policy "users can insert own ebook generations" on "public"."ebook_generations";

drop policy "users can select own ebook generations" on "public"."ebook_generations";

drop policy "users can update own ebook generations" on "public"."ebook_generations";

drop policy "Users can view own payments" on "public"."payments";

drop policy "Enable insert for all users" on "public"."published_stories";

drop policy "Enable read access for all users" on "public"."published_stories";

drop policy "Public can view published stories" on "public"."stories";

drop policy "Service role can insert stories for any user" on "public"."stories";

drop policy "Service role can manage all stories" on "public"."stories";

drop policy "Users can delete own memory books" on "public"."memory_books";

drop policy "Users can insert own memory books" on "public"."memory_books";

drop policy "Users can update own memory books" on "public"."memory_books";

drop policy "Users can view own memory books" on "public"."memory_books";

drop policy "Users can delete own stories" on "public"."stories";

drop policy "Users can insert own stories" on "public"."stories";

drop policy "Users can update own stories" on "public"."stories";

drop policy "Users can view own stories" on "public"."stories";

revoke delete on table "public"."books" from "anon";

revoke insert on table "public"."books" from "anon";

revoke references on table "public"."books" from "anon";

revoke select on table "public"."books" from "anon";

revoke trigger on table "public"."books" from "anon";

revoke truncate on table "public"."books" from "anon";

revoke update on table "public"."books" from "anon";

revoke delete on table "public"."books" from "authenticated";

revoke insert on table "public"."books" from "authenticated";

revoke references on table "public"."books" from "authenticated";

revoke select on table "public"."books" from "authenticated";

revoke trigger on table "public"."books" from "authenticated";

revoke truncate on table "public"."books" from "authenticated";

revoke update on table "public"."books" from "authenticated";

revoke delete on table "public"."books" from "service_role";

revoke insert on table "public"."books" from "service_role";

revoke references on table "public"."books" from "service_role";

revoke select on table "public"."books" from "service_role";

revoke trigger on table "public"."books" from "service_role";

revoke truncate on table "public"."books" from "service_role";

revoke update on table "public"."books" from "service_role";

revoke delete on table "public"."chapter_images" from "anon";

revoke insert on table "public"."chapter_images" from "anon";

revoke references on table "public"."chapter_images" from "anon";

revoke select on table "public"."chapter_images" from "anon";

revoke trigger on table "public"."chapter_images" from "anon";

revoke truncate on table "public"."chapter_images" from "anon";

revoke update on table "public"."chapter_images" from "anon";

revoke delete on table "public"."chapter_images" from "authenticated";

revoke insert on table "public"."chapter_images" from "authenticated";

revoke references on table "public"."chapter_images" from "authenticated";

revoke select on table "public"."chapter_images" from "authenticated";

revoke trigger on table "public"."chapter_images" from "authenticated";

revoke truncate on table "public"."chapter_images" from "authenticated";

revoke update on table "public"."chapter_images" from "authenticated";

revoke delete on table "public"."chapter_images" from "service_role";

revoke insert on table "public"."chapter_images" from "service_role";

revoke references on table "public"."chapter_images" from "service_role";

revoke select on table "public"."chapter_images" from "service_role";

revoke trigger on table "public"."chapter_images" from "service_role";

revoke truncate on table "public"."chapter_images" from "service_role";

revoke update on table "public"."chapter_images" from "service_role";

revoke delete on table "public"."chapters" from "anon";

revoke insert on table "public"."chapters" from "anon";

revoke references on table "public"."chapters" from "anon";

revoke select on table "public"."chapters" from "anon";

revoke trigger on table "public"."chapters" from "anon";

revoke truncate on table "public"."chapters" from "anon";

revoke update on table "public"."chapters" from "anon";

revoke delete on table "public"."chapters" from "authenticated";

revoke insert on table "public"."chapters" from "authenticated";

revoke references on table "public"."chapters" from "authenticated";

revoke select on table "public"."chapters" from "authenticated";

revoke trigger on table "public"."chapters" from "authenticated";

revoke truncate on table "public"."chapters" from "authenticated";

revoke update on table "public"."chapters" from "authenticated";

revoke delete on table "public"."chapters" from "service_role";

revoke insert on table "public"."chapters" from "service_role";

revoke references on table "public"."chapters" from "service_role";

revoke select on table "public"."chapters" from "service_role";

revoke trigger on table "public"."chapters" from "service_role";

revoke truncate on table "public"."chapters" from "service_role";

revoke update on table "public"."chapters" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."published_stories" from "anon";

revoke insert on table "public"."published_stories" from "anon";

revoke references on table "public"."published_stories" from "anon";

revoke select on table "public"."published_stories" from "anon";

revoke trigger on table "public"."published_stories" from "anon";

revoke truncate on table "public"."published_stories" from "anon";

revoke update on table "public"."published_stories" from "anon";

revoke delete on table "public"."published_stories" from "authenticated";

revoke insert on table "public"."published_stories" from "authenticated";

revoke references on table "public"."published_stories" from "authenticated";

revoke select on table "public"."published_stories" from "authenticated";

revoke trigger on table "public"."published_stories" from "authenticated";

revoke truncate on table "public"."published_stories" from "authenticated";

revoke update on table "public"."published_stories" from "authenticated";

revoke delete on table "public"."published_stories" from "service_role";

revoke insert on table "public"."published_stories" from "service_role";

revoke references on table "public"."published_stories" from "service_role";

revoke select on table "public"."published_stories" from "service_role";

revoke trigger on table "public"."published_stories" from "service_role";

revoke truncate on table "public"."published_stories" from "service_role";

revoke update on table "public"."published_stories" from "service_role";

alter table "public"."chapter_images" drop constraint "chapter_images_chapter_id_fkey";

alter table "public"."books" drop constraint "books_pkey";

alter table "public"."chapter_images" drop constraint "chapter_images_pkey";

alter table "public"."chapters" drop constraint "chapters_pkey";

alter table "public"."payments" drop constraint "payments_pkey";

alter table "public"."published_stories" drop constraint "published_stories_pkey";

drop index if exists "public"."books_pkey";

drop index if exists "public"."chapter_images_pkey";

drop index if exists "public"."chapters_pkey";

drop index if exists "public"."idx_chapter_images_chapter_id";

drop index if exists "public"."idx_chapters_story_id";

drop index if exists "public"."idx_stories_era";

drop index if exists "public"."idx_stories_name";

drop index if exists "public"."idx_stories_personality_type";

drop index if exists "public"."idx_stories_user_status";

drop index if exists "public"."payments_pkey";

drop index if exists "public"."published_stories_pkey";

drop table "public"."books";

drop table "public"."chapter_images";

drop table "public"."chapters";

drop table "public"."payments";

drop table "public"."published_stories";

alter table "public"."stories" alter column "status" set default 'completed'::text;

alter table "public"."stories" alter column "status" set data type text using "status"::text;

create policy "Users can delete own ebook generations"
on "public"."ebook_generations"
as permissive
for delete
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can insert own ebook generations"
on "public"."ebook_generations"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can update own ebook generations"
on "public"."ebook_generations"
as permissive
for update
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can view own ebook generations"
on "public"."ebook_generations"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can delete own memory books"
on "public"."memory_books"
as permissive
for delete
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can insert own memory books"
on "public"."memory_books"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can update own memory books"
on "public"."memory_books"
as permissive
for update
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can view own memory books"
on "public"."memory_books"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can delete own stories"
on "public"."stories"
as permissive
for delete
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can insert own stories"
on "public"."stories"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can update own stories"
on "public"."stories"
as permissive
for update
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));


create policy "Users can view own stories"
on "public"."stories"
as permissive
for select
to public
using (((auth.jwt() ->> 'sub'::text) = user_id));



