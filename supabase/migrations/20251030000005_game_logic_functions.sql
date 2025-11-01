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
  v_cards_per_player INTEGER := 0;
  v_head_card UUID;
  v_player_count INTEGER;
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
 
  -- Ensure 2-4 active players according to Thai Dummy rules
  SELECT COUNT(*)
  INTO v_player_count
  FROM public.room_players
  WHERE room_id = p_room_id
    AND status != 'left';

  IF v_player_count < 2 OR v_player_count > 4 THEN
    RAISE EXCEPTION 'Dummy requires 2-4 active players';
  END IF;

  -- Determine cards per player based on player count
  IF v_player_count = 2 THEN
    v_cards_per_player := 11;
  ELSIF v_player_count = 3 THEN
    v_cards_per_player := 9;
  ELSE
    v_cards_per_player := 7;
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
  
  -- Create deck (52 cards) with Dummy Legends scoring metadata
  FOR v_suit IN SELECT unnest(v_card_suits) LOOP
    FOR v_rank IN SELECT unnest(v_card_ranks) LOOP
      INSERT INTO public.game_cards (
        session_id,
        suit,
        rank,
        card_value,
        location,
        position_in_location,
        is_speto
      ) VALUES (
        v_session_id,
        v_suit::public.card_suit,
        v_rank::public.card_rank,
        public.get_card_value(v_rank::public.card_rank),
        'deck',
        v_position,
        (v_rank = '2' AND v_suit = 'clubs') OR (v_rank = 'Q' AND v_suit = 'spades')
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
  
  -- Deal cards to players based on player count (11/9/7)
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
    
    -- Deal 7 cards
    FOR i IN 1..v_cards_per_player LOOP
      UPDATE public.game_cards
      SET location = 'hand',
          owner_gamer_id = v_players.gamer_id,
          position_in_location = i - 1
      WHERE id = v_deck[v_position + i];
    END LOOP;
    
    v_position := v_position + v_cards_per_player;
  END LOOP;

  -- Put first card in discard pile as table "head"
  v_head_card := v_deck[v_position + 1];
  UPDATE public.game_cards
  SET location = 'discard',
      owner_gamer_id = NULL,
      position_in_location = 0,
      is_head = true
  WHERE id = v_head_card;

  -- Update session with discard pile top card
  UPDATE public.game_sessions
  SET discard_pile_top_card_id = v_head_card,
      initial_discard_card_id = v_head_card,
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
-- GET LATEST GAME RESULT FOR ROOM (RLS SAFE)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_latest_game_result_for_room(
  p_room_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS TABLE (
  result_id UUID,
  session_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    gr.id AS result_id,
    gr.session_id,
    gr.created_at
  FROM public.game_results gr
  WHERE gr.room_id = p_room_id
    AND EXISTS (
      SELECT 1
      FROM public.game_result_players grp
      WHERE grp.result_id = gr.id
        AND grp.gamer_id = p_gamer_id
    )
  ORDER BY gr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_game_result_summary(
  p_session_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_can_access BOOLEAN;
  v_result_id UUID;
  v_room_id UUID;
BEGIN
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id, room_id
  INTO v_result_id, v_room_id
  FROM public.game_results
  WHERE session_id = p_session_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_result_id IS NULL THEN
    RETURN jsonb_build_object(
      'result', NULL,
      'players', '[]'::jsonb,
      'melds', '[]'::jsonb,
      'events', '[]'::jsonb,
      'remaining_cards', '[]'::jsonb
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.game_result_players
    WHERE result_id = v_result_id
      AND gamer_id = p_gamer_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    WITH result_row AS (
      SELECT row_to_json(gr.*) AS data
      FROM public.game_results gr
      WHERE gr.id = v_result_id
    ),
    players_data AS (
      SELECT COALESCE(jsonb_agg(row_to_json(grp.*)), '[]'::jsonb) AS players
      FROM public.game_result_players grp
      WHERE grp.result_id = v_result_id
    ),
    melds_data AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', gm.id,
            'session_id', gm.session_id,
            'gamer_id', gm.gamer_id,
            'meld_type', gm.meld_type,
            'created_from_head', gm.created_from_head,
            'includes_speto', gm.includes_speto,
            'score_value', gm.score_value,
            'metadata', gm.metadata,
            'created_at', gm.created_at,
            'game_cards', COALESCE(
              (
                SELECT jsonb_agg(row_to_json(gc.*))
                FROM public.game_cards gc
                WHERE gc.meld_id = gm.id
              ),
              '[]'::jsonb
            )
          )
        ),
        '[]'::jsonb
      ) AS melds
      FROM public.game_melds gm
      WHERE gm.session_id = p_session_id
    ),
    events_data AS (
      SELECT COALESCE(jsonb_agg(row_to_json(gse.*)), '[]'::jsonb) AS events
      FROM public.game_score_events gse
      WHERE gse.session_id = p_session_id
    ),
    remaining_cards_data AS (
      SELECT COALESCE(
        jsonb_agg(row_to_json(gc.*)),
        '[]'::jsonb
      ) AS cards
      FROM public.game_cards gc
      WHERE gc.id = ANY (
        SELECT DISTINCT unnest(grp.remaining_card_ids)
        FROM public.game_result_players grp
        WHERE grp.result_id = v_result_id
          AND grp.remaining_card_ids IS NOT NULL
      )
    )
    SELECT jsonb_build_object(
      'result', (SELECT data FROM result_row LIMIT 1),
      'players', (SELECT players FROM players_data),
      'melds', (SELECT melds FROM melds_data),
      'events', (SELECT events FROM events_data),
      'remaining_cards', (SELECT cards FROM remaining_cards_data)
    )
  );
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
  v_discard_count INTEGER;
  v_discard_top_card_id UUID;
  v_discard_cards UUID[];
  v_position INTEGER := 0;
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
  
  -- Try to draw from deck
  SELECT id INTO v_card_id
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND location = 'deck'
  ORDER BY position_in_location
  LIMIT 1;

  -- If deck is empty, reshuffle discard pile (except top card)
  IF v_card_id IS NULL THEN
    -- Get discard pile top card
    SELECT discard_pile_top_card_id INTO v_discard_top_card_id
    FROM public.game_sessions
    WHERE id = p_session_id;
    
    -- Count cards in discard pile (excluding top card)
    SELECT COUNT(*) INTO v_discard_count
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND location = 'discard'
      AND id != COALESCE(v_discard_top_card_id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- If no cards available to reshuffle, game is stuck
    IF v_discard_count = 0 THEN
      RAISE EXCEPTION 'Both deck and discard pile are empty - cannot continue';
    END IF;
    
    -- Get all discard cards except top card
    SELECT array_agg(id) INTO v_discard_cards
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND location = 'discard'
      AND id != COALESCE(v_discard_top_card_id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Shuffle the discard cards (Fisher-Yates)
    FOR i IN REVERSE array_length(v_discard_cards, 1)..2 LOOP
      DECLARE
        v_j INTEGER := floor(random() * i + 1)::INTEGER;
        v_temp UUID := v_discard_cards[i];
      BEGIN
        v_discard_cards[i] := v_discard_cards[v_j];
        v_discard_cards[v_j] := v_temp;
      END;
    END LOOP;
    
    -- Move shuffled cards back to deck
    FOR i IN 1..array_length(v_discard_cards, 1) LOOP
      UPDATE public.game_cards
      SET location = 'deck',
          position_in_location = i - 1,
          updated_at = NOW()
      WHERE id = v_discard_cards[i];
    END LOOP;
    
    -- Update remaining deck cards count
    UPDATE public.game_sessions
    SET remaining_deck_cards = array_length(v_discard_cards, 1)
    WHERE id = p_session_id;
    
    -- Now draw the first card from the reshuffled deck
    v_card_id := v_discard_cards[1];
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
      'from_deck', true,
      'reshuffled', v_discard_count > 0
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
  v_meld_type public.meld_type;
  v_created_from_head BOOLEAN := false;
  v_includes_speto BOOLEAN := false;
  v_score_value INTEGER := 0;
  v_speto_card_ids UUID[] := '{}';
  v_card_count INTEGER;
  v_remaining_card UUID;
  v_new_discard_top UUID;
  v_result UUID;
BEGIN
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS cards(card_id);

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  v_meld_type := public.validate_dummy_meld(p_session_id, p_meld_cards)::public.meld_type;

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

  SELECT
    COALESCE(BOOL_OR(is_head), false),
    COALESCE(BOOL_OR(is_speto), false),
    COALESCE(SUM(card_value), 0),
    COALESCE(array_agg(id) FILTER (WHERE is_speto), '{}')
  INTO v_created_from_head, v_includes_speto, v_score_value, v_speto_card_ids
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_meld_cards);

  WITH card_input AS (
    SELECT card_id, ord - 1 AS card_index
    FROM unnest(p_meld_cards) WITH ORDINALITY AS t(card_id, ord)
  )
  UPDATE public.game_cards gc
  SET location = 'meld',
      owner_gamer_id = p_gamer_id,
      meld_id = v_meld_id,
      meld_card_index = card_input.card_index,
      position_in_location = NULL,
      updated_at = NOW()
  FROM card_input
  WHERE gc.id = card_input.card_id
    AND gc.session_id = p_session_id;

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

  SELECT card_count
  INTO v_card_count
  FROM public.game_hands
  WHERE session_id = p_session_id
    AND gamer_id = p_gamer_id
  FOR UPDATE;

  INSERT INTO public.game_score_events (
    session_id,
    gamer_id,
    event_type,
    points,
    related_meld_id,
    related_card_ids,
    metadata
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'meld_points',
    v_score_value,
    v_meld_id,
    p_meld_cards,
    jsonb_build_object('meld_type', v_meld_type::TEXT)
  );

  IF v_created_from_head THEN
    INSERT INTO public.game_score_events (
      session_id,
      gamer_id,
      event_type,
      points,
      related_meld_id,
      related_card_ids,
      metadata
    ) VALUES (
      p_session_id,
      p_gamer_id,
      'head_bonus',
      50,
      v_meld_id,
      p_meld_cards,
      jsonb_build_object('reason', 'meld_created_from_head')
    );
  END IF;

  IF v_includes_speto THEN
    INSERT INTO public.game_score_events (
      session_id,
      gamer_id,
      event_type,
      points,
      related_meld_id,
      related_card_ids,
      metadata
    ) VALUES (
      p_session_id,
      p_gamer_id,
      'spe_to_meld_bonus',
      50,
      v_meld_id,
      v_speto_card_ids,
      jsonb_build_object('reason', 'spe_to_in_meld')
    );
  END IF;

  IF v_card_count = 1 THEN
    SELECT id
    INTO v_remaining_card
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND owner_gamer_id = p_gamer_id
      AND location = 'hand'
    LIMIT 1
    FOR UPDATE;

    IF v_remaining_card IS NOT NULL THEN
      UPDATE public.game_cards
      SET location = 'discard',
          owner_gamer_id = NULL,
          position_in_location = 0,
          updated_at = NOW()
      WHERE id = v_remaining_card;

      UPDATE public.game_hands
      SET card_count = card_count - 1,
          updated_at = NOW()
      WHERE session_id = p_session_id
        AND gamer_id = p_gamer_id;

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

      SELECT id
      INTO v_new_discard_top
      FROM public.game_cards
      WHERE session_id = p_session_id
        AND location = 'discard'
      ORDER BY position_in_location
      LIMIT 1;

      UPDATE public.game_sessions
      SET discard_pile_top_card_id = v_new_discard_top
      WHERE id = p_session_id;
    END IF;

    v_result := public.finish_game_round(
      p_session_id => p_session_id,
      p_gamer_id => p_gamer_id,
      p_winning_type => 'dummy_finish',
      p_guest_identifier => p_guest_identifier
    );

    RETURN v_result;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- THAI DUMMY SCORING HELPERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_thai_dummy_card_score(
  p_rank public.card_rank,
  p_is_speto BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
BEGIN
  IF p_is_speto THEN
    RETURN 50;
  END IF;

  RETURN CASE p_rank
    WHEN 'A' THEN 15
    WHEN '2' THEN 5
    WHEN '3' THEN 5
    WHEN '4' THEN 5
    WHEN '5' THEN 5
    WHEN '6' THEN 5
    WHEN '7' THEN 5
    WHEN '8' THEN 5
    WHEN '9' THEN 5
    WHEN '10' THEN 10
    WHEN 'J' THEN 10
    WHEN 'Q' THEN 10
    WHEN 'K' THEN 10
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.compute_thai_dummy_deadwood(
  p_session_id UUID,
  p_gamer_id UUID
)
RETURNS TABLE(card_id UUID, score INTEGER) AS $$
BEGIN
  RETURN QUERY
    SELECT gc.id,
           public.get_thai_dummy_card_score(
             gc.rank,
             (gc.rank = '2' AND gc.suit = 'clubs') OR (gc.rank = 'Q' AND gc.suit = 'spades')
           )
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.owner_gamer_id = p_gamer_id
      AND gc.location = 'hand';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.compute_thai_dummy_scores(
  p_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_scores JSONB := '[]'::jsonb;
  v_gamer_id UUID;
  v_deadwood_cards JSONB;
  v_deadwood_value INTEGER;
  v_total_score INTEGER;
BEGIN
  FOR v_gamer_id IN
    SELECT gamer_id
    FROM public.game_hands
    WHERE session_id = p_session_id
  LOOP
    SELECT COALESCE(jsonb_agg(
             jsonb_build_object('card_id', cd.card_id, 'score', cd.score)
           ), '[]'::jsonb)
    INTO v_deadwood_cards
    FROM public.compute_thai_dummy_deadwood(p_session_id, v_gamer_id) cd;

    SELECT COALESCE(SUM(cd.score), 0)
    INTO v_deadwood_value
    FROM public.compute_thai_dummy_deadwood(p_session_id, v_gamer_id) cd;

    v_total_score := v_deadwood_value;

    v_scores := v_scores || jsonb_build_array(
      jsonb_build_object(
        'gamer_id', v_gamer_id,
        'deadwood_score', v_deadwood_value,
        'deadwood_cards', v_deadwood_cards,
        'melds', COALESCE((SELECT gh.melds FROM public.game_hands gh WHERE gh.session_id = p_session_id AND gh.gamer_id = v_gamer_id), '[]'::jsonb),
        'total_score', v_total_score
      )
    );
  END LOOP;

  RETURN v_scores;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- THAI DUMMY MELD VALIDATION HELPERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_card_rank_order(
  p_rank public.card_rank
)
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
    WHEN 'J' THEN 11
    WHEN 'Q' THEN 12
    WHEN 'K' THEN 13
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.validate_dummy_meld(
  p_session_id UUID,
  p_card_ids UUID[]
)
RETURNS TEXT AS $$
DECLARE
  v_expected_count INTEGER;
  v_total_cards INTEGER;
  v_unique_ranks INTEGER;
  v_unique_suits INTEGER;
  v_rank_orders INTEGER[];
  v_meld_type TEXT;
  v_idx INTEGER;
BEGIN
  IF p_card_ids IS NULL OR array_length(p_card_ids, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards';
  END IF;

  v_expected_count := array_length(p_card_ids, 1);

  SELECT COUNT(*)
  INTO v_total_cards
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_card_ids);

  IF v_total_cards <> v_expected_count THEN
    RAISE EXCEPTION 'Meld cards must belong to the current session';
  END IF;

  WITH card_data AS (
    SELECT
      gc.rank,
      gc.suit,
      public.get_card_rank_order(gc.rank) AS rank_order
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.id = ANY(p_card_ids)
  ), ordered_data AS (
    SELECT rank, suit, rank_order
    FROM card_data
    ORDER BY rank_order
  )
  SELECT
    COUNT(*) AS total_cards,
    COUNT(DISTINCT rank) AS unique_ranks,
    COUNT(DISTINCT suit) AS unique_suits,
    array_agg(rank_order) AS rank_orders
  INTO
    v_total_cards,
    v_unique_ranks,
    v_unique_suits,
    v_rank_orders
  FROM ordered_data;

  IF v_total_cards <> v_expected_count THEN
    RAISE EXCEPTION 'Meld cards missing in session';
  END IF;

  IF v_unique_ranks = 1 THEN
    v_meld_type := 'set';
  ELSIF v_unique_suits = 1 THEN
    IF v_unique_ranks <> v_total_cards THEN
      RAISE EXCEPTION 'Run cannot contain duplicate ranks';
    END IF;

    IF array_length(v_rank_orders, 1) <> v_total_cards THEN
      RAISE EXCEPTION 'Run requires ordered ranks';
    END IF;

    FOR v_idx IN 2..v_total_cards LOOP
      IF v_rank_orders[v_idx] <> v_rank_orders[v_idx - 1] + 1 THEN
        RAISE EXCEPTION 'Run requires consecutive ranks';
      END IF;
    END LOOP;

    v_meld_type := 'run';
  ELSE
    RAISE EXCEPTION 'Meld must be either a set (same rank) or a run (same suit)';
  END IF;

  RETURN v_meld_type;
END;
$$ LANGUAGE plpgsql STABLE;

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
  v_meld_type public.meld_type;
  v_created_from_head BOOLEAN := false;
  v_includes_speto BOOLEAN := false;
  v_score_value INTEGER := 0;
  v_speto_card_ids UUID[] := '{}';
BEGIN
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards (including discard)';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS card_id;

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  v_meld_type := public.validate_dummy_meld(p_session_id, p_meld_cards)::public.meld_type;

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

  SELECT
    COALESCE(BOOL_OR(is_head), false),
    COALESCE(BOOL_OR(is_speto), false),
    COALESCE(SUM(card_value), 0),
    COALESCE(array_agg(id) FILTER (WHERE is_speto), '{}')
  INTO v_created_from_head, v_includes_speto, v_score_value, v_speto_card_ids
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_meld_cards);

  v_meld_id := uuid_generate_v4();

  INSERT INTO public.game_melds (
    id,
    session_id,
    gamer_id,
    meld_type,
    created_from_head,
    includes_speto,
    score_value,
    metadata,
    created_at
  ) VALUES (
    v_meld_id,
    p_session_id,
    p_gamer_id,
    v_meld_type,
    v_created_from_head,
    v_includes_speto,
    v_score_value,
    jsonb_build_object(
      'card_ids', p_meld_cards,
      'speto_card_ids', v_speto_card_ids
    ),
    NOW()
  );

  WITH card_input AS (
    SELECT card_id, ord - 1 AS card_index
    FROM unnest(p_meld_cards) WITH ORDINALITY AS t(card_id, ord)
  )
  UPDATE public.game_cards gc
  SET location = 'meld',
      owner_gamer_id = p_gamer_id,
      meld_id = v_meld_id,
      meld_card_index = card_input.card_index,
      position_in_location = NULL,
      updated_at = NOW()
  FROM card_input
  WHERE gc.id = card_input.card_id
    AND gc.session_id = p_session_id;

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

  INSERT INTO public.game_score_events (
    session_id,
    gamer_id,
    event_type,
    points,
    related_meld_id,
    related_card_ids,
    metadata
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'meld_points',
    v_score_value,
    v_meld_id,
    p_meld_cards,
    jsonb_build_object('meld_type', v_meld_type::TEXT)
  );

  IF v_created_from_head THEN
    INSERT INTO public.game_score_events (
      session_id,
      gamer_id,
      event_type,
      points,
      related_meld_id,
      related_card_ids,
      metadata
    ) VALUES (
      p_session_id,
      p_gamer_id,
      'head_bonus',
      50,
      v_meld_id,
      p_meld_cards,
      jsonb_build_object('reason', 'meld_created_from_head')
    );
  END IF;

  IF v_includes_speto THEN
    INSERT INTO public.game_score_events (
      session_id,
      gamer_id,
      event_type,
      points,
      related_meld_id,
      related_card_ids,
      metadata
    ) VALUES (
      p_session_id,
      p_gamer_id,
      'spe_to_meld_bonus',
      50,
      v_meld_id,
      v_speto_card_ids,
      jsonb_build_object('reason', 'spe_to_in_meld')
    );
  END IF;

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
-- FETCH LATEST GAME RESULT
-- =====================================================

CREATE OR REPLACE FUNCTION public.fetch_latest_game_result(
  p_room_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_can_access BOOLEAN;
  v_latest_result JSONB;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT result INTO v_latest_result
  FROM public.game_results
  WHERE room_id = p_room_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_latest_result;
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
  v_session_scores JSONB;
  v_winner_score INTEGER := 0;
  v_finish_bonus_points INTEGER := 0;
  v_player_elem JSONB;
  v_player_id UUID;
  v_deadwood_value_player INTEGER;
  v_deadwood_cards_json JSONB;
  v_deadwood_card_ids UUID[];
BEGIN
  IF p_winning_type IS NULL THEN
    RAISE EXCEPTION 'Winning type is required';
  END IF;

  IF NOT (p_winning_type = ANY(ARRAY['knock', 'gin', 'dummy_finish'])) THEN
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

  v_session_scores := public.compute_thai_dummy_scores(p_session_id);

  WITH player_deadwood AS (
    SELECT
      gh.session_id,
      gh.gamer_id,
      COALESCE(jsonb_array_length(score_elem.elem->'deadwood_cards'), 0) AS card_count,
      COALESCE((score_elem.elem->>'deadwood_score')::INTEGER, 0) AS total_value
    FROM public.game_hands gh
    LEFT JOIN LATERAL (
      SELECT elem
      FROM jsonb_array_elements(v_session_scores) AS elem
      WHERE elem->>'gamer_id' = gh.gamer_id::TEXT
      LIMIT 1
    ) AS score_elem ON TRUE
    WHERE gh.session_id = p_session_id
  )
  UPDATE public.game_hands gh
  SET deadwood_count = pd.card_count,
      deadwood_value = pd.total_value,
      updated_at = NOW()
  FROM player_deadwood pd
  WHERE gh.session_id = pd.session_id
    AND gh.gamer_id = pd.gamer_id;

  FOR v_player_elem IN
    SELECT elem
    FROM jsonb_array_elements(v_session_scores) elem
  LOOP
    v_player_id := (v_player_elem->>'gamer_id')::UUID;
    v_deadwood_value_player := COALESCE((v_player_elem->>'deadwood_score')::INTEGER, 0);
    v_deadwood_cards_json := COALESCE(v_player_elem->'deadwood_cards', '[]'::jsonb);
    v_deadwood_card_ids := ARRAY(
      SELECT (card_elem->>'card_id')::UUID
      FROM jsonb_array_elements(v_deadwood_cards_json) card_elem
      WHERE card_elem ? 'card_id'
    );

    IF v_player_id = p_gamer_id THEN
      v_finish_bonus_points := CASE
        WHEN p_winning_type IN ('dummy_finish', 'knock', 'gin') THEN 50
        ELSE 0
      END;

      IF v_finish_bonus_points <> 0 THEN
        INSERT INTO public.game_score_events (
          session_id,
          gamer_id,
          event_type,
          points,
          related_meld_id,
          related_card_ids,
          metadata
        ) VALUES (
          p_session_id,
          v_player_id,
          'knock_bonus',
          v_finish_bonus_points,
          NULL,
          '{}',
          jsonb_build_object('winning_type', p_winning_type::TEXT)
        );
      END IF;
    ELSE
      IF v_deadwood_value_player > 0 THEN
        INSERT INTO public.game_score_events (
          session_id,
          gamer_id,
          event_type,
          points,
          related_meld_id,
          related_card_ids,
          metadata
        ) VALUES (
          p_session_id,
          v_player_id,
          'hand_penalty',
          -v_deadwood_value_player,
          NULL,
          v_deadwood_card_ids,
          jsonb_build_object(
            'deadwood_cards', v_deadwood_cards_json,
            'deadwood_value', v_deadwood_value_player
          )
        );
      END IF;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(points), 0)
  INTO v_winner_score
  FROM public.game_score_events
  WHERE session_id = p_session_id
    AND gamer_id = p_gamer_id;

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
      'thai_dummy_score', v_winner_score,
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
    total_rounds,
    total_moves,
    game_duration_seconds,
    summary_metadata
  ) VALUES (
    v_room_id,
    p_session_id,
    p_gamer_id,
    p_winning_type,
    v_session.round_number,
    v_total_moves,
    v_duration_seconds,
    jsonb_build_object('winning_type', p_winning_type::TEXT)
  ) RETURNING id INTO v_result_id;

  WITH score_json AS (
    SELECT
      (elem->>'gamer_id')::UUID AS gamer_id,
      COALESCE((elem->>'deadwood_score')::INTEGER, 0) AS deadwood_score,
      COALESCE(elem->'deadwood_cards', '[]'::jsonb) AS deadwood_cards
    FROM jsonb_array_elements(v_session_scores) elem
  ), event_sums AS (
    SELECT
      gamer_id,
      COALESCE(SUM(CASE WHEN event_type = 'meld_points' THEN points ELSE 0 END), 0) AS meld_points,
      COALESCE(SUM(CASE WHEN event_type IN ('head_bonus','spe_to_meld_bonus','spe_to_deposit_bonus','knock_bonus','dark_knock_bonus','color_knock_bonus','dark_color_knock_bonus') THEN points ELSE 0 END), 0) AS bonus_points,
      COALESCE(SUM(CASE WHEN event_type = 'hand_penalty' THEN points ELSE 0 END), 0) AS hand_points,
      COALESCE(SUM(CASE WHEN event_type IN ('dummy_penalty','head_penalty','full_penalty','spe_to_penalty','foolish_penalty') THEN points ELSE 0 END), 0) AS penalty_points,
      COALESCE(array_agg(DISTINCT event_type::TEXT), '{}') AS event_types
    FROM public.game_score_events
    WHERE session_id = p_session_id
    GROUP BY gamer_id
  ), melds AS (
    SELECT gamer_id, COALESCE(array_agg(id ORDER BY created_at), '{}') AS meld_ids
    FROM public.game_melds
    WHERE session_id = p_session_id
    GROUP BY gamer_id
  ), remaining_cards AS (
    SELECT
      sj.gamer_id,
      COALESCE(ARRAY(
        SELECT (card_elem->>'card_id')::UUID
        FROM jsonb_array_elements(sj.deadwood_cards) card_elem
        WHERE card_elem ? 'card_id'
      ), '{}'::UUID[]) AS card_ids
    FROM score_json sj
  ), combined AS (
    SELECT
      sj.gamer_id,
      COALESCE(es.meld_points, 0) AS meld_points,
      COALESCE(es.bonus_points, 0) AS bonus_points,
      COALESCE(es.hand_points, 0) AS hand_points,
      COALESCE(es.penalty_points, 0) AS penalty_points,
      COALESCE(es.event_types, '{}') AS event_types,
      COALESCE(m.meld_ids, '{}') AS meld_ids,
      COALESCE(rc.card_ids, '{}'::UUID[]) AS remaining_card_ids,
      sj.deadwood_score,
      sj.deadwood_cards
    FROM score_json sj
    LEFT JOIN event_sums es ON es.gamer_id = sj.gamer_id
    LEFT JOIN melds m ON m.gamer_id = sj.gamer_id
    LEFT JOIN remaining_cards rc ON rc.gamer_id = sj.gamer_id
  ), ranked AS (
    SELECT
      combined.*,
      (combined.meld_points + combined.bonus_points + combined.hand_points + combined.penalty_points) AS total_points,
      ROW_NUMBER() OVER (
        ORDER BY (combined.meld_points + combined.bonus_points + combined.hand_points + combined.penalty_points) DESC,
                 (combined.gamer_id = p_gamer_id) DESC,
                 combined.gamer_id::TEXT
      ) AS position
    FROM combined
  )
  INSERT INTO public.game_result_players (
    id,
    result_id,
    gamer_id,
    position,
    total_points,
    meld_points,
    bonus_points,
    penalty_points,
    hand_points,
    is_winner,
    special_events,
    displayed_meld_ids,
    remaining_card_ids,
    metadata,
    created_at
  )
  SELECT
    uuid_generate_v4(),
    v_result_id,
    ranked.gamer_id,
    ranked.position,
    ranked.total_points,
    ranked.meld_points,
    ranked.bonus_points,
    ranked.penalty_points,
    ranked.hand_points,
    ranked.gamer_id = p_gamer_id,
    ranked.event_types,
    ranked.meld_ids,
    ranked.remaining_card_ids,
    jsonb_build_object(
      'deadwood_score', ranked.deadwood_score,
      'deadwood_cards', ranked.deadwood_cards
    ),
    NOW()
  FROM ranked;

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
    'my_melds', (
      SELECT json_agg(
        json_build_object(
          'meld_id', mg.meld_id,
          'created_at', mg.created_at,
          'cards', (
            SELECT json_agg(row_to_json(gc) ORDER BY gc.rank, gc.suit)
            FROM public.game_cards gc
            WHERE gc.meld_id = mg.meld_id
          )
        )
        ORDER BY mg.created_at
      )
      FROM (
        SELECT gc.meld_id, MIN(gc.created_at) AS created_at
        FROM public.game_cards gc
        WHERE gc.session_id = p_session_id
          AND gc.location = 'meld'
          AND gc.meld_id IS NOT NULL
          AND gc.owner_gamer_id = p_gamer_id
        GROUP BY gc.meld_id
      ) AS mg
    ),
    'table_melds', (
      SELECT json_agg(
        json_build_object(
          'meld_id', mg.meld_id,
          'owner_gamer_id', mg.owner_gamer_id,
          'created_at', mg.created_at,
          'cards', (
            SELECT json_agg(row_to_json(gc) ORDER BY gc.rank, gc.suit)
            FROM public.game_cards gc
            WHERE gc.meld_id = mg.meld_id
          )
        )
        ORDER BY mg.created_at
      )
      FROM (
        SELECT
          gc.meld_id,
          MIN(gc.created_at) AS created_at,
          MIN(gc.owner_gamer_id::text) FILTER (WHERE gc.owner_gamer_id IS NOT NULL) AS owner_gamer_id
        FROM public.game_cards gc
        WHERE gc.session_id = p_session_id
          AND gc.location = 'meld'
          AND gc.meld_id IS NOT NULL
          AND (gc.owner_gamer_id IS DISTINCT FROM p_gamer_id)
        GROUP BY gc.meld_id
      ) AS mg
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
