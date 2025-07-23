

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "chapters";


ALTER SCHEMA "chapters" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."story_status" AS ENUM (
    'draft',
    'generating',
    'completed',
    'published',
    'archived'
);


ALTER TYPE "public"."story_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_embedding_similarity"("embedding1" "jsonb", "embedding2" "jsonb") RETURNS double precision
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  dot_product float := 0;
  norm1 float := 0;
  norm2 float := 0;
  i int;
  val1 float;
  val2 float;
BEGIN
  -- Calculate dot product and norms
  FOR i IN 0..(jsonb_array_length(embedding1) - 1) LOOP
    val1 := (embedding1->i)::float;
    val2 := (embedding2->i)::float;
    dot_product := dot_product + (val1 * val2);
    norm1 := norm1 + (val1 * val1);
    norm2 := norm2 + (val2 * val2);
  END LOOP;
  
  -- Return cosine similarity
  IF norm1 = 0 OR norm2 = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(norm1) * sqrt(norm2));
END;
$$;


ALTER FUNCTION "public"."calculate_embedding_similarity"("embedding1" "jsonb", "embedding2" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_similar_chapters"("target_embedding" "jsonb", "ebook_generation_id_param" "uuid", "similarity_threshold" double precision DEFAULT 0.85, "limit_count" integer DEFAULT 5) RETURNS TABLE("chapter_number" integer, "chapter_title" "text", "similarity_score" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.chapter_number,
    ce.chapter_title,
    calculate_embedding_similarity(target_embedding, ce.embedding_vector) as similarity_score
  FROM chapter_embeddings ce
  WHERE ce.ebook_generation_id = ebook_generation_id_param
    AND ce.embedding_vector IS NOT NULL
    AND calculate_embedding_similarity(target_embedding, ce.embedding_vector) >= similarity_threshold
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."find_similar_chapters"("target_embedding" "jsonb", "ebook_generation_id_param" "uuid", "similarity_threshold" double precision, "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_credits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stories_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stories_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_credit_amount" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Atomically update the user's credit balance
  UPDATE public.user_credits
  SET
    balance = balance + p_credit_amount,
    total_earned = total_earned + p_credit_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no row was updated, it means the user doesn't have a credit record yet.
  -- In this case, create a new record for them.
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, balance, total_earned)
    VALUES (p_user_id, p_credit_amount, p_credit_amount);
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_credit_amount" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deepseek_api_key" "text",
    "runware_api_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "groq_api_key" "text"
);


ALTER TABLE "public"."api_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "preview" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapter_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ebook_generation_id" "uuid",
    "chapter_summary_id" "uuid",
    "user_id" "text" NOT NULL,
    "chapter_number" integer NOT NULL,
    "chapter_title" "text" NOT NULL,
    "embedding_vector" "jsonb",
    "text_content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'chapter'::"text",
    "max_similarity_score" double precision DEFAULT 0.0,
    "similar_chapter_numbers" integer[],
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."chapter_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapter_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "prompt_used" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chapter_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapter_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ebook_generation_id" "uuid",
    "story_outline_id" "uuid",
    "user_id" "text" NOT NULL,
    "chapter_number" integer NOT NULL,
    "chapter_title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "key_events" "text"[],
    "character_developments" "jsonb" DEFAULT '[]'::"jsonb",
    "last_chapter_excerpt" "text",
    "chapter_word_count" integer,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."chapter_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "chapter_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "amount" integer NOT NULL,
    "description" "text" NOT NULL,
    "balance_after_transaction" integer NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "ebook_generation_id" "uuid",
    "reference_id" character varying(255),
    "samcart_order_id" character varying(255),
    "transaction_type" "text" NOT NULL
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ebook_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" DEFAULT 'Not Null'::"text",
    "title" "text" DEFAULT 'Not Null'::"text",
    "description" "text",
    "subtitle" "text",
    "author_name" "text",
    "chapters" "jsonb",
    "table_of_contents" "jsonb",
    "cover_image_url" "text",
    "generation_settings" "jsonb",
    "style_preferences" "jsonb",
    "image_style" "text",
    "mood" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp without time zone,
    "pdf_url" "text",
    "epub_url" "text",
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "view_count" bigint DEFAULT '0'::bigint,
    "download_count" bigint DEFAULT '0'::bigint,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "chapter_count" bigint,
    "content" "text",
    "credits_used" bigint DEFAULT '1'::bigint,
    "ebook_generation_id" "uuid" DEFAULT "gen_random_uuid"(),
    "generation_completed_at" timestamp without time zone,
    "original_story_id" "text",
    "paid_with_credits" boolean DEFAULT false,
    "story_id" "text",
    "story_type" "text",
    "transaction_id" "text",
    "word_count" bigint
);


