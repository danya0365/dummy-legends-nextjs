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


CREATE OR REPLACE FUNCTION public.draw_card(
  p_session_id UUID,
  p_gamer_id UUID,
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
  
  -- IF v_hand_count >= 11 THEN
  --   RAISE EXCEPTION 'Hand is full, must discard first';
  -- END IF;
  --
  -- Commented out hand count check to allow drawing from discard when hand is full
  
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
    'draw_deck',
    (SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id),
    jsonb_build_object(
      'card_id', v_card_id,
      'from_deck', true
    )
  );
  
  RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE MELD (WITHOUT DRAW)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_meld(
  p_session_id UUID,
  p_gamer_id UUID,
  p_meld_cards UUID[],
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_can_access BOOLEAN;
  v_current_turn UUID;
  v_distinct_count INTEGER;
  v_meld_id UUID := uuid_generate_v4();
BEGIN
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS cards(card_id);

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT current_turn_gamer_id INTO v_current_turn
  FROM public.game_sessions
  WHERE id = p_session_id AND is_active = true;

  IF v_current_turn IS DISTINCT FROM p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.game_cards
    WHERE id = ANY(p_meld_cards)
      AND session_id = p_session_id
      AND NOT (owner_gamer_id = p_gamer_id AND location = 'hand')
  ) THEN
    RAISE EXCEPTION 'All meld cards must be in your hand';
  END IF;

  -- TODO: Add detailed meld validation for sets/runs according to Dummy rules

  UPDATE public.game_cards
  SET location = 'meld',
      owner_gamer_id = p_gamer_id,
      meld_id = v_meld_id,
      position_in_location = NULL,
      updated_at = NOW()
  WHERE id = ANY(p_meld_cards)
    AND session_id = p_session_id;

  UPDATE public.game_hands
  SET card_count = card_count - array_length(p_meld_cards, 1),
      melds = COALESCE(melds, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'meld_id', v_meld_id,
          'cards', to_jsonb(p_meld_cards),
          'created_at', NOW()
        )
      ),
      updated_at = NOW()
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id;

  INSERT INTO public.game_moves (
    session_id,
    gamer_id,
    move_type,
    move_number,
    move_data
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'meld',
    (SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id),
    jsonb_build_object('meld_id', v_meld_id, 'cards', p_meld_cards)
  );

  RETURN v_meld_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DRAW FROM DISCARD AND MELD
-- =====================================================

