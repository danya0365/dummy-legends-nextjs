-- =====================================================
-- Dummy Legends - Part 1: Enums and Gamers Table
-- Created: 2025-10-30
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE public.room_status AS ENUM ('waiting', 'ready', 'playing', 'finished', 'cancelled');
CREATE TYPE public.player_status AS ENUM ('waiting', 'ready', 'playing', 'disconnected', 'left');
CREATE TYPE public.game_mode AS ENUM ('casual', 'ranked', 'tournament', 'private');
CREATE TYPE public.card_suit AS ENUM ('hearts', 'diamonds', 'clubs', 'spades');
CREATE TYPE public.card_rank AS ENUM ('A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K');
CREATE TYPE public.game_move_type AS ENUM ('draw_deck', 'draw_discard', 'discard', 'meld', 'lay_off', 'knock', 'gin');

-- =====================================================
-- GAMERS TABLE - Core identity for all players
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gamers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Optional link to authenticated profile (nullable for guests)
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Guest player info (required when profile_id IS NULL)
  guest_display_name TEXT,
  guest_identifier TEXT, -- Client-generated unique ID stored in localStorage
  
  -- Game statistics
  level INTEGER NOT NULL DEFAULT 1,
  experience_points INTEGER NOT NULL DEFAULT 0,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_draws INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  total_points_scored INTEGER NOT NULL DEFAULT 0,
  total_gins INTEGER NOT NULL DEFAULT 0,
  total_knocks INTEGER NOT NULL DEFAULT 0,
  
  -- Preferences
  preferences JSONB NOT NULL DEFAULT '{
    "avatar": null,
    "sound_enabled": true,
    "music_enabled": true,
    "auto_sort_cards": true,
    "show_hints": true
  }'::jsonb,
  
  -- Timestamps
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints: Either has profile OR is guest with identifier
  CONSTRAINT gamers_profile_id_key UNIQUE (profile_id),
  CONSTRAINT gamers_guest_identifier_key UNIQUE (guest_identifier),
  CONSTRAINT gamers_identity_check CHECK (
    (profile_id IS NOT NULL) OR 
    (profile_id IS NULL AND guest_display_name IS NOT NULL AND guest_identifier IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_gamers_profile_id ON public.gamers(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_gamers_guest_identifier ON public.gamers(guest_identifier) WHERE guest_identifier IS NOT NULL;
CREATE INDEX idx_gamers_elo_rating ON public.gamers(elo_rating DESC);
CREATE INDEX idx_gamers_last_active ON public.gamers(last_active_at DESC);

-- Trigger
CREATE TRIGGER update_gamers_updated_at
  BEFORE UPDATE ON public.gamers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION FOR SECURITY
-- =====================================================

-- Check if user can access gamer record
CREATE OR REPLACE FUNCTION public.can_access_gamer(
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  gamer_profile_id UUID;
  active_profile_id UUID;
  gamer_guest_id TEXT;
BEGIN
  -- Get gamer info
  SELECT profile_id, guest_identifier 
  INTO gamer_profile_id, gamer_guest_id
  FROM public.gamers
  WHERE id = p_gamer_id;
  
  -- If gamer is authenticated
  IF gamer_profile_id IS NOT NULL THEN
    active_profile_id := public.get_active_profile_id();
    RETURN active_profile_id = gamer_profile_id;
  END IF;
  
  -- If gamer is guest, check identifier match
  RETURN p_guest_identifier IS NOT NULL AND gamer_guest_id = p_guest_identifier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.gamers ENABLE ROW LEVEL SECURITY;

-- Anyone can view gamers (leaderboard, player lists)
CREATE POLICY "gamers_select_all"
  ON public.gamers FOR SELECT
  USING (true);

-- Anyone can create gamer (for guests)
CREATE POLICY "gamers_insert_all"
  ON public.gamers FOR INSERT
  WITH CHECK (true);

-- Can update own gamer (authenticated users)
CREATE POLICY "gamers_update_own"
  ON public.gamers FOR UPDATE
  USING (profile_id IS NOT NULL AND profile_id = public.get_active_profile_id());
