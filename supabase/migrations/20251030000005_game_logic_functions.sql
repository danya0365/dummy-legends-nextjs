-- =====================================================
-- Dummy Legends - Part 5: Game Logic Functions
-- Created: 2025-10-30
-- =====================================================

-- =====================================================
-- START GAME SESSION
-- =====================================================

-- Start game and deal cards
CREATE OR REPLACE FUNCTION public.start_game_session(
  p_room_id UUID,
  p_host_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_can_access BOOLEAN;
  v_room_status public.room_status;
  v_players RECORD;
  v_card_suits TEXT[] := ARRAY['hearts', 'diamonds', 'clubs', 'spades'];
  v_card_ranks TEXT[] := ARRAY['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  v_deck UUID[];
  v_card_id UUID;
  v_suit TEXT;
  v_rank TEXT;
  v_position INTEGER := 0;
  v_player_index INTEGER := 0;
  v_cards_per_player INTEGER := 10;
BEGIN
  -- Check host access
  v_can_access := public.can_access_gamer(p_host_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if host is really host
  IF NOT EXISTS (
    SELECT 1 FROM public.room_players 
    WHERE room_id = p_room_id 
    AND gamer_id = p_host_gamer_id 
    AND is_host = true
  ) THEN
    RAISE EXCEPTION 'Only host can start game';
  END IF;
  
  -- Check room status
  SELECT status INTO v_room_status
  FROM public.game_rooms
  WHERE id = p_room_id;
  
  IF v_room_status NOT IN ('waiting', 'ready') THEN
    RAISE EXCEPTION 'Room is not ready to start';
  END IF;
  
  -- Check all players ready
  IF EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_id = p_room_id
    AND NOT is_ready
    AND NOT is_host
  ) THEN
    RAISE EXCEPTION 'Not all players are ready';
  END IF;
  
  -- Update room status
  UPDATE public.game_rooms
  SET status = 'playing',
      started_at = NOW()
  WHERE id = p_room_id;
  
  -- Create game session
  INSERT INTO public.game_sessions (room_id)
  VALUES (p_room_id)
  RETURNING id INTO v_session_id;
  
  -- Create deck (52 cards)
  FOR v_suit IN SELECT unnest(v_card_suits) LOOP
    FOR v_rank IN SELECT unnest(v_card_ranks) LOOP
      INSERT INTO public.game_cards (
        session_id,
        suit,
        rank,
        card_value,
        location,
        position_in_location
      ) VALUES (
        v_session_id,
        v_suit::public.card_suit,
        v_rank::public.card_rank,
        public.get_card_value(v_rank::public.card_rank),
        'deck',
        v_position
      ) RETURNING id INTO v_card_id;
      
      v_deck := array_append(v_deck, v_card_id);
      v_position := v_position + 1;
    END LOOP;
  END LOOP;
  
  -- Shuffle deck (Fisher-Yates)
  FOR i IN REVERSE array_length(v_deck, 1)..2 LOOP
    DECLARE
      v_j INTEGER := floor(random() * i + 1)::INTEGER;
      v_temp UUID := v_deck[i];
    BEGIN
      v_deck[i] := v_deck[v_j];
      v_deck[v_j] := v_temp;
    END;
  END LOOP;
  
  -- Update card positions after shuffle
  FOR i IN 1..array_length(v_deck, 1) LOOP
    UPDATE public.game_cards
    SET position_in_location = i - 1
    WHERE id = v_deck[i];
  END LOOP;
  
  -- Deal cards to players (10 cards each)
  v_position := 0;
  FOR v_players IN 
    SELECT gamer_id, position 
    FROM public.room_players 
    WHERE room_id = p_room_id 
    ORDER BY position
  LOOP
    -- Create hand for player
    INSERT INTO public.game_hands (session_id, gamer_id, card_count)
    VALUES (v_session_id, v_players.gamer_id, v_cards_per_player);
    
    -- Deal 10 cards
    FOR i IN 1..v_cards_per_player LOOP
      UPDATE public.game_cards
      SET location = 'hand',
          owner_gamer_id = v_players.gamer_id,
          position_in_location = i - 1
      WHERE id = v_deck[v_position + i];
    END LOOP;
    
    v_position := v_position + v_cards_per_player;
  END LOOP;
  
  -- Put first card in discard pile
  UPDATE public.game_cards
  SET location = 'discard',
      owner_gamer_id = NULL,
      position_in_location = 0
  WHERE id = v_deck[v_position + 1];
  
  -- Update session with discard pile top card
  UPDATE public.game_sessions
  SET discard_pile_top_card_id = v_deck[v_position + 1],
      remaining_deck_cards = 52 - (v_position + 1),
      current_turn_gamer_id = (
        SELECT gamer_id FROM public.room_players
        WHERE room_id = p_room_id
        ORDER BY position
        LIMIT 1
      ),
      current_turn_started_at = NOW()
  WHERE id = v_session_id;
  
  -- Update room players status
  UPDATE public.room_players
  SET status = 'playing'
  WHERE room_id = p_room_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DRAW CARD
-- =====================================================

CREATE OR REPLACE FUNCTION public.draw_card(
  p_session_id UUID,
  p_gamer_id UUID,
  p_from_deck BOOLEAN DEFAULT true,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_card_id UUID;
  v_can_access BOOLEAN;
  v_current_turn UUID;
  v_hand_count INTEGER;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if it's player's turn
  SELECT current_turn_gamer_id INTO v_current_turn
  FROM public.game_sessions
  WHERE id = p_session_id AND is_active = true;
  
  IF v_current_turn != p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;
  
  -- Get current hand count
  SELECT card_count INTO v_hand_count
  FROM public.game_hands
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id;
  
  IF v_hand_count >= 11 THEN
    RAISE EXCEPTION 'Hand is full, must discard first';
  END IF;
  
  IF p_from_deck THEN
    -- Draw from deck
    SELECT id INTO v_card_id
    FROM public.game_cards
    WHERE session_id = p_session_id
    AND location = 'deck'
    ORDER BY position_in_location
    LIMIT 1;
    
    IF v_card_id IS NULL THEN
      RAISE EXCEPTION 'Deck is empty';
    END IF;
    
    -- Update remaining deck cards
    UPDATE public.game_sessions
    SET remaining_deck_cards = remaining_deck_cards - 1
    WHERE id = p_session_id;
  ELSE
    -- Draw from discard pile
    SELECT discard_pile_top_card_id INTO v_card_id
    FROM public.game_sessions
    WHERE id = p_session_id;
    
    IF v_card_id IS NULL THEN
      RAISE EXCEPTION 'Discard pile is empty';
    END IF;
  END IF;
  
  -- Move card to player's hand
  UPDATE public.game_cards
  SET location = 'hand',
      owner_gamer_id = p_gamer_id,
      position_in_location = v_hand_count
  WHERE id = v_card_id;
  
  -- Update hand count
  UPDATE public.game_hands
  SET card_count = card_count + 1,
      updated_at = NOW()
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id;
  
  -- Record move
  INSERT INTO public.game_moves (
    session_id,
    gamer_id,
    move_type,
    move_number,
    move_data
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'draw',
    (SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id),
    jsonb_build_object(
      'card_id', v_card_id,
      'from_deck', p_from_deck
    )
  );
  
  RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DISCARD CARD
-- =====================================================

CREATE OR REPLACE FUNCTION public.discard_card(
  p_session_id UUID,
  p_gamer_id UUID,
  p_card_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_access BOOLEAN;
  v_current_turn UUID;
  v_next_player UUID;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if it's player's turn
  SELECT current_turn_gamer_id INTO v_current_turn
  FROM public.game_sessions
  WHERE id = p_session_id AND is_active = true;
  
  IF v_current_turn != p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;
  
  -- Verify card belongs to player
  IF NOT EXISTS (
    SELECT 1 FROM public.game_cards
    WHERE id = p_card_id
    AND owner_gamer_id = p_gamer_id
    AND location = 'hand'
  ) THEN
    RAISE EXCEPTION 'Card not in your hand';
  END IF;
  
  -- Move card to discard pile
  UPDATE public.game_cards
  SET location = 'discard',
      owner_gamer_id = NULL,
      position_in_location = 0
  WHERE id = p_card_id;
  
  -- Update session discard pile top
  UPDATE public.game_sessions
  SET discard_pile_top_card_id = p_card_id
  WHERE id = p_session_id;
  
  -- Update hand count
  UPDATE public.game_hands
  SET card_count = card_count - 1,
      updated_at = NOW()
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id;
  
  -- Record move
  INSERT INTO public.game_moves (
    session_id,
    gamer_id,
    move_type,
    move_number,
    move_data
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'discard',
    (SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id),
    jsonb_build_object('card_id', p_card_id)
  );
  
  -- Get next player
  SELECT gamer_id INTO v_next_player
  FROM public.room_players
  WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id)
  AND position = (
    SELECT (position + 1) % (SELECT COUNT(*) FROM public.room_players WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id))
    FROM public.room_players
    WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id)
    AND gamer_id = p_gamer_id
  );
  
  -- Update turn
  UPDATE public.game_sessions
  SET current_turn_gamer_id = v_next_player,
      current_turn_started_at = NOW()
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET GAME STATE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_session_for_room(
  p_room_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_can_access BOOLEAN;
  v_session_id UUID;
BEGIN
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id
  INTO v_session_id
  FROM public.game_sessions
  WHERE room_id = p_room_id
    AND is_active = true
  ORDER BY started_at DESC
  LIMIT 1;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET GAME STATE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_game_state(
  p_session_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_can_access BOOLEAN;
  v_result JSON;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  SELECT json_build_object(
    'session', row_to_json(s),
    'my_hand', (
      SELECT json_agg(row_to_json(c) ORDER BY c.position_in_location)
      FROM public.game_cards c
      WHERE c.session_id = p_session_id
      AND c.owner_gamer_id = p_gamer_id
      AND c.location = 'hand'
    ),
    'discard_top', (
      SELECT row_to_json(c)
      FROM public.game_cards c
      WHERE c.id = s.discard_pile_top_card_id
    ),
    'other_players', (
      SELECT json_agg(
        json_build_object(
          'gamer_id', h.gamer_id,
          'card_count', h.card_count,
          'is_current_turn', s.current_turn_gamer_id = h.gamer_id
        )
      )
      FROM public.game_hands h
      WHERE h.session_id = p_session_id
      AND h.gamer_id != p_gamer_id
    )
  ) INTO v_result
  FROM public.game_sessions s
  WHERE s.id = p_session_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================

-- Already added in previous migration, but ensure it's there
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.game_hands;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.game_cards;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;