CREATE OR REPLACE FUNCTION public.draw_discard_and_meld(
  p_session_id UUID,
  p_gamer_id UUID,
  p_meld_cards UUID[],
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_discard_card_id UUID;
  v_can_access BOOLEAN;
  v_current_turn UUID;
  v_hand_count INTEGER;
  v_distinct_count INTEGER;
  v_new_discard_top UUID;
  v_meld_id UUID;
BEGIN
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards (including discard)';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS card_id;

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if it's player's turn and lock session row
  SELECT current_turn_gamer_id
  INTO v_current_turn
  FROM public.game_sessions
  WHERE id = p_session_id AND is_active = true
  FOR UPDATE;
  
  IF v_current_turn IS DISTINCT FROM p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Get current hand count
  SELECT card_count INTO v_hand_count
  FROM public.game_hands
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id
  FOR UPDATE;

  -- IF v_hand_count >= 11 THEN
  --   RAISE EXCEPTION 'Hand is full, must discard first';
  -- END IF;
  --
  -- Commented out hand count check to allow drawing from discard when hand is full

  -- Ensure discard pile has a top card and matches meld (lock discard state)
  SELECT discard_pile_top_card_id INTO v_discard_card_id
  FROM public.game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_discard_card_id IS NULL THEN
    RAISE EXCEPTION 'Discard pile is empty';
  END IF;

  IF NOT (v_discard_card_id = ANY(p_meld_cards)) THEN
    RAISE EXCEPTION 'Meld must include discard top card';
  END IF;

  -- Ensure player holds remaining meld cards in hand
  IF EXISTS (
    SELECT 1
    FROM unnest(p_meld_cards) AS meld_card
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.game_cards
      WHERE id = meld_card
        AND session_id = p_session_id
        AND (
          (id = v_discard_card_id AND location = 'discard')
          OR (id <> v_discard_card_id AND location = 'hand' AND owner_gamer_id = p_gamer_id)
        )
    )
  ) THEN
    RAISE EXCEPTION 'Meld contains cards not accessible to player';
  END IF;

  -- Move discard top card to player's hand
  UPDATE public.game_cards
  SET location = 'hand',
      owner_gamer_id = p_gamer_id,
      position_in_location = v_hand_count,
      updated_at = NOW()
  WHERE id = v_discard_card_id
    AND session_id = p_session_id;

  -- Update hand count after drawing discard card
  UPDATE public.game_hands
  SET card_count = card_count + 1,
      updated_at = NOW()
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id;

  -- Create meld (reuses create_meld logic)
  v_meld_id := public.create_meld(
    p_session_id => p_session_id,
    p_gamer_id => p_gamer_id,
    p_meld_cards => p_meld_cards,
    p_guest_identifier => p_guest_identifier
  );

  -- Reindex discard pile and update top card
  WITH reordered AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY position_in_location, id) - 1 AS new_position
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND location = 'discard'
  )
  UPDATE public.game_cards gc
  SET position_in_location = reordered.new_position
  FROM reordered
  WHERE gc.id = reordered.id;

  SELECT id INTO v_new_discard_top
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND location = 'discard'
  ORDER BY position_in_location
  LIMIT 1;

  UPDATE public.game_sessions
  SET discard_pile_top_card_id = v_new_discard_top
  WHERE id = p_session_id;

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
    'draw_discard',
    (SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id),
    jsonb_build_object(
      'card_id', v_discard_card_id,
      'meld_id', v_meld_id,
      'meld_cards', p_meld_cards
    )
  );

  RETURN v_discard_card_id;
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
  v_deadwood_value INTEGER;
  v_deadwood_count INTEGER;
  v_winning_type public.game_move_type;
  v_finish_result UUID;
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
  
  -- Check if discard ends the round (auto knock/gin)
  SELECT COALESCE(SUM(card_value), 0), COALESCE(COUNT(id), 0)
  INTO v_deadwood_value, v_deadwood_count
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND owner_gamer_id = p_gamer_id
    AND location = 'hand';

  v_winning_type := NULL;

  IF v_deadwood_count = 0 THEN
    v_winning_type := 'gin';
  ELSIF v_deadwood_value <= 10 THEN
    v_winning_type := 'knock';
  END IF;

  IF v_winning_type IS NOT NULL THEN
    v_finish_result := public.finish_game_round(
      p_session_id => p_session_id,
      p_gamer_id => p_gamer_id,
      p_winning_type => v_winning_type,
      p_guest_identifier => p_guest_identifier
    );
    RETURN true;
  END IF;

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
-- FINISH GAME ROUND
-- =====================================================

