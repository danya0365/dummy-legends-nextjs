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
      game_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          created_at?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_actions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          code: string
          created_at: string | null
          current_player_count: number
          finished_at: string | null
          host_id: string
          id: string
          max_player_count: number
          mode: Database["public"]["Enums"]["game_mode"]
          name: string
          settings: Json
          spectators: string[] | null
          started_at: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_player_count?: number
          finished_at?: string | null
          host_id: string
          id?: string
          max_player_count?: number
          mode?: Database["public"]["Enums"]["game_mode"]
          name: string
          settings?: Json
          spectators?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_player_count?: number
          finished_at?: string | null
          host_id?: string
          id?: string
          max_player_count?: number
          mode?: Database["public"]["Enums"]["game_mode"]
          name?: string
          settings?: Json
          spectators?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      game_states: {
        Row: {
          created_at: string | null
          current_turn_user_id: string | null
          deck: Json
          discard_pile: Json
          id: string
          player_hands: Json
          player_melds: Json
          room_id: string
          round: number
          scores: Json
          turn_start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_turn_user_id?: string | null
          deck?: Json
          discard_pile?: Json
          id?: string
          player_hands?: Json
          player_melds?: Json
          room_id: string
          round?: number
          scores?: Json
          turn_start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_turn_user_id?: string | null
          deck?: Json
          discard_pile?: Json
          id?: string
          player_hands?: Json
          player_melds?: Json
          room_id?: string
          round?: number
          scores?: Json
          turn_start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          coins: number
          created_at: string | null
          elo: number
          exp: number
          games_lost: number
          games_played: number
          games_won: number
          highest_score: number
          id: string
          level: number
          profile_id: string | null
          rank: number
          total_score: number
          updated_at: string | null
          user_id: string
          win_rate: number
        }
        Insert: {
          coins?: number
          created_at?: string | null
          elo?: number
          exp?: number
          games_lost?: number
          games_played?: number
          games_won?: number
          highest_score?: number
          id?: string
          level?: number
          profile_id?: string | null
          rank?: number
          total_score?: number
          updated_at?: string | null
          user_id: string
          win_rate?: number
        }
        Update: {
          coins?: number
          created_at?: string | null
          elo?: number
          exp?: number
          games_lost?: number
          games_played?: number
          games_won?: number
          highest_score?: number
          id?: string
          level?: number
          profile_id?: string | null
          rank?: number
          total_score?: number
          updated_at?: string | null
          user_id?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["profile_role"]
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }
        Insert: {
          address?: string | null
          auth_id: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          login_count?: number
          phone?: string | null
          preferences?: Json
          privacy_settings?: Json
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
        }
        Update: {
          address?: string | null
          auth_id?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          login_count?: number
          phone?: string | null
          preferences?: Json
          privacy_settings?: Json
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      room_players: {
        Row: {
          id: string
          is_host: boolean
          is_ready: boolean
          joined_at: string | null
          left_at: string | null
          position: number
          profile_id: string | null
          room_id: string
          status: Database["public"]["Enums"]["player_status"]
          user_id: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string | null
          left_at?: string | null
          position: number
          profile_id?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["player_status"]
          user_id: string
        }
        Update: {
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string | null
          left_at?: string | null
          position?: number
          profile_id?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["player_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_game_room: {
        Args: {
          p_name: string
          p_mode: Database["public"]["Enums"]["game_mode"]
          p_max_players?: number
          p_bet_amount?: number
          p_time_limit?: number
          p_is_private?: boolean
          p_password?: string
          p_allow_spectators?: boolean
        }
        Returns: Json
      }
      create_profile: {
        Args: { username: string; full_name?: string; avatar_url?: string }
        Returns: string
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }[]
      }
      get_active_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_profile_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_auth_user_by_id: {
        Args: { p_id: string }
        Returns: Json
      }
      get_available_rooms: {
        Args: {
          p_mode?: Database["public"]["Enums"]["game_mode"]
          p_limit?: number
        }
        Returns: Json
      }
      get_paginated_users: {
        Args: { p_page?: number; p_limit?: number }
        Returns: Json
      }
      get_profile_role: {
        Args: { profile_id: string }
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_room_details: {
        Args: { p_room_id: string }
        Returns: Json
      }
      get_user_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_moderator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      join_game_room: {
        Args: { p_room_id?: string; p_room_code?: string; p_password?: string }
        Returns: Json
      }
      leave_game_room: {
        Args: { p_room_id: string }
        Returns: Json
      }
      migrate_profile_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_profile_active: {
        Args: { profile_id: string }
        Returns: boolean
      }
      set_profile_role: {
        Args: {
          target_profile_id: string
          new_role: Database["public"]["Enums"]["profile_role"]
        }
        Returns: boolean
      }
      start_game: {
        Args: { p_room_id: string }
        Returns: Json
      }
      toggle_ready_status: {
        Args: { p_room_id: string }
        Returns: Json
      }
    }
    Enums: {
      card_suit: "hearts" | "diamonds" | "clubs" | "spades"
      game_mode: "casual" | "ranked" | "tournament" | "private"
      player_status: "waiting" | "ready" | "playing" | "disconnected"
      profile_role: "user" | "moderator" | "admin"
      room_status: "waiting" | "ready" | "playing" | "finished"
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
    Enums: {
      card_suit: ["hearts", "diamonds", "clubs", "spades"],
      game_mode: ["casual", "ranked", "tournament", "private"],
      player_status: ["waiting", "ready", "playing", "disconnected"],
      profile_role: ["user", "moderator", "admin"],
      room_status: ["waiting", "ready", "playing", "finished"],
    },
  },
} as const