ALTER TABLE "public"."ebook_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "credits_added" integer NOT NULL,
    "stripe_payment_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "email" "text",
    "name" "text",
    "avatar_url" "text",
    "subscription_status" "text" DEFAULT 'free'::"text",
    "credits" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."published_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid",
    "original_story" "text" NOT NULL,
    "chapters" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."published_stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_outlines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ebook_generation_id" "uuid",
    "user_id" "text" NOT NULL,
    "book_title" "text" NOT NULL,
    "book_description" "text",
    "chapter_titles" "text"[] NOT NULL,
    "chapter_summaries" "text"[] NOT NULL,
    "character_bios" "jsonb" DEFAULT '[]'::"jsonb",
    "world_info" "jsonb" DEFAULT '{}'::"jsonb",
    "key_themes" "text"[],
    "plot_outline" "text",
    "total_chapters" integer NOT NULL,
    "story_format" "text" NOT NULL,
    "theme" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_outlines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ebook_generation_id" "uuid",
    "story_outline_id" "uuid",
    "user_id" "text" NOT NULL,
    "current_chapter" integer DEFAULT 1 NOT NULL,
    "characters" "jsonb" DEFAULT '[]'::"jsonb",
    "character_relationships" "jsonb" DEFAULT '{}'::"jsonb",
    "major_plot_events" "jsonb" DEFAULT '[]'::"jsonb",
    "active_plot_threads" "jsonb" DEFAULT '[]'::"jsonb",
    "resolved_conflicts" "jsonb" DEFAULT '[]'::"jsonb",
    "pending_conflicts" "jsonb" DEFAULT '[]'::"jsonb",
    "current_locations" "jsonb" DEFAULT '[]'::"jsonb",
    "world_changes" "jsonb" DEFAULT '[]'::"jsonb",
    "timeline_events" "jsonb" DEFAULT '[]'::"jsonb",
    "current_mood" "text",
    "pacing_notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "balance" integer DEFAULT 0 NOT NULL,
    "total_earned" integer DEFAULT 0 NOT NULL,
    "total_spent" integer DEFAULT 0 NOT NULL,
    "subscription_status" "text" DEFAULT 'none'::"text",
    "subscription_type" "text",
    "subscription_starts_at" timestamp without time zone,
    "subscription_expires_at" timestamp without time zone,
    "monthly_credit_allowance" integer DEFAULT 0,
    "monthly_credits_used" integer DEFAULT 0,
    "current_period_start" timestamp without time zone,
    "current_period_end" timestamp without time zone,
    "samcart_subscription_id" character varying(255) DEFAULT NULL::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_credits_balance_check" CHECK (("balance" >= 0))
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_settings"
    ADD CONSTRAINT "api_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_embeddings"
    ADD CONSTRAINT "chapter_embeddings_ebook_generation_id_chapter_number_conte_key" UNIQUE ("ebook_generation_id", "chapter_number", "content_type");



ALTER TABLE ONLY "public"."chapter_embeddings"
    ADD CONSTRAINT "chapter_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_images"
    ADD CONSTRAINT "chapter_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_summaries"
    ADD CONSTRAINT "chapter_summaries_ebook_generation_id_chapter_number_key" UNIQUE ("ebook_generation_id", "chapter_number");



ALTER TABLE ONLY "public"."chapter_summaries"
    ADD CONSTRAINT "chapter_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ebook_generations"
    ADD CONSTRAINT "ebook_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."published_stories"
    ADD CONSTRAINT "published_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_outlines"
    ADD CONSTRAINT "story_outlines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_state"
    ADD CONSTRAINT "story_state_ebook_generation_id_key" UNIQUE ("ebook_generation_id");



ALTER TABLE ONLY "public"."story_state"
    ADD CONSTRAINT "story_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_chapter_embeddings_chapter_number" ON "public"."chapter_embeddings" USING "btree" ("chapter_number");



CREATE INDEX "idx_chapter_embeddings_ebook_generation_id" ON "public"."chapter_embeddings" USING "btree" ("ebook_generation_id");



