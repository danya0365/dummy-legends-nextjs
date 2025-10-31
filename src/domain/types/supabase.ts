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
      game_cards: {
        Row: {
          card_value: number
          created_at: string | null
          id: string
          location: string
          meld_id: string | null
          owner_gamer_id: string | null
          position_in_location: number | null
          rank: Database["public"]["Enums"]["card_rank"]
          session_id: string
          suit: Database["public"]["Enums"]["card_suit"]
          updated_at: string | null
        }
        Insert: {
          card_value: number
          created_at?: string | null
          id?: string
          location: string
          meld_id?: string | null
          owner_gamer_id?: string | null
          position_in_location?: number | null
          rank: Database["public"]["Enums"]["card_rank"]
          session_id: string
          suit: Database["public"]["Enums"]["card_suit"]
          updated_at?: string | null
        }
        Update: {
          card_value?: number
          created_at?: string | null
          id?: string
          location?: string
          meld_id?: string | null
          owner_gamer_id?: string | null
          position_in_location?: number | null
          rank?: Database["public"]["Enums"]["card_rank"]
          session_id?: string
          suit?: Database["public"]["Enums"]["card_suit"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_cards_owner_gamer_id_fkey"
            columns: ["owner_gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_cards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_hands: {
        Row: {
          card_count: number
          deadwood_count: number
          deadwood_value: number
          gamer_id: string
          id: string
          melds: Json | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          card_count?: number
          deadwood_count?: number
          deadwood_value?: number
          gamer_id: string
          id?: string
          melds?: Json | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          card_count?: number
          deadwood_count?: number
          deadwood_value?: number
          gamer_id?: string
          id?: string
          melds?: Json | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_hands_gamer_id_fkey"
            columns: ["gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_hands_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_moves: {
        Row: {
          created_at: string | null
          gamer_id: string
          id: string
          move_data: Json
          move_number: number
          move_type: Database["public"]["Enums"]["game_move_type"]
          session_id: string
          time_taken_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          gamer_id: string
          id?: string
          move_data?: Json
          move_number: number
          move_type: Database["public"]["Enums"]["game_move_type"]
          session_id: string
          time_taken_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          gamer_id?: string
          id?: string
          move_data?: Json
          move_number?: number
          move_type?: Database["public"]["Enums"]["game_move_type"]
          session_id?: string
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_gamer_id_fkey"
            columns: ["gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string | null
          elo_changes: Json | null
          final_scores: Json
          game_duration_seconds: number
          id: string
          room_id: string
          session_id: string | null
          total_moves: number
          total_rounds: number
          winner_gamer_id: string | null
          winning_type: string | null
        }
        Insert: {
          created_at?: string | null
          elo_changes?: Json | null
          final_scores: Json
          game_duration_seconds: number
          id?: string
          room_id: string
          session_id?: string | null
          total_moves: number
          total_rounds: number
          winner_gamer_id?: string | null
          winning_type?: string | null
        }
        Update: {
          created_at?: string | null
          elo_changes?: Json | null
          final_scores?: Json
          game_duration_seconds?: number
          id?: string
          room_id?: string
          session_id?: string | null
          total_moves?: number
          total_rounds?: number
          winner_gamer_id?: string | null
          winning_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_winner_gamer_id_fkey"
            columns: ["winner_gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          allow_spectators: boolean
          bet_amount: number
          cards_per_player: number
          created_at: string | null
          current_player_count: number
          finished_at: string | null
          host_gamer_id: string
          id: string
          is_private: boolean
          max_players: number
          metadata: Json | null
          mode: Database["public"]["Enums"]["game_mode"]
          room_code: string
          room_name: string
          room_password: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["room_status"]
          time_limit_seconds: number
          winning_score: number
        }
        Insert: {
          allow_spectators?: boolean
          bet_amount?: number
          cards_per_player?: number
          created_at?: string | null
          current_player_count?: number
          finished_at?: string | null
          host_gamer_id: string
          id?: string
          is_private?: boolean
          max_players?: number
          metadata?: Json | null
          mode?: Database["public"]["Enums"]["game_mode"]
          room_code: string
          room_name: string
          room_password?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          time_limit_seconds?: number
          winning_score?: number
        }
        Update: {
          allow_spectators?: boolean
          bet_amount?: number
          cards_per_player?: number
          created_at?: string | null
          current_player_count?: number
          finished_at?: string | null
          host_gamer_id?: string
          id?: string
          is_private?: boolean
          max_players?: number
          metadata?: Json | null
          mode?: Database["public"]["Enums"]["game_mode"]
          room_code?: string
          room_name?: string
          room_password?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          time_limit_seconds?: number
          winning_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_host_gamer_id_fkey"
            columns: ["host_gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          current_turn_gamer_id: string | null
          current_turn_started_at: string | null
          discard_pile_top_card_id: string | null
          finished_at: string | null
          game_state: Json | null
          id: string
          is_active: boolean
          remaining_deck_cards: number
          room_id: string
          round_number: number
          started_at: string | null
          winner_gamer_id: string | null
          winning_type: string | null
        }
        Insert: {
          current_turn_gamer_id?: string | null
          current_turn_started_at?: string | null
          discard_pile_top_card_id?: string | null
          finished_at?: string | null
          game_state?: Json | null
          id?: string
          is_active?: boolean
          remaining_deck_cards?: number
          room_id: string
          round_number?: number
          started_at?: string | null
          winner_gamer_id?: string | null
          winning_type?: string | null
        }
        Update: {
          current_turn_gamer_id?: string | null
          current_turn_started_at?: string | null
          discard_pile_top_card_id?: string | null
          finished_at?: string | null
          game_state?: Json | null
          id?: string
          is_active?: boolean
          remaining_deck_cards?: number
          room_id?: string
          round_number?: number
          started_at?: string | null
          winner_gamer_id?: string | null
          winning_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_current_turn_gamer_id_fkey"
            columns: ["current_turn_gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_winner_gamer_id_fkey"
            columns: ["winner_gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
        ]
      }
      gamer_achievements: {
        Row: {
          achievement_code: string
          achievement_description: string | null
          achievement_name: string
          created_at: string | null
          gamer_id: string
          id: string
          is_completed: boolean
          progress: number
          reward_data: Json | null
          reward_experience: number
          target: number
          unlocked_at: string | null
        }
        Insert: {
          achievement_code: string
          achievement_description?: string | null
          achievement_name: string
          created_at?: string | null
          gamer_id: string
          id?: string
          is_completed?: boolean
          progress?: number
          reward_data?: Json | null
          reward_experience?: number
          target: number
          unlocked_at?: string | null
        }
        Update: {
          achievement_code?: string
          achievement_description?: string | null
          achievement_name?: string
          created_at?: string | null
          gamer_id?: string
          id?: string
          is_completed?: boolean
          progress?: number
          reward_data?: Json | null
          reward_experience?: number
          target?: number
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamer_achievements_gamer_id_fkey"
            columns: ["gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
        ]
      }
      gamers: {
        Row: {
          best_win_streak: number
          created_at: string | null
          current_win_streak: number
          elo_rating: number
          experience_points: number
          guest_display_name: string | null
          guest_identifier: string | null
          id: string
          last_active_at: string | null
          level: number
          preferences: Json
          profile_id: string | null
          total_draws: number
          total_games_played: number
          total_gins: number
          total_knocks: number
          total_losses: number
          total_points_scored: number
          total_wins: number
          updated_at: string | null
        }
        Insert: {
          best_win_streak?: number
          created_at?: string | null
          current_win_streak?: number
          elo_rating?: number
          experience_points?: number
          guest_display_name?: string | null
          guest_identifier?: string | null
          id?: string
          last_active_at?: string | null
          level?: number
          preferences?: Json
          profile_id?: string | null
          total_draws?: number
          total_games_played?: number
          total_gins?: number
          total_knocks?: number
          total_losses?: number
          total_points_scored?: number
          total_wins?: number
          updated_at?: string | null
        }
        Update: {
          best_win_streak?: number
          created_at?: string | null
          current_win_streak?: number
          elo_rating?: number
          experience_points?: number
          guest_display_name?: string | null
          guest_identifier?: string | null
          id?: string
          last_active_at?: string | null
          level?: number
          preferences?: Json
          profile_id?: string | null
          total_draws?: number
          total_games_played?: number
          total_gins?: number
          total_knocks?: number
          total_losses?: number
          total_points_scored?: number
          total_wins?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
          current_score: number
          gamer_id: string
          id: string
          is_host: boolean
          is_ready: boolean
          joined_at: string | null
          left_at: string | null
          position: number
          room_id: string
          rounds_won: number
          status: Database["public"]["Enums"]["player_status"]
        }
        Insert: {
          current_score?: number
          gamer_id: string
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string | null
          left_at?: string | null
          position: number
          room_id: string
          rounds_won?: number
          status?: Database["public"]["Enums"]["player_status"]
        }
        Update: {
          current_score?: number
          gamer_id?: string
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string | null
          left_at?: string | null
          position?: number
          room_id?: string
          rounds_won?: number
          status?: Database["public"]["Enums"]["player_status"]
        }
        Relationships: [
          {
            foreignKeyName: "room_players_gamer_id_fkey"
            columns: ["gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
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
      room_spectators: {
        Row: {
          gamer_id: string
          id: string
          joined_at: string | null
          room_id: string
        }
        Insert: {
          gamer_id: string
          id?: string
          joined_at?: string | null
          room_id: string
        }
        Update: {
          gamer_id?: string
          id?: string
          joined_at?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_spectators_gamer_id_fkey"
            columns: ["gamer_id"]
            isOneToOne: false
            referencedRelation: "gamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_spectators_room_id_fkey"
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
      can_access_gamer: {
        Args: { p_gamer_id: string; p_guest_identifier?: string }
        Returns: boolean
      }
      create_game_room: {
        Args: {
          p_gamer_id: string
          p_room_name: string
          p_guest_identifier?: string
          p_mode?: Database["public"]["Enums"]["game_mode"]
          p_max_players?: number
          p_bet_amount?: number
          p_time_limit_seconds?: number
          p_is_private?: boolean
          p_room_password?: string
        }
        Returns: {
          room_id: string
          room_code: string
        }[]
      }
      create_or_get_gamer: {
        Args: {
          p_guest_identifier?: string
          p_guest_display_name?: string
          p_profile_id?: string
        }
        Returns: {
          gamer_id: string
          is_new: boolean
        }[]
      }
      create_profile: {
        Args: { username: string; full_name?: string; avatar_url?: string }
        Returns: string
      }
      discard_card: {
        Args: {
          p_session_id: string
          p_gamer_id: string
          p_card_id: string
          p_guest_identifier?: string
        }
        Returns: boolean
      }
      draw_card: {
        Args: {
          p_session_id: string
          p_gamer_id: string
          p_from_deck?: boolean
          p_guest_identifier?: string
        }
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
      get_active_session_for_room: {
        Args: {
          p_room_id: string
          p_gamer_id: string
          p_guest_identifier?: string
        }
        Returns: string
      }
      get_auth_user_by_id: {
        Args: { p_id: string }
        Returns: Json
      }
      get_available_rooms: {
        Args: {
          p_mode?: Database["public"]["Enums"]["game_mode"]
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          room_code: string
          room_name: string
          host_gamer_id: string
          status: Database["public"]["Enums"]["room_status"]
          mode: Database["public"]["Enums"]["game_mode"]
          current_player_count: number
          max_players: number
          bet_amount: number
          created_at: string
        }[]
      }
      get_card_value: {
        Args: { p_rank: Database["public"]["Enums"]["card_rank"] }
        Returns: number
      }
      get_game_state: {
        Args: {
          p_session_id: string
          p_gamer_id: string
          p_guest_identifier?: string
        }
        Returns: Json
      }
      get_latest_room_for_gamer: {
        Args: { p_gamer_id: string; p_guest_identifier?: string }
        Returns: {
          room_id: string
          session_id: string
          room_status: Database["public"]["Enums"]["room_status"]
          session_status: string
          last_joined_at: string
          last_active_at: string
        }[]
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
        Args: {
          p_gamer_id: string
          p_guest_identifier?: string
          p_room_code?: string
          p_room_id?: string
          p_room_password?: string
        }
        Returns: string
      }
      leave_game_room: {
        Args: {
          p_gamer_id: string
          p_room_id: string
          p_guest_identifier?: string
        }
        Returns: boolean
      }
      link_guest_to_profile: {
        Args: { p_guest_identifier: string; p_profile_id: string }
        Returns: boolean
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
      start_game_session: {
        Args: {
          p_room_id: string
          p_host_gamer_id: string
          p_guest_identifier?: string
        }
        Returns: string
      }
      toggle_ready_status: {
        Args: {
          p_gamer_id: string
          p_room_id: string
          p_guest_identifier?: string
        }
        Returns: boolean
      }
      update_gamer_preferences: {
        Args: {
          p_gamer_id: string
          p_preferences: Json
          p_guest_identifier?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      card_rank:
        | "A"
        | "2"
        | "3"
        | "4"
        | "5"
        | "6"
        | "7"
        | "8"
        | "9"
        | "10"
        | "J"
        | "Q"
        | "K"
      card_suit: "hearts" | "diamonds" | "clubs" | "spades"
      game_mode: "casual" | "ranked" | "tournament" | "private"
      game_move_type:
        | "draw_deck"
        | "draw_discard"
        | "discard"
        | "meld"
        | "lay_off"
        | "knock"
        | "gin"
      player_status: "waiting" | "ready" | "playing" | "disconnected" | "left"
      profile_role: "user" | "moderator" | "admin"
      room_status: "waiting" | "ready" | "playing" | "finished" | "cancelled"
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
      card_rank: [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ],
      card_suit: ["hearts", "diamonds", "clubs", "spades"],
      game_mode: ["casual", "ranked", "tournament", "private"],
      game_move_type: [
        "draw_deck",
        "draw_discard",
        "discard",
        "meld",
        "lay_off",
        "knock",
        "gin",
      ],
      player_status: ["waiting", "ready", "playing", "disconnected", "left"],
      profile_role: ["user", "moderator", "admin"],
      room_status: ["waiting", "ready", "playing", "finished", "cancelled"],
    },
  },
} as const

