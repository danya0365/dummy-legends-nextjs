-- =====================================================
-- Dummy Legends - Part 2: Game Rooms and Players
-- Created: 2025-10-30
-- =====================================================

-- =====================================================
-- GAME ROOMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  host_gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  status public.room_status NOT NULL DEFAULT 'waiting',
  mode public.game_mode NOT NULL DEFAULT 'casual',
  
  -- Room settings
  max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 4),
  current_player_count INTEGER NOT NULL DEFAULT 0,
  bet_amount INTEGER NOT NULL DEFAULT 0,
  time_limit_seconds INTEGER NOT NULL DEFAULT 60,
  is_private BOOLEAN NOT NULL DEFAULT false,
  room_password TEXT,
  allow_spectators BOOLEAN NOT NULL DEFAULT true,
  
  -- Game config
  cards_per_player INTEGER NOT NULL DEFAULT 10,
  winning_score INTEGER NOT NULL DEFAULT 100,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- ROOM PLAYERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  status public.player_status NOT NULL DEFAULT 'waiting',
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 3),
  
  current_score INTEGER NOT NULL DEFAULT 0,
  rounds_won INTEGER NOT NULL DEFAULT 0,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT room_players_unique UNIQUE (room_id, gamer_id),
  CONSTRAINT room_players_position_unique UNIQUE (room_id, position)
);

-- =====================================================
-- ROOM SPECTATORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.room_spectators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT room_spectators_unique UNIQUE (room_id, gamer_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX idx_game_rooms_mode ON public.game_rooms(mode);
CREATE INDEX idx_game_rooms_host ON public.game_rooms(host_gamer_id);
CREATE INDEX idx_game_rooms_code ON public.game_rooms(room_code);
CREATE INDEX idx_game_rooms_active ON public.game_rooms(status) WHERE status IN ('waiting', 'ready', 'playing');
CREATE INDEX idx_room_players_room ON public.room_players(room_id);
CREATE INDEX idx_room_players_gamer ON public.room_players(gamer_id);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Generate unique room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.game_rooms WHERE room_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Auto-update player count
CREATE OR REPLACE FUNCTION public.update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.game_rooms
    SET current_player_count = current_player_count + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.game_rooms
    SET current_player_count = GREATEST(current_player_count - 1, 0)
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_player_count_trigger
  AFTER INSERT OR DELETE ON public.room_players
  FOR EACH ROW EXECUTE FUNCTION public.update_room_player_count();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_spectators ENABLE ROW LEVEL SECURITY;

-- Anyone can view public rooms
CREATE POLICY "rooms_select_public"
  ON public.game_rooms FOR SELECT
  USING (NOT is_private AND status IN ('waiting', 'ready', 'playing'));

-- Room players can view their room (including private)
CREATE POLICY "rooms_select_player"
  ON public.game_rooms FOR SELECT
  USING (
    id IN (
      SELECT room_id FROM public.room_players
      WHERE gamer_id IN (
        SELECT id FROM public.gamers
        WHERE profile_id = public.get_active_profile_id()
      )
    )
  );

-- Anyone can create rooms (via RPC)
CREATE POLICY "rooms_insert_all"
  ON public.game_rooms FOR INSERT
  WITH CHECK (true);

-- Host can update room
CREATE POLICY "rooms_update_host"
  ON public.game_rooms FOR UPDATE
  USING (
    host_gamer_id IN (
      SELECT id FROM public.gamers
      WHERE profile_id = public.get_active_profile_id()
    )
  );

-- Room players policies
CREATE POLICY "room_players_select_all"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "room_players_insert_all"
  ON public.room_players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "room_players_update_own"
  ON public.room_players FOR UPDATE
  USING (
    gamer_id IN (
      SELECT id FROM public.gamers
      WHERE profile_id = public.get_active_profile_id()
    )
  );

CREATE POLICY "room_players_delete_own"
  ON public.room_players FOR DELETE
  USING (
    gamer_id IN (
      SELECT id FROM public.gamers
      WHERE profile_id = public.get_active_profile_id()
    )
  );

-- Spectators policies
CREATE POLICY "spectators_select_all"
  ON public.room_spectators FOR SELECT
  USING (true);

CREATE POLICY "spectators_insert_all"
  ON public.room_spectators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "spectators_delete_own"
  ON public.room_spectators FOR DELETE
  USING (
    gamer_id IN (
      SELECT id FROM public.gamers
      WHERE profile_id = public.get_active_profile_id()
    )
  );