CREATE INDEX "idx_chapter_embeddings_user_id" ON "public"."chapter_embeddings" USING "btree" ("user_id");



CREATE INDEX "idx_chapter_embeddings_vector" ON "public"."chapter_embeddings" USING "gin" ("embedding_vector");



CREATE INDEX "idx_chapter_images_chapter_id" ON "public"."chapter_images" USING "btree" ("chapter_id");



CREATE INDEX "idx_chapter_summaries_chapter_number" ON "public"."chapter_summaries" USING "btree" ("chapter_number");



CREATE INDEX "idx_chapter_summaries_ebook_generation_id" ON "public"."chapter_summaries" USING "btree" ("ebook_generation_id");



CREATE INDEX "idx_chapter_summaries_story_outline_id" ON "public"."chapter_summaries" USING "btree" ("story_outline_id");



CREATE INDEX "idx_chapter_summaries_user_id" ON "public"."chapter_summaries" USING "btree" ("user_id");



CREATE INDEX "idx_chapters_story_id" ON "public"."chapters" USING "btree" ("story_id");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_subscription_status" ON "public"."profiles" USING "btree" ("subscription_status");



CREATE INDEX "idx_story_outlines_created_at" ON "public"."story_outlines" USING "btree" ("created_at");



CREATE INDEX "idx_story_outlines_ebook_generation_id" ON "public"."story_outlines" USING "btree" ("ebook_generation_id");



CREATE INDEX "idx_story_outlines_user_id" ON "public"."story_outlines" USING "btree" ("user_id");



CREATE INDEX "idx_story_state_current_chapter" ON "public"."story_state" USING "btree" ("current_chapter");



CREATE INDEX "idx_story_state_ebook_generation_id" ON "public"."story_state" USING "btree" ("ebook_generation_id");



CREATE INDEX "idx_story_state_story_outline_id" ON "public"."story_state" USING "btree" ("story_outline_id");



CREATE INDEX "idx_story_state_user_id" ON "public"."story_state" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."api_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profiles_updated_at"();



ALTER TABLE ONLY "public"."chapter_embeddings"
    ADD CONSTRAINT "chapter_embeddings_chapter_summary_id_fkey" FOREIGN KEY ("chapter_summary_id") REFERENCES "public"."chapter_summaries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_embeddings"
    ADD CONSTRAINT "chapter_embeddings_ebook_generation_id_fkey" FOREIGN KEY ("ebook_generation_id") REFERENCES "public"."ebook_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_embeddings"
    ADD CONSTRAINT "chapter_embeddings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_images"
    ADD CONSTRAINT "chapter_images_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_summaries"
    ADD CONSTRAINT "chapter_summaries_ebook_generation_id_fkey" FOREIGN KEY ("ebook_generation_id") REFERENCES "public"."ebook_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_summaries"
    ADD CONSTRAINT "chapter_summaries_story_outline_id_fkey" FOREIGN KEY ("story_outline_id") REFERENCES "public"."story_outlines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_summaries"
    ADD CONSTRAINT "chapter_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ebook_generations"
    ADD CONSTRAINT "ebook_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."story_outlines"
    ADD CONSTRAINT "story_outlines_ebook_generation_id_fkey" FOREIGN KEY ("ebook_generation_id") REFERENCES "public"."ebook_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_outlines"
    ADD CONSTRAINT "story_outlines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_state"
    ADD CONSTRAINT "story_state_ebook_generation_id_fkey" FOREIGN KEY ("ebook_generation_id") REFERENCES "public"."ebook_generations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_state"
    ADD CONSTRAINT "story_state_story_outline_id_fkey" FOREIGN KEY ("story_outline_id") REFERENCES "public"."story_outlines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_state"
    ADD CONSTRAINT "story_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Enable insert access for all users" ON "public"."api_settings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users" ON "public"."chapter_images" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users" ON "public"."chapters" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for all users" ON "public"."published_stories" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."api_settings" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."chapter_images" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."chapters" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."published_stories" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."api_settings" FOR UPDATE USING (true);



CREATE POLICY "Users can create their own books" ON "public"."books" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own chapter embeddings" ON "public"."chapter_embeddings" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can delete their own chapter summaries" ON "public"."chapter_summaries" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can delete their own story outlines" ON "public"."story_outlines" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can delete their own story state" ON "public"."story_state" FOR DELETE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert own credits" ON "public"."user_credits" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'sub'::"text") = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'sub'::"text") = "id"));



