export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      api_settings: {
        Row: {
          created_at: string
          deepseek_api_key: string | null
          groq_api_key: string | null
          id: string
          runware_api_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deepseek_api_key?: string | null
          groq_api_key?: string | null
          id?: string
          runware_api_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deepseek_api_key?: string | null
          groq_api_key?: string | null
          id?: string
          runware_api_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chapter_embeddings: {
        Row: {
          chapter_number: number
          chapter_summary_id: string | null
          chapter_title: string
          content_type: string | null
          created_at: string | null
          ebook_generation_id: string | null
          embedding_vector: Json | null
          id: string
          max_similarity_score: number | null
          similar_chapter_numbers: number[] | null
          text_content: string
          user_id: string
        }
        Insert: {
          chapter_number: number
          chapter_summary_id?: string | null
          chapter_title: string
          content_type?: string | null
          created_at?: string | null
          ebook_generation_id?: string | null
          embedding_vector?: Json | null
          id?: string
          max_similarity_score?: number | null
          similar_chapter_numbers?: number[] | null
          text_content: string
          user_id: string
        }
        Update: {
          chapter_number?: number
          chapter_summary_id?: string | null
          chapter_title?: string
          content_type?: string | null
          created_at?: string | null
          ebook_generation_id?: string | null
          embedding_vector?: Json | null
          id?: string
          max_similarity_score?: number | null
          similar_chapter_numbers?: number[] | null
          text_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_embeddings_chapter_summary_id_fkey"
            columns: ["chapter_summary_id"]
            isOneToOne: false
            referencedRelation: "chapter_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_embeddings_ebook_generation_id_fkey"
            columns: ["ebook_generation_id"]
            isOneToOne: false
            referencedRelation: "ebook_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_summaries: {
        Row: {
          chapter_number: number
          chapter_title: string
          chapter_word_count: number | null
          character_developments: Json | null
          created_at: string | null
          ebook_generation_id: string | null
          id: string
          key_events: string[] | null
          last_chapter_excerpt: string | null
          story_outline_id: string | null
          summary: string
          user_id: string
        }
        Insert: {
          chapter_number: number
          chapter_title: string
          chapter_word_count?: number | null
          character_developments?: Json | null
          created_at?: string | null
          ebook_generation_id?: string | null
          id?: string
          key_events?: string[] | null
          last_chapter_excerpt?: string | null
          story_outline_id?: string | null
          summary: string
          user_id: string
        }
        Update: {
          chapter_number?: number
          chapter_title?: string
          chapter_word_count?: number | null
          character_developments?: Json | null
          created_at?: string | null
          ebook_generation_id?: string | null
          id?: string
          key_events?: string[] | null
          last_chapter_excerpt?: string | null
          story_outline_id?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_summaries_ebook_generation_id_fkey"
            columns: ["ebook_generation_id"]
            isOneToOne: false
            referencedRelation: "ebook_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_summaries_story_outline_id_fkey"
            columns: ["story_outline_id"]
            isOneToOne: false
            referencedRelation: "story_outlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          amount_cents: number | null
          balance_after_transaction: number
          created_at: string
          credits: number | null
          description: string
          ebook_generation_id: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          reference_id: string | null
          samcart_order_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_cents?: number | null
          balance_after_transaction: number
          created_at?: string
          credits?: number | null
          description: string
          ebook_generation_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference_id?: string | null
          samcart_order_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_cents?: number | null
          balance_after_transaction?: number
          created_at?: string
          credits?: number | null
          description?: string
          ebook_generation_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference_id?: string | null
          samcart_order_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_generations: {
        Row: {
          author_name: string | null
          chapter_count: number | null
          chapters: Json | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          credits_used: number | null
          description: string | null
          download_count: number | null
          ebook_generation_id: string | null
          epub_url: string | null
          estimated_cost_usd: number | null
          generation_completed_at: string | null
          generation_settings: Json | null
          id: string
          image_style: string | null
          images: Json | null
          mood: string | null
          original_story_id: string | null
          paid_with_credits: boolean | null
          pdf_url: string | null
          persistence_idempotency_key: string | null
          persistence_payload_hash: string | null
          published_at: string | null
          share_count: number | null
          status: string | null
          story_id: string | null
          story_purchase_id: string | null
          story_type: string | null
          style_preferences: Json | null
          subtitle: string | null
          table_of_contents: Json | null
          title: string | null
          total_tokens_used: number | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          author_name?: string | null
          chapter_count?: number | null
          chapters?: Json | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          download_count?: number | null
          ebook_generation_id?: string | null
          epub_url?: string | null
          estimated_cost_usd?: number | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          id?: string
          image_style?: string | null
          images?: Json | null
          mood?: string | null
          original_story_id?: string | null
          paid_with_credits?: boolean | null
          pdf_url?: string | null
          persistence_idempotency_key?: string | null
          persistence_payload_hash?: string | null
          published_at?: string | null
          share_count?: number | null
          status?: string | null
          story_id?: string | null
          story_purchase_id?: string | null
          story_type?: string | null
          style_preferences?: Json | null
          subtitle?: string | null
          table_of_contents?: Json | null
          title?: string | null
          total_tokens_used?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          author_name?: string | null
          chapter_count?: number | null
          chapters?: Json | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          credits_used?: number | null
          description?: string | null
          download_count?: number | null
          ebook_generation_id?: string | null
          epub_url?: string | null
          estimated_cost_usd?: number | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          id?: string
          image_style?: string | null
          images?: Json | null
          mood?: string | null
          original_story_id?: string | null
          paid_with_credits?: boolean | null
          pdf_url?: string | null
          persistence_idempotency_key?: string | null
          persistence_payload_hash?: string | null
          published_at?: string | null
          share_count?: number | null
          status?: string | null
          story_id?: string | null
          story_purchase_id?: string | null
          story_type?: string | null
          style_preferences?: Json | null
          subtitle?: string | null
          table_of_contents?: Json | null
          title?: string | null
          total_tokens_used?: number | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ebook_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_requests: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          credits_charged: number
          error_code: string | null
          error_message: string | null
          expires_at: string
          failed_at: string | null
          id: string
          idempotency_key: string
          lease_token: string | null
          operation_type: string
          refund_transaction_id: string | null
          response_cache: Json | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          credits_charged?: number
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          failed_at?: string | null
          id?: string
          idempotency_key: string
          lease_token?: string | null
          operation_type: string
          refund_transaction_id?: string | null
          response_cache?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          credits_charged?: number
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          lease_token?: string | null
          operation_type?: string
          refund_transaction_id?: string | null
          response_cache?: Json | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_requests_refund_transaction_id_fkey"
            columns: ["refund_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_books: {
        Row: {
          author_name: string | null
          back_cover_text: string | null
          chapter_count: number | null
          chapters: Json
          cover_image_url: string | null
          created_at: string
          description: string | null
          download_count: number | null
          ebook_generation_id: string | null
          epub_url: string | null
          generation_completed_at: string | null
          generation_settings: Json | null
          generation_started_at: string | null
          id: string
          image_count: number | null
          image_style: string | null
          images: Json | null
          mobi_url: string | null
          mood: string | null
          original_story_id: string | null
          page_count: number | null
          pdf_url: string | null
          published_at: string | null
          rating_average: number | null
          rating_count: number | null
          share_count: number | null
          status: string
          style_preferences: Json | null
          subtitle: string | null
          table_of_contents: Json | null
          target_age_group: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          author_name?: string | null
          back_cover_text?: string | null
          chapter_count?: number | null
          chapters?: Json
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          ebook_generation_id?: string | null
          epub_url?: string | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          generation_started_at?: string | null
          id?: string
          image_count?: number | null
          image_style?: string | null
          images?: Json | null
          mobi_url?: string | null
          mood?: string | null
          original_story_id?: string | null
          page_count?: number | null
          pdf_url?: string | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          share_count?: number | null
          status?: string
          style_preferences?: Json | null
          subtitle?: string | null
          table_of_contents?: Json | null
          target_age_group?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          author_name?: string | null
          back_cover_text?: string | null
          chapter_count?: number | null
          chapters?: Json
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          ebook_generation_id?: string | null
          epub_url?: string | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          generation_started_at?: string | null
          id?: string
          image_count?: number | null
          image_style?: string | null
          images?: Json | null
          mobi_url?: string | null
          mood?: string | null
          original_story_id?: string | null
          page_count?: number | null
          pdf_url?: string | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          share_count?: number | null
          status?: string
          style_preferences?: Json | null
          subtitle?: string | null
          table_of_contents?: Json | null
          target_age_group?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_books_ebook_generation_id_fkey"
            columns: ["ebook_generation_id"]
            isOneToOne: false
            referencedRelation: "ebook_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credits: number
          email: string | null
          full_name: string
          id: string
          name: string
          role: string
          social_links: Json
          stories_count: number
          stripe_customer_id: string | null
          subscription_status: string
          total_likes: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string
          id: string
          name?: string
          role?: string
          social_links?: Json
          stories_count?: number
          stripe_customer_id?: string | null
          subscription_status?: string
          total_likes?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string
          id?: string
          name?: string
          role?: string
          social_links?: Json
          stories_count?: number
          stripe_customer_id?: string | null
          subscription_status?: string
          total_likes?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          ipAddress?: string | null
          token: string
          updatedAt?: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          birth_date: string | null
          character_description: string | null
          content_rating: string | null
          created_at: string
          era: string | null
          gender: string | null
          generation_completed_at: string | null
          generation_settings: Json | null
          generation_started_at: string | null
          id: string
          initial_story: string
          is_public: boolean | null
          like_count: number | null
          location: string | null
          name: string
          personality_type: string | null
          plot_description: string | null
          prompt: string | null
          prompt_data: Json | null
          reading_time_minutes: number | null
          share_count: number | null
          status: string | null
          tags: string[] | null
          title: string | null
          transformed_name: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          birth_date?: string | null
          character_description?: string | null
          content_rating?: string | null
          created_at?: string
          era?: string | null
          gender?: string | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          generation_started_at?: string | null
          id?: string
          initial_story: string
          is_public?: boolean | null
          like_count?: number | null
          location?: string | null
          name: string
          personality_type?: string | null
          plot_description?: string | null
          prompt?: string | null
          prompt_data?: Json | null
          reading_time_minutes?: number | null
          share_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          transformed_name?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          birth_date?: string | null
          character_description?: string | null
          content_rating?: string | null
          created_at?: string
          era?: string | null
          gender?: string | null
          generation_completed_at?: string | null
          generation_settings?: Json | null
          generation_started_at?: string | null
          id?: string
          initial_story?: string
          is_public?: boolean | null
          like_count?: number | null
          location?: string | null
          name?: string
          personality_type?: string | null
          plot_description?: string | null
          prompt?: string | null
          prompt_data?: Json | null
          reading_time_minutes?: number | null
          share_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          transformed_name?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_outlines: {
        Row: {
          book_description: string | null
          book_title: string
          chapter_summaries: string[]
          chapter_titles: string[]
          character_bios: Json | null
          created_at: string | null
          ebook_generation_id: string | null
          id: string
          key_themes: string[] | null
          plot_outline: string | null
          story_format: string
          theme: string | null
          total_chapters: number
          updated_at: string | null
          user_id: string
          world_info: Json | null
        }
        Insert: {
          book_description?: string | null
          book_title: string
          chapter_summaries: string[]
          chapter_titles: string[]
          character_bios?: Json | null
          created_at?: string | null
          ebook_generation_id?: string | null
          id?: string
          key_themes?: string[] | null
          plot_outline?: string | null
          story_format: string
          theme?: string | null
          total_chapters: number
          updated_at?: string | null
          user_id: string
          world_info?: Json | null
        }
        Update: {
          book_description?: string | null
          book_title?: string
          chapter_summaries?: string[]
          chapter_titles?: string[]
          character_bios?: Json | null
          created_at?: string | null
          ebook_generation_id?: string | null
          id?: string
          key_themes?: string[] | null
          plot_outline?: string | null
          story_format?: string
          theme?: string | null
          total_chapters?: number
          updated_at?: string | null
          user_id?: string
          world_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "story_outlines_ebook_generation_id_fkey"
            columns: ["ebook_generation_id"]
            isOneToOne: false
            referencedRelation: "ebook_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_outlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_state: {
        Row: {
          active_plot_threads: Json | null
          character_relationships: Json | null
          characters: Json | null
          created_at: string | null
          current_chapter: number
          current_locations: Json | null
          current_mood: string | null
          ebook_generation_id: string | null
          id: string
          major_plot_events: Json | null
          pacing_notes: string | null
          pending_conflicts: Json | null
          resolved_conflicts: Json | null
          story_outline_id: string | null
          timeline_events: Json | null
          updated_at: string | null
          user_id: string
          world_changes: Json | null
        }
        Insert: {
          active_plot_threads?: Json | null
          character_relationships?: Json | null
          characters?: Json | null
          created_at?: string | null
          current_chapter?: number
          current_locations?: Json | null
          current_mood?: string | null
          ebook_generation_id?: string | null
          id?: string
          major_plot_events?: Json | null
          pacing_notes?: string | null
          pending_conflicts?: Json | null
          resolved_conflicts?: Json | null
          story_outline_id?: string | null
          timeline_events?: Json | null
          updated_at?: string | null
          user_id: string
          world_changes?: Json | null
        }
        Update: {
          active_plot_threads?: Json | null
          character_relationships?: Json | null
          characters?: Json | null
          created_at?: string | null
          current_chapter?: number
          current_locations?: Json | null
          current_mood?: string | null
          ebook_generation_id?: string | null
          id?: string
          major_plot_events?: Json | null
          pacing_notes?: string | null
          pending_conflicts?: Json | null
          resolved_conflicts?: Json | null
          story_outline_id?: string | null
          timeline_events?: Json | null
          updated_at?: string | null
          user_id?: string
          world_changes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "story_state_ebook_generation_id_fkey"
            columns: ["ebook_generation_id"]
            isOneToOne: true
            referencedRelation: "ebook_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_state_story_outline_id_fkey"
            columns: ["story_outline_id"]
            isOneToOne: false
            referencedRelation: "story_outlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_shares: {
        Row: {
          comment_count: number
          created_at: string
          id: string
          like_count: number
          metadata: Json
          music_url: string | null
          platform: string | null
          share_count: number
          share_id: string | null
          share_url: string | null
          story_id: string | null
          text_snippet: string | null
          updated_at: string
          user_id: string | null
          video_url: string | null
          view_count: number
        }
        Insert: {
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          metadata?: Json
          music_url?: string | null
          platform?: string | null
          share_count?: number
          share_id?: string | null
          share_url?: string | null
          story_id?: string | null
          text_snippet?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          view_count?: number
        }
        Update: {
          comment_count?: number
          created_at?: string
          id?: string
          like_count?: number
          metadata?: Json
          music_url?: string | null
          platform?: string | null
          share_count?: number
          share_id?: string | null
          share_url?: string | null
          story_id?: string | null
          text_snippet?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_shares_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiktok_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          avatar_url: string | null
          createdAt: string
          credits: number | null
          email: string
          emailVerified: boolean
          id: string
          image: string | null
          name: string
          subscription_status: string | null
          updatedAt: string
        }
        Insert: {
          avatar_url?: string | null
          createdAt?: string
          credits?: number | null
          email: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          subscription_status?: string | null
          updatedAt?: string
        }
        Update: {
          avatar_url?: string | null
          createdAt?: string
          credits?: number | null
          email?: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          subscription_status?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string
          id: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          created_at?: string
          id?: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string
          id?: string
          resource_id?: string
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_credit_allowance: number
          monthly_credits_used: number
          samcart_subscription_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_starts_at: string | null
          subscription_status: string
          subscription_type: string | null
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_credit_allowance?: number
          monthly_credits_used?: number
          samcart_subscription_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string
          subscription_type?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_credit_allowance?: number
          monthly_credits_used?: number
          samcart_subscription_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string
          subscription_type?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          filename: string
          id: string
          status: string
          template: string
          text_prompt: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          status?: string
          template: string
          text_prompt: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          status?: string
          template?: string
          text_prompt?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempt_count: number
          claimed_at: string
          completed_at: string | null
          created_at: string
          event_metadata: Json
          event_type: string
          id: string
          last_error: string | null
          payload: Json | null
          payload_sha256: string | null
          processed_at: string | null
          started_at: string
          status: string
          stripe_event_id: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          claimed_at?: string
          completed_at?: string | null
          created_at?: string
          event_metadata?: Json
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json | null
          payload_sha256?: string | null
          processed_at?: string | null
          started_at?: string
          status?: string
          stripe_event_id: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          claimed_at?: string
          completed_at?: string | null
          created_at?: string
          event_metadata?: Json
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json | null
          payload_sha256?: string | null
          processed_at?: string | null
          started_at?: string
          status?: string
          stripe_event_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_retry_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          payload: Json
          processed: boolean
          processed_at: string | null
          retry_count: number
          scheduled_at: string
          updated_at: string
          webhook_id: string
          webhook_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          payload: Json
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          scheduled_at?: string
          updated_at?: string
          webhook_id: string
          webhook_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
          scheduled_at?: string
          updated_at?: string
          webhook_id?: string
          webhook_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      community_books: {
        Row: {
          author_name: string | null
          chapter_count: number | null
          cover_image_url: string | null
          created_at: string | null
          id: string | null
          published_at: string | null
          status: string | null
          subtitle: string | null
          title: string | null
          word_count: number | null
        }
        Insert: {
          author_name?: string | null
          chapter_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string | null
          published_at?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          word_count?: number | null
        }
        Update: {
          author_name?: string | null
          chapter_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string | null
          published_at?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_credit_transaction: {
        Args: {
          p_amount: number
          p_description: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_reference_id?: string
          p_stripe_payment_intent_id?: string
          p_stripe_session_id?: string
          p_stripe_subscription_id?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: {
          is_replay: boolean
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      calculate_embedding_similarity: {
        Args: { embedding1: Json; embedding2: Json }
        Returns: number
      }
      claim_generation_request: {
        Args: {
          p_credits: number
          p_idempotency_key: string
          p_metadata?: Json
          p_operation_type: string
          p_user_id: string
        }
        Returns: {
          credits_charged: number
          current_balance: number
          lease_expires_at: string
          lease_token: string
          outcome: string
          request_id: string
          response_cache: Json
          status: string
          transaction_id: string
        }[]
      }
      claim_webhook_event: {
        Args: {
          p_event_metadata?: Json
          p_event_type: string
          p_payload_sha256?: string
          p_stripe_event_id: string
        }
        Returns: {
          attempt_count: number
          claimed: boolean
          event_status: string
        }[]
      }
      complete_generation_request: {
        Args: {
          p_idempotency_key: string
          p_lease_token: string
          p_response_cache: Json
          p_user_id: string
        }
        Returns: {
          is_replay: boolean
          success: boolean
        }[]
      }
      complete_webhook_event: {
        Args: { p_stripe_event_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: {
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      fail_generation_request: {
        Args: {
          p_error_code?: string
          p_error_message?: string
          p_idempotency_key: string
          p_lease_token: string
          p_user_id: string
        }
        Returns: {
          new_balance: number
          refund_transaction_id: string
          refunded: boolean
          success: boolean
        }[]
      }
      fail_webhook_event: {
        Args: { p_last_error: string; p_stripe_event_id: string }
        Returns: boolean
      }
      find_similar_chapters: {
        Args: {
          ebook_generation_id_param: string
          limit_count?: number
          similarity_threshold?: number
          target_embedding: Json
        }
        Returns: {
          chapter_number: number
          chapter_title: string
          similarity_score: number
        }[]
      }
      persist_betterauth_generated_book: {
        Args: {
          p_book: Json
          p_generation: Json
          p_idempotency_key: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: {
          book: Json
          created: boolean
          generation: Json
        }[]
      }
      provision_betterauth_profile: {
        Args: { p_user_id: string }
        Returns: {
          created: boolean
          credits: number
          profile: Json
        }[]
      }
      record_user_activity: {
        Args: {
          p_activity_data?: Json
          p_activity_type: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_user_credits: {
        Args: { p_credit_amount: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      book_status:
        | "draft"
        | "generating"
        | "processing"
        | "completed"
        | "published"
        | "archived"
      story_status:
        | "draft"
        | "generating"
        | "completed"
        | "published"
        | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      book_status: [
        "draft",
        "generating",
        "processing",
        "completed",
        "published",
        "archived",
      ],
      story_status: [
        "draft",
        "generating",
        "completed",
        "published",
        "archived",
      ],
    },
  },
} as const
