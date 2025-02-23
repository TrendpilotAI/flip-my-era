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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