CREATE OR REPLACE FUNCTION public.finish_game_round(
  p_session_id UUID,
  p_gamer_id UUID,
  p_winning_type public.game_move_type,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_can_access BOOLEAN;
  v_session RECORD;
  v_deadwood_value INTEGER := 0;
  v_deadwood_count INTEGER := 0;
  v_move_number INTEGER;
  v_total_moves INTEGER;
  v_duration_seconds INTEGER := 0;
  v_result_id UUID;
  v_room_id UUID;
  v_final_scores JSONB;
  v_supported_types CONSTANT public.game_move_type[] := ARRAY['knock', 'gin'];
BEGIN
  IF p_winning_type IS NULL THEN
    RAISE EXCEPTION 'Winning type is required';
  END IF;

  IF NOT (p_winning_type = ANY(v_supported_types)) THEN
    RAISE EXCEPTION 'Unsupported winning type %', p_winning_type;
  END IF;

  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT gs.*
  INTO v_session
  FROM public.game_sessions gs
  WHERE gs.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game session not found';
  END IF;

  IF NOT v_session.is_active THEN
    RAISE EXCEPTION 'Game session already finished';
  END IF;

  IF v_session.current_turn_gamer_id IS DISTINCT FROM p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.game_results WHERE session_id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Game session already has results recorded';
  END IF;

  SELECT COALESCE(SUM(card_value), 0), COALESCE(COUNT(id), 0)
  INTO v_deadwood_value, v_deadwood_count
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND owner_gamer_id = p_gamer_id
    AND location = 'hand';

  IF p_winning_type = 'gin' THEN
    IF v_deadwood_count > 0 THEN
      RAISE EXCEPTION 'Gin requires zero deadwood cards';
    END IF;
  ELSIF p_winning_type = 'knock' THEN
    IF v_deadwood_value > 10 THEN
      RAISE EXCEPTION 'Knock requires deadwood value of 10 or less';
    END IF;
  END IF;

  WITH player_deadwood AS (
    SELECT gh.session_id,
           gh.gamer_id,
           COALESCE(COUNT(gc.id), 0) AS card_count,
           COALESCE(SUM(gc.card_value), 0) AS total_value
    FROM public.game_hands gh
    LEFT JOIN public.game_cards gc
      ON gc.session_id = gh.session_id
     AND gc.owner_gamer_id = gh.gamer_id
     AND gc.location = 'hand'
    WHERE gh.session_id = p_session_id
    GROUP BY gh.session_id, gh.gamer_id
  )
  UPDATE public.game_hands gh
  SET deadwood_count = pd.card_count,
      deadwood_value = pd.total_value,
      updated_at = NOW()
  FROM player_deadwood pd
  WHERE gh.session_id = pd.session_id
    AND gh.gamer_id = pd.gamer_id;

  SELECT COALESCE(jsonb_agg(
           jsonb_build_object(
             'gamer_id', gh.gamer_id,
             'deadwood_count', gh.deadwood_count,
             'deadwood_value', gh.deadwood_value,
             'melds', COALESCE(gh.melds, '[]'::jsonb)
           )
           ORDER BY gh.deadwood_value, gh.gamer_id
         ), '[]'::jsonb)
  INTO v_final_scores
  FROM public.game_hands gh
  WHERE gh.session_id = p_session_id;

  v_move_number := (
    SELECT COUNT(*) + 1 FROM public.game_moves WHERE session_id = p_session_id
  );

  INSERT INTO public.game_moves (
    session_id,
    gamer_id,
    move_type,
    move_number,
    move_data
  ) VALUES (
    p_session_id,
    p_gamer_id,
    p_winning_type,
    v_move_number,
    jsonb_build_object(
      'deadwood_value', v_deadwood_value,
      'deadwood_count', v_deadwood_count
    )
  );

  v_total_moves := v_move_number;
  v_room_id := v_session.room_id;

  v_duration_seconds := COALESCE(
    EXTRACT(EPOCH FROM (NOW() - v_session.started_at))::INTEGER,
    0
  );

  UPDATE public.game_sessions
  SET is_active = false,
      winner_gamer_id = p_gamer_id,
      winning_type = p_winning_type::TEXT,
      finished_at = NOW(),
      current_turn_gamer_id = NULL
  WHERE id = p_session_id;

  UPDATE public.game_rooms
  SET status = 'finished',
      finished_at = NOW()
  WHERE id = v_room_id;

  UPDATE public.room_players
  SET status = 'waiting',
      is_ready = false,
      rounds_won = rounds_won + CASE WHEN gamer_id = p_gamer_id THEN 1 ELSE 0 END
  WHERE room_id = v_room_id;

  INSERT INTO public.game_results (
    room_id,
    session_id,
    winner_gamer_id,
    winning_type,
    final_scores,
    total_rounds,
    total_moves,
    game_duration_seconds,
    created_at
  ) VALUES (
    v_room_id,
    p_session_id,
    p_gamer_id,
    p_winning_type::TEXT,
    v_final_scores,
    v_session.round_number,
    v_total_moves,
    v_duration_seconds,
    NOW()
  ) RETURNING id INTO v_result_id;

  RETURN v_result_id;
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
