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
      books: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          preview: boolean | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          preview?: boolean | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          preview?: boolean | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_images: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          image_url: string
          prompt_used: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          image_url: string
          prompt_used: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          image_url?: string
          prompt_used?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_images_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_generations: {
        Row: {
          id: string
          user_id: string
          story_id: string
          title: string
          content: Json | string
          status: string
          credits_used: number | null
          paid_with_credits: boolean | null
          transaction_id: string | null
          story_type: string | null
          chapter_count: number | null
          word_count: number | null
          total_tokens_used: number | null
          estimated_cost_usd: number | null
          story_purchase_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          title: string
          content: Json | string
          status?: string
          credits_used?: number | null
          paid_with_credits?: boolean | null
          transaction_id?: string | null
          story_type?: string | null
          chapter_count?: number | null
          word_count?: number | null
          total_tokens_used?: number | null
          estimated_cost_usd?: number | null
          story_purchase_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          title?: string
          content?: Json | string
          status?: string
          credits_used?: number | null
          paid_with_credits?: boolean | null
          transaction_id?: string | null
          story_type?: string | null
          chapter_count?: number | null
          word_count?: number | null
          total_tokens_used?: number | null
          estimated_cost_usd?: number | null
          story_purchase_id?: string | null
          created_at?: string
          updated_at?: string
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
      memory_books: {
        Row: {
          id: string
          user_id: string
          original_story_id: string | null
          ebook_generation_id: string | null
          title: string
          description: string | null
          subtitle: string | null
          author_name: string | null
          chapters: Json
          table_of_contents: Json | null
          cover_image_url: string | null
          back_cover_text: string | null
          generation_settings: Json | null
          style_preferences: Json | null
          image_style: string | null
          mood: string | null
          target_age_group: string | null
          page_count: number | null
          chapter_count: number | null
          word_count: number | null
          image_count: number | null
          status: string
          generation_started_at: string | null
          generation_completed_at: string | null
          published_at: string | null
          pdf_url: string | null
          epub_url: string | null
          mobi_url: string | null
          images: Json | null
          view_count: number | null
          download_count: number | null
          share_count: number | null
          rating_average: number | null
          rating_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_story_id?: string | null
          ebook_generation_id?: string | null
          title: string
          description?: string | null
          subtitle?: string | null
          author_name?: string | null
          chapters: Json
          table_of_contents?: Json | null
          cover_image_url?: string | null
          back_cover_text?: string | null
          generation_settings?: Json | null
          style_preferences?: Json | null
          image_style?: string | null
          mood?: string | null
          target_age_group?: string | null
          page_count?: number | null
          chapter_count?: number | null
          word_count?: number | null
          image_count?: number | null
          status?: string
          generation_started_at?: string | null
          generation_completed_at?: string | null
          published_at?: string | null
          pdf_url?: string | null
          epub_url?: string | null
          mobi_url?: string | null
          images?: Json | null
          view_count?: number | null
          download_count?: number | null
          share_count?: number | null
          rating_average?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_story_id?: string | null
          ebook_generation_id?: string | null
          title?: string
          description?: string | null
          subtitle?: string | null
          author_name?: string | null
          chapters?: Json
          table_of_contents?: Json | null
          cover_image_url?: string | null
          back_cover_text?: string | null
          generation_settings?: Json | null
          style_preferences?: Json | null
          image_style?: string | null
          mood?: string | null
          target_age_group?: string | null
          page_count?: number | null
          chapter_count?: number | null
          word_count?: number | null
          image_count?: number | null
          status?: string
          generation_started_at?: string | null
          generation_completed_at?: string | null
          published_at?: string | null
          pdf_url?: string | null
          epub_url?: string | null
          mobi_url?: string | null
          images?: Json | null
          view_count?: number | null
          download_count?: number | null
          share_count?: number | null
          rating_average?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string
          id: string
          story_id: string
          title: string
        }
        Insert: {
          chapter_number: number
          content: string
          created_at?: string
          id?: string
          story_id: string
          title: string
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string
          id?: string
          story_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_added: number
          id: string
          status: string
          stripe_payment_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_added: number
          id?: string
          status: string
          stripe_payment_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_added?: number
          id?: string
          status?: string
          stripe_payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
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
          created_at: string | null
          credits: number | null
          id: string
          stories_count: number | null
          total_likes: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits?: number | null
          id: string
          stories_count?: number | null
          total_likes?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          credits?: number | null
          id?: string
          stories_count?: number | null
          total_likes?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      published_stories: {
        Row: {
          chapters: Json
          created_at: string
          id: string
          original_story: string
          story_id: string | null
          updated_at: string
        }
        Insert: {
          chapters: Json
          created_at?: string
          id?: string
          original_story: string
          story_id?: string | null
          updated_at?: string
        }
        Update: {
          chapters?: Json
          created_at?: string
          id?: string
          original_story?: string
          story_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          initial_story: string
          name: string
          prompt: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          initial_story: string
          name: string
          prompt: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          initial_story?: string
          name?: string
          prompt?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tiktok_shares: {
        Row: {
          created_at: string
          id: string
          music_url: string | null
          text_snippet: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          music_url?: string | null
          text_snippet?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          music_url?: string | null
          text_snippet?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