CREATE POLICY "Users can insert own transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'sub'::"text") = "user_id"));



CREATE POLICY "Users can insert their own chapter embeddings" ON "public"."chapter_embeddings" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert their own chapter summaries" ON "public"."chapter_summaries" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert their own story outlines" ON "public"."story_outlines" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can insert their own story state" ON "public"."story_state" FOR INSERT WITH CHECK (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update own credits" ON "public"."user_credits" FOR UPDATE USING ((("auth"."jwt"() ->> 'sub'::"text") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."jwt"() ->> 'sub'::"text") = "id"));



CREATE POLICY "Users can update their own chapter embeddings" ON "public"."chapter_embeddings" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update their own chapter summaries" ON "public"."chapter_summaries" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update their own story outlines" ON "public"."story_outlines" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can update their own story state" ON "public"."story_state" FOR UPDATE USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view own credits" ON "public"."user_credits" FOR SELECT USING ((("auth"."jwt"() ->> 'sub'::"text") = "user_id"));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING ((("auth"."jwt"() ->> 'sub'::"text") = "id"));



CREATE POLICY "Users can view own transactions" ON "public"."credit_transactions" FOR SELECT USING ((("auth"."jwt"() ->> 'sub'::"text") = "user_id"));



CREATE POLICY "Users can view their own books" ON "public"."books" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own chapter embeddings" ON "public"."chapter_embeddings" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view their own chapter summaries" ON "public"."chapter_summaries" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view their own story outlines" ON "public"."story_outlines" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



CREATE POLICY "Users can view their own story state" ON "public"."story_state" FOR SELECT USING (("user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



ALTER TABLE "public"."api_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapter_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapter_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapter_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ebook_generations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."published_stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_outlines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can delete own ebook generations" ON "public"."ebook_generations" FOR DELETE USING (true);



CREATE POLICY "users can insert own ebook generations" ON "public"."ebook_generations" FOR INSERT WITH CHECK (true);



CREATE POLICY "users can select own ebook generations" ON "public"."ebook_generations" FOR SELECT USING (true);



CREATE POLICY "users can update own ebook generations" ON "public"."ebook_generations" FOR UPDATE USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";















































































































































































































































































































GRANT ALL ON FUNCTION "public"."calculate_embedding_similarity"("embedding1" "jsonb", "embedding2" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_embedding_similarity"("embedding1" "jsonb", "embedding2" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_embedding_similarity"("embedding1" "jsonb", "embedding2" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_similar_chapters"("target_embedding" "jsonb", "ebook_generation_id_param" "uuid", "similarity_threshold" double precision, "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_similar_chapters"("target_embedding" "jsonb", "ebook_generation_id_param" "uuid", "similarity_threshold" double precision, "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_similar_chapters"("target_embedding" "jsonb", "ebook_generation_id_param" "uuid", "similarity_threshold" double precision, "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stories_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stories_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stories_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_credit_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_credit_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_credits"("p_user_id" "uuid", "p_credit_amount" integer) TO "service_role";





















GRANT ALL ON TABLE "public"."api_settings" TO "anon";
GRANT ALL ON TABLE "public"."api_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."api_settings" TO "service_role";



GRANT ALL ON TABLE "public"."books" TO "anon";
GRANT ALL ON TABLE "public"."books" TO "authenticated";
GRANT ALL ON TABLE "public"."books" TO "service_role";



GRANT ALL ON TABLE "public"."chapter_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."chapter_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."chapter_images" TO "anon";
GRANT ALL ON TABLE "public"."chapter_images" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_images" TO "service_role";



GRANT ALL ON TABLE "public"."chapter_summaries" TO "anon";
GRANT ALL ON TABLE "public"."chapter_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."ebook_generations" TO "anon";
GRANT ALL ON TABLE "public"."ebook_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."ebook_generations" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."published_stories" TO "anon";
GRANT ALL ON TABLE "public"."published_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."published_stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_outlines" TO "anon";
GRANT ALL ON TABLE "public"."story_outlines" TO "authenticated";
GRANT ALL ON TABLE "public"."story_outlines" TO "service_role";



GRANT ALL ON TABLE "public"."story_state" TO "anon";
GRANT ALL ON TABLE "public"."story_state" TO "authenticated";
GRANT ALL ON TABLE "public"."story_state" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
