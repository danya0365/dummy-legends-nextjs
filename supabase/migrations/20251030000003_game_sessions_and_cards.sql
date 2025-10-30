-- =====================================================
-- Dummy Legends - Part 3: Game Sessions and Cards
-- Created: 2025-10-30
-- =====================================================

-- =====================================================
-- GAME SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  
  round_number INTEGER NOT NULL DEFAULT 1,
  current_turn_gamer_id UUID REFERENCES public.gamers(id) ON DELETE SET NULL,
  current_turn_started_at TIMESTAMP WITH TIME ZONE,
  
  remaining_deck_cards INTEGER NOT NULL DEFAULT 52,
  discard_pile_top_card_id UUID,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  winner_gamer_id UUID REFERENCES public.gamers(id) ON DELETE SET NULL,
  winning_type TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  
  game_state JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- PLAYER HANDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  card_count INTEGER NOT NULL DEFAULT 0,
  deadwood_count INTEGER NOT NULL DEFAULT 0,
  deadwood_value INTEGER NOT NULL DEFAULT 0,
  
  melds JSONB DEFAULT '[]'::jsonb,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT game_hands_unique UNIQUE (session_id, gamer_id)
);

-- =====================================================
-- GAME CARDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  
  suit public.card_suit NOT NULL,
  rank public.card_rank NOT NULL,
  card_value INTEGER NOT NULL,
  
  location TEXT NOT NULL CHECK (location IN ('deck', 'discard', 'hand', 'meld')),
  owner_gamer_id UUID REFERENCES public.gamers(id) ON DELETE SET NULL,
  
  position_in_location INTEGER,
  meld_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GAME MOVES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  move_type public.game_move_type NOT NULL,
  move_number INTEGER NOT NULL,
  
  move_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GAME RESULTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  
  winner_gamer_id UUID REFERENCES public.gamers(id) ON DELETE SET NULL,
  winning_type TEXT,
  
  final_scores JSONB NOT NULL,
  total_rounds INTEGER NOT NULL,
  total_moves INTEGER NOT NULL,
  game_duration_seconds INTEGER NOT NULL,
  
  elo_changes JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gamer_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  gamer_id UUID NOT NULL REFERENCES public.gamers(id) ON DELETE CASCADE,
  
  achievement_code TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  
  reward_experience INTEGER NOT NULL DEFAULT 0,
  reward_data JSONB DEFAULT '{}'::jsonb,
  
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT gamer_achievements_unique UNIQUE (gamer_id, achievement_code)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_game_sessions_room ON public.game_sessions(room_id);
CREATE INDEX idx_game_sessions_active ON public.game_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_game_sessions_current_turn ON public.game_sessions(current_turn_gamer_id);
CREATE INDEX idx_game_hands_session ON public.game_hands(session_id);
CREATE INDEX idx_game_cards_session ON public.game_cards(session_id);
CREATE INDEX idx_game_cards_location ON public.game_cards(location);
CREATE INDEX idx_game_cards_owner ON public.game_cards(owner_gamer_id);
CREATE INDEX idx_game_moves_session ON public.game_moves(session_id);
CREATE INDEX idx_game_moves_gamer ON public.game_moves(gamer_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_game_hands_updated_at
  BEFORE UPDATE ON public.game_hands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_cards_updated_at
  BEFORE UPDATE ON public.game_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Calculate card value
CREATE OR REPLACE FUNCTION public.get_card_value(p_rank public.card_rank)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_rank
    WHEN 'A' THEN 1
    WHEN '2' THEN 2
    WHEN '3' THEN 3
    WHEN '4' THEN 4
    WHEN '5' THEN 5
    WHEN '6' THEN 6
    WHEN '7' THEN 7
    WHEN '8' THEN 8
    WHEN '9' THEN 9
    WHEN '10' THEN 10
    WHEN 'J' THEN 10
    WHEN 'Q' THEN 10
    WHEN 'K' THEN 10
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamer_achievements ENABLE ROW LEVEL SECURITY;

-- Game sessions: Room players can view
CREATE POLICY "sessions_select_room_players"
  ON public.game_sessions FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM public.room_players
      WHERE gamer_id IN (SELECT id FROM public.gamers WHERE profile_id = public.get_active_profile_id())
    )
  );

CREATE POLICY "sessions_insert_all" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update_all" ON public.game_sessions FOR UPDATE USING (true);

-- Game hands: Players can only view their own
CREATE POLICY "hands_select_own"
  ON public.game_hands FOR SELECT
  USING (
    gamer_id IN (SELECT id FROM public.gamers WHERE profile_id = public.get_active_profile_id())
  );

CREATE POLICY "hands_insert_all" ON public.game_hands FOR INSERT WITH CHECK (true);
CREATE POLICY "hands_update_all" ON public.game_hands FOR UPDATE USING (true);

-- Game cards: Room players can view
CREATE POLICY "cards_select_room_players"
  ON public.game_cards FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE room_id IN (
        SELECT room_id FROM public.room_players
        WHERE gamer_id IN (SELECT id FROM public.gamers WHERE profile_id = public.get_active_profile_id())
      )
    )
  );

CREATE POLICY "cards_insert_all" ON public.game_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "cards_update_all" ON public.game_cards FOR UPDATE USING (true);

-- Game moves: Room players can view
CREATE POLICY "moves_select_room_players"
  ON public.game_moves FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.game_sessions
      WHERE room_id IN (
        SELECT room_id FROM public.room_players
        WHERE gamer_id IN (SELECT id FROM public.gamers WHERE profile_id = public.get_active_profile_id())
      )
    )
  );

CREATE POLICY "moves_insert_all" ON public.game_moves FOR INSERT WITH CHECK (true);

-- Game results: Anyone can view
CREATE POLICY "results_select_all" ON public.game_results FOR SELECT USING (true);
CREATE POLICY "results_insert_all" ON public.game_results FOR INSERT WITH CHECK (true);

-- Achievements: Anyone can view
CREATE POLICY "achievements_select_all" ON public.gamer_achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert_all" ON public.gamer_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "achievements_update_all" ON public.gamer_achievements FOR UPDATE USING (true);
