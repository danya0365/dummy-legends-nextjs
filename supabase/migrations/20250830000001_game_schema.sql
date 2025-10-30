-- Dummy Legends Game Schema
-- Created: 2025-08-30
-- Description: Schema for real-time multiplayer Dummy card game

-- Create game-related enums
CREATE TYPE public.room_status AS ENUM ('waiting', 'ready', 'playing', 'finished');
CREATE TYPE public.player_status AS ENUM ('waiting', 'ready', 'playing', 'disconnected');
CREATE TYPE public.game_mode AS ENUM ('casual', 'ranked', 'tournament', 'private');
CREATE TYPE public.card_suit AS ENUM ('hearts', 'diamonds', 'clubs', 'spades');

-- Game Rooms Table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 6-digit room code
  name TEXT NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.room_status NOT NULL DEFAULT 'waiting',
  mode public.game_mode NOT NULL DEFAULT 'casual',
  
  -- Room settings as JSONB
  settings JSONB NOT NULL DEFAULT '{
    "maxPlayers": 4,
    "betAmount": 100,
    "timeLimit": 60,
    "isPrivate": false,
    "password": null,
    "allowSpectators": true
  }'::jsonb,
  
  current_player_count INTEGER NOT NULL DEFAULT 1,
  max_player_count INTEGER NOT NULL DEFAULT 4 CHECK (max_player_count BETWEEN 2 AND 4),
  
  spectators TEXT[] DEFAULT '{}', -- array of user IDs
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Players Table (join table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  status public.player_status NOT NULL DEFAULT 'waiting',
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 3), -- 0-3 for max 4 players
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, position)
);

-- Game States Table (stores actual game state during play)
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Game state as JSONB for flexibility
  deck JSONB NOT NULL DEFAULT '[]'::jsonb, -- remaining cards in deck
  discard_pile JSONB NOT NULL DEFAULT '[]'::jsonb, -- face-up discarded cards
  
  current_turn_user_id UUID REFERENCES auth.users(id),
  turn_start_time TIMESTAMP WITH TIME ZONE,
  round INTEGER NOT NULL DEFAULT 1,
  
  -- Player hands stored separately for security
  -- We'll use RPC functions to get only the current player's hand
  player_hands JSONB NOT NULL DEFAULT '{}'::jsonb,
  player_melds JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Actions Log (for replay and debugging)
CREATE TABLE IF NOT EXISTS public.game_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  action_type TEXT NOT NULL, -- 'draw', 'discard', 'meld', 'knock', 'gin'
  action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Statistics Table
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  elo INTEGER NOT NULL DEFAULT 1000,
  
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_lost INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  total_score INTEGER NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_mode ON public.game_rooms(mode);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON public.game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_host_id ON public.game_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_id ON public.room_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_room_id ON public.game_states(room_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_room_id ON public.game_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_game_rooms_updated_at
BEFORE UPDATE ON public.game_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_states_updated_at
BEFORE UPDATE ON public.game_states
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
BEFORE UPDATE ON public.player_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update player count when players join/leave
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_rooms
    SET current_player_count = (
      SELECT COUNT(*) FROM public.room_players WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_rooms
    SET current_player_count = (
      SELECT COUNT(*) FROM public.room_players WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update player count
CREATE TRIGGER update_room_player_count_on_change
AFTER INSERT OR DELETE ON public.room_players
FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- Function to create player stats when user joins first time
CREATE OR REPLACE FUNCTION create_player_stats_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (user_id, profile_id)
  VALUES (NEW.user_id, NEW.profile_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create player stats
CREATE TRIGGER create_player_stats_on_first_join
AFTER INSERT ON public.room_players
FOR EACH ROW EXECUTE FUNCTION create_player_stats_if_not_exists();

-- Comment on tables
COMMENT ON TABLE public.game_rooms IS 'Stores game room information';
COMMENT ON TABLE public.room_players IS 'Stores players in each room';
COMMENT ON TABLE public.game_states IS 'Stores current game state for active games';
COMMENT ON TABLE public.game_actions IS 'Logs all game actions for replay and debugging';
COMMENT ON TABLE public.player_stats IS 'Stores player statistics and progression';
