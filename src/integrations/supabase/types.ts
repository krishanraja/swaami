export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      endorsements: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          endorsed_id: string | null
          endorser_id: string
          expires_at: string | null
          id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          endorsed_id?: string | null
          endorser_id: string
          expires_at?: string | null
          id?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          endorsed_id?: string | null
          endorser_id?: string
          expires_at?: string | null
          id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          helper_id: string
          id: string
          status: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          helper_id: string
          id?: string
          status?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          helper_id?: string
          id?: string
          status?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      neighbourhoods: {
        Row: {
          city: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          channel: string
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          channel?: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          channel?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          city: string | null
          created_at: string | null
          credits: number | null
          display_name: string | null
          id: string
          is_demo: boolean | null
          neighbourhood: string | null
          phone: string | null
          radius: number | null
          reliability_score: number | null
          skills: string[] | null
          tasks_completed: number | null
          trust_tier: Database["public"]["Enums"]["trust_tier"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          city?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          id?: string
          is_demo?: boolean | null
          neighbourhood?: string | null
          phone?: string | null
          radius?: number | null
          reliability_score?: number | null
          skills?: string[] | null
          tasks_completed?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          city?: string | null
          created_at?: string | null
          credits?: number | null
          display_name?: string | null
          id?: string
          is_demo?: boolean | null
          neighbourhood?: string | null
          phone?: string | null
          radius?: number | null
          reliability_score?: number | null
          skills?: string[] | null
          tasks_completed?: number | null
          trust_tier?: Database["public"]["Enums"]["trust_tier"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          connected_at: string | null
          id: string
          provider: string
          provider_id: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          id?: string
          provider: string
          provider_id: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          id?: string
          provider?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          access_instructions: string | null
          approx_address: string | null
          availability_time: string | null
          category: string | null
          created_at: string | null
          description: string | null
          helper_id: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          original_description: string | null
          owner_id: string
          people_needed: number | null
          physical_level: string | null
          status: string | null
          time_estimate: string | null
          title: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          access_instructions?: string | null
          approx_address?: string | null
          availability_time?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          helper_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          original_description?: string | null
          owner_id: string
          people_needed?: number | null
          physical_level?: string | null
          status?: string | null
          time_estimate?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          access_instructions?: string | null
          approx_address?: string | null
          availability_time?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          helper_id?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          original_description?: string | null
          owner_id?: string
          people_needed?: number | null
          physical_level?: string | null
          status?: string | null
          time_estimate?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_helper_id_fkey"
            columns: ["helper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_photos: {
        Row: {
          id: string
          photo_type: string
          photo_url: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          photo_type: string
          photo_url: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          photo_type?: string
          photo_url?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          posts_reset_at: string
          posts_used_this_month: number
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          posts_reset_at?: string
          posts_used_this_month?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          posts_reset_at?: string
          posts_used_this_month?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          id: string
          metadata: Json | null
          user_id: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          user_id: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          user_id?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trust_tier: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["trust_tier"]
      }
      get_all_public_profiles: {
        Args: never
        Returns: {
          availability: string
          city: string
          created_at: string
          credits: number
          display_name: string
          id: string
          is_demo: boolean
          neighbourhood: string
          radius: number
          reliability_score: number
          skills: string[]
          tasks_completed: number
          trust_tier: Database["public"]["Enums"]["trust_tier"]
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { p_profile_id: string }
        Returns: {
          availability: string
          city: string
          created_at: string
          credits: number
          display_name: string
          id: string
          is_demo: boolean
          neighbourhood: string
          radius: number
          reliability_score: number
          skills: string[]
          tasks_completed: number
          trust_tier: Database["public"]["Enums"]["trust_tier"]
          user_id: string
        }[]
      }
      get_public_tasks: {
        Args: never
        Returns: {
          approx_address: string
          category: string
          created_at: string
          description: string
          id: string
          original_description: string
          owner_display_name: string
          owner_id: string
          owner_is_demo: boolean
          owner_photo_url: string
          owner_reliability_score: number
          owner_trust_tier: Database["public"]["Enums"]["trust_tier"]
          status: string
          time_estimate: string
          title: string
          updated_at: string
          urgency: string
        }[]
      }
      get_task_with_location: {
        Args: { p_task_id: string }
        Returns: {
          approx_address: string
          category: string
          created_at: string
          description: string
          id: string
          location_lat: number
          location_lng: number
          owner_id: string
          status: string
          time_estimate: string
          title: string
          urgency: string
        }[]
      }
      get_user_profile_id: { Args: { user_uuid: string }; Returns: string }
      user_is_helper_on_task: {
        Args: { task_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_is_match_helper: {
        Args: { match_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_owns_match_task: {
        Args: { match_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_owns_task: {
        Args: { task_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_status: "free" | "active" | "cancelled" | "past_due"
      trust_tier: "tier_0" | "tier_1" | "tier_2"
      verification_type:
        | "email"
        | "phone_sms"
        | "phone_whatsapp"
        | "social_google"
        | "social_apple"
        | "photos_complete"
        | "endorsement"
        | "mfa_enabled"
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
      subscription_status: ["free", "active", "cancelled", "past_due"],
      trust_tier: ["tier_0", "tier_1", "tier_2"],
      verification_type: [
        "email",
        "phone_sms",
        "phone_whatsapp",
        "social_google",
        "social_apple",
        "photos_complete",
        "endorsement",
        "mfa_enabled",
      ],
    },
  },
} as const
