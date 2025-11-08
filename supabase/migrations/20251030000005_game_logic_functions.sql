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
  
  PERFORM public.log_game_event(
    v_session_id,
    p_host_gamer_id,
    'session_started'::public.game_event_type,
    'เริ่มเกม',
    jsonb_build_object(
      'room_id', p_room_id,
      'player_count', v_player_count,
      'cards_per_player', v_cards_per_player,
      'initial_discard_card_id', v_head_card
    ),
    NULL,
    p_guest_identifier
  );

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
  v_last_draw_move_number INTEGER;
  v_has_post_draw_discard BOOLEAN := false;
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
  SELECT gm.move_number
  INTO v_last_draw_move_number
  FROM public.game_moves gm
  WHERE gm.session_id = p_session_id
    AND gm.gamer_id = p_gamer_id
    AND gm.move_type IN ('draw_deck', 'draw_discard')
  ORDER BY gm.move_number DESC
  LIMIT 1;

  IF v_last_draw_move_number IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.game_moves gm
      WHERE gm.session_id = p_session_id
        AND gm.gamer_id = p_gamer_id
        AND gm.move_type = 'discard'
        AND gm.move_number > v_last_draw_move_number
    ) INTO v_has_post_draw_discard;

    IF NOT v_has_post_draw_discard THEN
      RAISE EXCEPTION 'Must discard before drawing again';
    END IF;
  END IF;

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
  WHERE session_id = p_session_id
    AND gamer_id = p_gamer_id;

  -- บันทึกการจั่วไพ่จากกองหลักลงประวัติการเล่น
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
  
  PERFORM public.log_game_event(
    p_session_id,
    p_gamer_id,
    'draw_deck'::public.game_event_type,
    'จั่วไพ่จากกองหลัก',
    jsonb_build_object(
      'source', 'deck',
      'reshuffled_discard', COALESCE(v_discard_count, 0) > 0
    ),
    NULL,
    p_guest_identifier
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
  v_last_draw_move_type public.game_move_type;
  v_last_draw_move_data JSONB;
  v_last_draw_move_number INTEGER;
  v_last_draw_discard_card UUID;
  v_last_draw_card_still_in_hand BOOLEAN := false;
BEGIN
  -- ตรวจสอบว่ามีไพ่ครบอย่างน้อย 3 ใบและเป็นไพ่ไม่ซ้ำกัน
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS cards(card_id);

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  v_meld_type := public.validate_dummy_meld(p_session_id, p_meld_cards)::public.meld_type;

  -- ตรวจสิทธิ์ผู้เล่นและยืนยันว่าเป็นตาของตัวเอง
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

  -- ตรวจสอบว่าจั่วไพ่มาในเทิร์นปัจจุบัน และยังไม่ทิ้งไพ่หลังจากจั่ว (ตามกติกาใน RULES.md)
  SELECT
    gm.move_type,
    gm.move_data,
    gm.move_number
  INTO v_last_draw_move_type, v_last_draw_move_data, v_last_draw_move_number
  FROM public.game_moves gm
  WHERE gm.session_id = p_session_id
    AND gm.gamer_id = p_gamer_id
    AND gm.move_type IN ('draw_deck', 'draw_discard')
  ORDER BY gm.move_number DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Must draw a card before creating a meld';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.game_moves gm
    WHERE gm.session_id = p_session_id
      AND gm.gamer_id = p_gamer_id
      AND gm.move_type = 'discard'
      AND gm.move_number > v_last_draw_move_number
  ) THEN
    RAISE EXCEPTION 'Must draw a card before creating a meld';
  END IF;

  IF v_last_draw_move_type = 'draw_discard' THEN
    IF v_last_draw_move_data ->> 'card_id' IS NULL THEN
      RAISE EXCEPTION 'Invalid draw_discard move data';
    END IF;

    v_last_draw_discard_card := (v_last_draw_move_data ->> 'card_id')::uuid;

    SELECT owner_gamer_id = p_gamer_id AND location = 'hand'
    INTO v_last_draw_card_still_in_hand
    FROM public.game_cards
    WHERE id = v_last_draw_discard_card
      AND session_id = p_session_id;

    IF COALESCE(v_last_draw_card_still_in_hand, false)
       AND NOT (v_last_draw_discard_card = ANY(p_meld_cards)) THEN
      RAISE EXCEPTION 'Discard card drawn must be part of meld';
    END IF;
  END IF;

  -- สรุปข้อมูลชุดเกิด (head, spe-to, คะแนน)
  SELECT
    COALESCE(BOOL_OR(is_head), false),
    COALESCE(BOOL_OR(is_speto), false),
    COALESCE(SUM(card_value), 0),
    COALESCE(array_agg(id) FILTER (WHERE is_speto), '{}')
  INTO v_created_from_head, v_includes_speto, v_score_value, v_speto_card_ids
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_meld_cards);

  -- สร้าง meld ใหม่พร้อม metadata เก็บข้อมูลไพ่/spe-to
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

  -- ย้ายไพ่จากมือไปผูกกับ meld พร้อมจัดลำดับใหม่
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

  -- บันทึก event คะแนนจากการเกิด พร้อมโบนัสต่าง ๆ
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

  PERFORM public.log_game_event(
    p_session_id,
    p_gamer_id,
    'create_meld'::public.game_event_type,
    'เกิดไพ่',
    jsonb_build_object(
      'meld_id', v_meld_id,
      'meld_type', v_meld_type::TEXT,
      'card_ids', to_jsonb(p_meld_cards),
      'includes_speto', v_includes_speto,
      'created_from_head', v_created_from_head,
      'score_value', v_score_value
    ),
    NULL,
    p_guest_identifier
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

  -- ถ้าเหลือไพ่ใบเดียวหลังเกิด ให้บังคับทิ้งลงกองและจัดลำดับกองทิ้งใหม่
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
      p_winning_type => 'dummy_finish'::public.game_move_type,
      p_guest_identifier => p_guest_identifier
    );

    RETURN v_result;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- LAY OFF CARDS
-- =====================================================

CREATE OR REPLACE FUNCTION public.layoff_cards(
  p_session_id UUID,
  p_gamer_id UUID,
  p_target_meld_id UUID,
  p_target_meld_card_ids UUID[],
  p_layoff_card_ids UUID[],
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_can_access BOOLEAN;
  v_current_turn UUID;
  v_target_meld RECORD;
  v_target_cards_count INTEGER;
  v_target_owner UUID;
  v_target_suit TEXT;
  v_target_rank public.card_rank;
  v_existing_rank_orders INTEGER[] := '{}';
  v_new_rank_orders INTEGER[] := '{}';
  v_combined_rank_orders INTEGER[] := '{}';
  v_new_cards UUID[] := '{}';
  v_new_cards_count INTEGER := 0;
  v_new_suit_count INTEGER := 0;
  v_new_min_suit TEXT;
  v_new_max_suit TEXT;
  v_score_value INTEGER := 0;
  v_speto_card_ids UUID[] := '{}';
  v_speto_count INTEGER := 0;
  v_move_number INTEGER;
  v_metadata JSONB;
  v_total_cards INTEGER := 0;
  v_existing_score INTEGER := 0;
BEGIN
  IF p_layoff_card_ids IS NULL OR array_length(p_layoff_card_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Layoff requires at least one card';
  END IF;

  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT current_turn_gamer_id
  INTO v_current_turn
  FROM public.game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_current_turn IS DISTINCT FROM p_gamer_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  SELECT
    gm.id,
    gm.session_id,
    gm.gamer_id,
    gm.meld_type,
    gm.metadata,
    gm.score_value
  INTO v_target_meld
  FROM public.game_melds gm
  WHERE gm.id = p_target_meld_id
    AND gm.session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target meld not found';
  END IF;

  v_target_owner := v_target_meld.gamer_id;

  WITH target_cards AS (
    SELECT gc.id
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.meld_id = p_target_meld_id
    FOR UPDATE
  )
  SELECT COUNT(*)
  INTO v_target_cards_count
  FROM target_cards;

  IF v_target_cards_count = 0 THEN
    RAISE EXCEPTION 'Target meld has no cards';
  END IF;

  -- Ensure layoff cards are unique and belong to the player
  IF EXISTS (
    SELECT 1
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND id = ANY(p_layoff_card_ids)
      AND NOT (owner_gamer_id = p_gamer_id AND location = 'hand')
  ) THEN
    RAISE EXCEPTION 'Layoff cards must be in your hand';
  END IF;

  WITH layoff_cards AS (
    SELECT
      gc.id,
      gc.rank,
      gc.suit,
      public.get_card_rank_order(gc.rank) AS rank_order
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.id = ANY(p_layoff_card_ids)
    FOR UPDATE
  )
  SELECT
    array_agg(layoff_cards.id ORDER BY layoff_cards.id),
    array_agg(layoff_cards.rank_order ORDER BY layoff_cards.id),
    COUNT(DISTINCT layoff_cards.suit),
    MIN(layoff_cards.suit),
    MAX(layoff_cards.suit),
    MIN(layoff_cards.rank)
  INTO v_new_cards, v_new_rank_orders, v_new_suit_count, v_new_min_suit, v_new_max_suit, v_target_rank
  FROM layoff_cards;

  IF v_new_cards IS NULL OR array_length(v_new_cards, 1) <> array_length(p_layoff_card_ids, 1) THEN
    RAISE EXCEPTION 'Some layoff cards were not found';
  END IF;

  v_new_cards_count := array_length(v_new_cards, 1);

  SELECT
    MIN(gc.suit),
    MAX(gc.suit),
    COUNT(DISTINCT gc.suit),
    array_agg(public.get_card_rank_order(gc.rank) ORDER BY COALESCE(gc.meld_card_index, 9999), gc.id)
  INTO v_target_suit, v_new_max_suit, v_new_suit_count, v_existing_rank_orders
  FROM public.game_cards gc
  WHERE gc.session_id = p_session_id
    AND gc.meld_id = p_target_meld_id;

  IF v_target_meld.meld_type = 'set' THEN
    SELECT DISTINCT rank INTO v_target_rank
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND meld_id = p_target_meld_id
    LIMIT 1;

    IF EXISTS (
      SELECT 1
      FROM public.game_cards
      WHERE session_id = p_session_id
        AND id = ANY(p_layoff_card_ids)
        AND rank IS DISTINCT FROM v_target_rank
    ) THEN
      RAISE EXCEPTION 'Layoff cards must match set rank';
    END IF;
  ELSE
    -- Run validation
    SELECT DISTINCT suit INTO v_target_suit
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND meld_id = p_target_meld_id
    LIMIT 1;

    IF v_target_suit IS NULL THEN
      RAISE EXCEPTION 'Target run has invalid cards';
    END IF;

    IF v_new_suit_count <> 1 OR v_new_min_suit IS DISTINCT FROM v_target_suit OR v_new_max_suit IS DISTINCT FROM v_target_suit THEN
      RAISE EXCEPTION 'Layoff cards must match run suit';
    END IF;

    SELECT array_agg(val ORDER BY val)
    INTO v_combined_rank_orders
    FROM unnest(array_cat(v_existing_rank_orders, v_new_rank_orders)) AS val;

    v_total_cards := array_length(v_combined_rank_orders, 1);
    IF v_total_cards <> array_length(v_existing_rank_orders, 1) + array_length(v_new_rank_orders, 1) THEN
      RAISE EXCEPTION 'Run cannot contain duplicate ranks';
    END IF;

    FOR i IN 2..v_total_cards LOOP
      IF v_combined_rank_orders[i] <> v_combined_rank_orders[i - 1] + 1 THEN
        RAISE EXCEPTION 'Run must remain consecutive';
      END IF;
    END LOOP;
  END IF;

  -- Move cards to meld
  UPDATE public.game_cards
  SET location = 'meld',
      owner_gamer_id = v_target_owner,
      meld_id = p_target_meld_id,
      meld_card_index = NULL,
      position_in_location = NULL,
      updated_at = NOW()
  WHERE session_id = p_session_id
    AND id = ANY(p_layoff_card_ids);

  -- Update order within meld
  WITH ordered AS (
    SELECT
      gc.id,
      ROW_NUMBER() OVER (
        ORDER BY
          public.get_card_rank_order(gc.rank),
          gc.suit,
          gc.id
      ) - 1 AS new_index
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.meld_id = p_target_meld_id
  )
  UPDATE public.game_cards gc
  SET meld_card_index = ordered.new_index,
      updated_at = NOW()
  FROM ordered
  WHERE gc.id = ordered.id;

  -- Update hand count
  UPDATE public.game_hands
  SET card_count = card_count - v_new_cards_count,
      updated_at = NOW()
  WHERE session_id = p_session_id
    AND gamer_id = p_gamer_id;

  -- Recalculate score and metadata
  SELECT
    COALESCE(SUM(card_value), 0),
    COALESCE(array_agg(id) FILTER (WHERE is_speto), '{}')
  INTO v_score_value, v_speto_card_ids
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_layoff_card_ids);

  v_speto_count := COALESCE(array_length(v_speto_card_ids, 1), 0);

  v_metadata := COALESCE(v_target_meld.metadata, '{}'::jsonb);
  v_metadata := jsonb_set(
    v_metadata,
    '{card_ids}',
    COALESCE(v_metadata -> 'card_ids', '[]'::jsonb) || to_jsonb(p_layoff_card_ids),
    true
  );
  IF v_speto_count > 0 THEN
    v_metadata := jsonb_set(
      v_metadata,
      '{speto_card_ids}',
      COALESCE(v_metadata -> 'speto_card_ids', '[]'::jsonb) || to_jsonb(v_speto_card_ids),
      true
    );
  END IF;

  UPDATE public.game_melds
  SET metadata = v_metadata,
      score_value = GREATEST(COALESCE(score_value, 0), 0) + v_score_value + (v_speto_count * 50)
  WHERE id = p_target_meld_id;

  -- Score events
  IF v_score_value > 0 THEN
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
      p_target_meld_id,
      p_layoff_card_ids,
      jsonb_build_object(
        'action', 'layoff',
        'target_meld_id', p_target_meld_id
      )
    );
  END IF;

  PERFORM public.log_game_event(
    p_session_id,
    p_gamer_id,
    'layoff'::public.game_event_type,
    'ฝากไพ่',
    jsonb_build_object(
      'target_meld_id', p_target_meld_id,
      'card_ids', to_jsonb(p_layoff_card_ids),
      'target_owner', v_target_owner,
      'speto_count', v_speto_count
    ),
    v_target_owner,
    p_guest_identifier
  );

  IF v_speto_count > 0 THEN
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
      'spe_to_deposit_bonus',
      50 * v_speto_count,
      p_target_meld_id,
      v_speto_card_ids,
      jsonb_build_object(
        'action', 'layoff',
        'target_meld_id', p_target_meld_id
      )
    );

    -- บันทึกโทษให้เจ้าของกองที่ถูกฝากสเปโต (ถ้าเป็นคนอื่น)
    IF v_target_owner IS DISTINCT FROM p_gamer_id THEN
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
        v_target_owner,
        'spe_to_penalty',
        -50 * array_length(v_speto_card_ids, 1),
        p_target_meld_id,
        v_speto_card_ids,
        jsonb_build_object(
          'action', 'layoff_target',
          'depositor_gamer_id', p_gamer_id
        )
      );
    END IF;
  END IF;

  -- Record move
  SELECT COALESCE(MAX(move_number), 0) + 1
  INTO v_move_number
  FROM public.game_moves
  WHERE session_id = p_session_id;

  INSERT INTO public.game_moves (
    session_id,
    gamer_id,
    move_type,
    move_number,
    move_data
  ) VALUES (
    p_session_id,
    p_gamer_id,
    'lay_off',
    v_move_number,
    jsonb_build_object(
      'target_meld_id', p_target_meld_id,
      'card_ids', p_layoff_card_ids
    )
  );
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
  p_guest_identifier TEXT DEFAULT NULL,
  p_selected_discard_card_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_selected_discard_card_id UUID;
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
  v_cards_to_collect UUID[] := '{}';
  v_cards_collected_count INTEGER := 0;
  v_selected_position INTEGER;
  v_lowest_discard_position INTEGER;
  v_collect_from_position INTEGER;
  v_card_to_collect UUID;
  rec_discard_card RECORD;
BEGIN
  -- ตรวจสอบว่ามีไพ่ครบตามเงื่อนไข (อย่างน้อย 3 ใบรวมไพ่กองทิ้ง)
  IF p_meld_cards IS NULL OR array_length(p_meld_cards, 1) < 3 THEN
    RAISE EXCEPTION 'Meld requires at least three cards (including discard)';
  END IF;

  SELECT COUNT(DISTINCT card_id) INTO v_distinct_count
  FROM unnest(p_meld_cards) AS card_id;

  IF v_distinct_count <> array_length(p_meld_cards, 1) THEN
    RAISE EXCEPTION 'Meld cards must be unique';
  END IF;

  -- ตรวจสอบรูปแบบ meld ตามกติกา (set/run)
  v_meld_type := public.validate_dummy_meld(p_session_id, p_meld_cards)::public.meld_type;

  -- ตรวจสิทธิ์ผู้เล่นและ lock แถว session เพื่อกัน race condition
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

  -- เก็บจำนวนไพ่ในมือปัจจุบันไว้คำนวณตำแหน่งเมื่อต้องย้ายกองทิ้งขึ้นมือ
  SELECT card_count INTO v_hand_count
  FROM public.game_hands
  WHERE session_id = p_session_id AND gamer_id = p_gamer_id
  FOR UPDATE;

  -- IF v_hand_count >= 11 THEN
  --   RAISE EXCEPTION 'Hand is full, must discard first';
  -- END IF;
  --
  -- Commented out hand count check to allow drawing from discard when hand is full

  -- ระบุไพ่กองทิ้งที่ผู้เล่นเลือก (อนุญาตให้เลือกใบใดก็ได้ในกอง)
  SELECT discard_pile_top_card_id INTO v_selected_discard_card_id
  FROM public.game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF p_selected_discard_card_id IS NOT NULL THEN
    v_selected_discard_card_id := p_selected_discard_card_id;
  END IF;

  IF v_selected_discard_card_id IS NULL THEN
    RAISE EXCEPTION 'Discard pile is empty';
  END IF;

  -- ป้องกันการเลือกไพ่กองทิ้งที่ไม่ได้รวมอยู่ใน meld
  IF NOT (v_selected_discard_card_id = ANY(p_meld_cards)) THEN
    RAISE EXCEPTION 'Selected discard card must be included in meld';
  END IF;

  -- หาตำแหน่งไพ่กองทิ้งที่เลือก
  SELECT position_in_location
  INTO v_selected_position
  FROM public.game_cards
  WHERE id = v_selected_discard_card_id
    AND session_id = p_session_id
    AND location = 'discard'
  FOR UPDATE;

  IF v_selected_position IS NULL THEN
    RAISE EXCEPTION 'Selected discard card is no longer available';
  END IF;

  SELECT MIN(position_in_location)
  INTO v_lowest_discard_position
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND id = ANY(p_meld_cards)
    AND location = 'discard';

  IF v_lowest_discard_position IS NOT NULL THEN
    v_collect_from_position := LEAST(v_selected_position, v_lowest_discard_position);
  ELSE
    v_collect_from_position := v_selected_position;
  END IF;

  -- ยืนยันว่าไพ่ทั้งหมดสร้าง meld ได้จริง (ไพ่กองทิ้งต้องอยู่ในช่วงที่เก็บได้ และไพ่ที่เหลือต้องอยู่ในมือผู้เล่น)
  IF EXISTS (
    SELECT 1
    FROM unnest(p_meld_cards) AS meld_card
    LEFT JOIN public.game_cards gc
      ON gc.id = meld_card
      AND gc.session_id = p_session_id
    WHERE gc.id IS NULL
      OR NOT (
        (gc.location = 'hand' AND gc.owner_gamer_id = p_gamer_id)
        OR (gc.location = 'discard' AND gc.position_in_location >= v_collect_from_position)
      )
  ) THEN
    RAISE EXCEPTION 'Meld contains cards not accessible to player';
  END IF;

  v_cards_to_collect := ARRAY[]::UUID[];

  FOR rec_discard_card IN
    SELECT id
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND location = 'discard'
      AND position_in_location >= v_collect_from_position
    ORDER BY position_in_location
    FOR UPDATE
  LOOP
    v_cards_to_collect := array_append(v_cards_to_collect, rec_discard_card.id);
  END LOOP;

  v_cards_collected_count := COALESCE(array_length(v_cards_to_collect, 1), 0);

  IF v_cards_collected_count = 0 THEN
    RAISE EXCEPTION 'No discard cards available to collect';
  END IF;

  IF NOT (v_selected_discard_card_id = ANY(v_cards_to_collect)) THEN
    RAISE EXCEPTION 'Selected discard card not in discard stack';
  END IF;

  -- ย้ายกองทิ้งที่ต้องเก็บเข้าสู่มือ พร้อมรักษาลำดับตามกองเดิม
  FOR i IN 1..v_cards_collected_count LOOP
    v_card_to_collect := v_cards_to_collect[i];

    UPDATE public.game_cards
    SET location = 'hand',
        owner_gamer_id = p_gamer_id,
        position_in_location = v_hand_count + (i - 1),
        updated_at = NOW()
    WHERE id = v_card_to_collect
      AND session_id = p_session_id;
  END LOOP;

  -- ปรับจำนวนไพ่ในมือหลังเก็บกองทิ้ง
  UPDATE public.game_hands
  SET card_count = card_count + v_cards_collected_count,
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

  PERFORM public.log_game_event(
    p_session_id,
    p_gamer_id,
    'draw_discard'::public.game_event_type,
    'จั่วจากกองทิ้งและเกิดไพ่',
    jsonb_build_object(
      'selected_discard_card_id', v_selected_discard_card_id,
      'cards_collected', to_jsonb(v_cards_to_collect),
      'meld_id', v_meld_id,
      'meld_type', v_meld_type::TEXT
    ),
    NULL,
    p_guest_identifier
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
      'card_id', v_selected_discard_card_id,
      'selected_discard_card_id', v_selected_discard_card_id,
      'collected_discard_cards', v_cards_to_collect,
      'meld_id', v_meld_id,
      'meld_cards', p_meld_cards
    )
  );

  RETURN v_selected_discard_card_id;
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
  v_new_discard_position INTEGER;
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
  
  -- คำนวณตำแหน่งใหม่บนกองทิ้ง (ต่อจากใบบนสุดเดิม)
  SELECT COALESCE(MAX(position_in_location), -1) + 1
  INTO v_new_discard_position
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND location = 'discard';

  -- Move card to discard pile พร้อมตั้งตำแหน่งเป็นใบบนสุดใหม่
  UPDATE public.game_cards
  SET location = 'discard',
      owner_gamer_id = NULL,
      position_in_location = v_new_discard_position
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
  
  PERFORM public.log_game_event(
    p_session_id,
    p_gamer_id,
    'discard'::public.game_event_type,
    'ทิ้งไพ่',
    jsonb_build_object(
      'card_id', p_card_id,
      'next_player_id', v_next_player
    ),
    v_next_player,
    p_guest_identifier
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

  -- ตรวจสอบและบันทึกโทษการทิ้งไพ่ (ถ้าผู้เล่นถัดไปสามารถเกิดได้ทันที)
  IF v_next_player IS NOT NULL THEN
    PERFORM public.record_discard_penalty_if_needed(
      p_session_id,
      p_gamer_id,
      p_card_id,
      v_next_player
    );
  END IF;
  
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
  v_has_revealed_cards BOOLEAN := false;
  v_winner_total_card_count INTEGER := 0;
  v_winner_total_suit_count INTEGER := 0;
  v_is_dark_knock BOOLEAN := false;
  v_is_color_knock BOOLEAN := false;
  v_is_dark_color_knock BOOLEAN := false;
  v_knock_multiplier INTEGER := 1;
  v_knock_extra_points INTEGER := 0;
  v_winner_total_before_multiplier INTEGER := 0;
BEGIN
  IF p_winning_type IS NULL THEN
    RAISE EXCEPTION 'Winning type is required';
  END IF;

  IF NOT (
    p_winning_type = ANY(
      ARRAY[
        'knock'::public.game_move_type,
        'gin'::public.game_move_type,
        'dummy_finish'::public.game_move_type
      ]
    )
  ) THEN
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

  IF p_winning_type = 'gin'::public.game_move_type THEN
    IF v_deadwood_count > 0 THEN
      RAISE EXCEPTION 'Gin requires zero deadwood cards';
    END IF;
  ELSIF p_winning_type = 'knock'::public.game_move_type THEN
    IF v_deadwood_value > 10 THEN
      RAISE EXCEPTION 'Knock requires deadwood value of 10 or less';
    END IF;
  END IF;

  v_session_scores := public.compute_thai_dummy_scores(p_session_id);

  SELECT EXISTS (
           SELECT 1
           FROM public.game_melds gm
           WHERE gm.session_id = p_session_id
             AND gm.gamer_id = p_gamer_id
         )
  INTO v_has_revealed_cards;

  IF NOT v_has_revealed_cards THEN
    SELECT EXISTS (
             SELECT 1
             FROM public.game_score_events gse
             WHERE gse.session_id = p_session_id
               AND gse.gamer_id = p_gamer_id
               AND gse.event_type IN ('meld_points', 'head_bonus', 'spe_to_meld_bonus', 'spe_to_deposit_bonus')
           )
    INTO v_has_revealed_cards;
  END IF;

  SELECT
    COALESCE(COUNT(*), 0),
    COALESCE(COUNT(DISTINCT suit), 0)
  INTO v_winner_total_card_count, v_winner_total_suit_count
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND owner_gamer_id = p_gamer_id
    AND location IN ('hand', 'meld');

  v_is_dark_knock := NOT v_has_revealed_cards;
  v_is_color_knock := v_winner_total_card_count > 0 AND v_winner_total_suit_count = 1;
  v_is_dark_color_knock := v_is_dark_knock AND v_is_color_knock;

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

  -- ตรวจสอบทิ้งโง่: หาผู้เล่นที่ทิ้งไพ่ใบสุดท้ายก่อนผู้ชนะน็อก
  DECLARE
    v_last_discard_gamer_id UUID;
    v_last_discard_card_id UUID;
  BEGIN
    SELECT gm.gamer_id, (gm.move_data->>'card_id')::UUID
    INTO v_last_discard_gamer_id, v_last_discard_card_id
    FROM public.game_moves gm
    WHERE gm.session_id = p_session_id
      AND gm.move_type = 'discard'
    ORDER BY gm.move_number DESC
    LIMIT 1;

    IF v_last_discard_gamer_id IS NOT NULL 
       AND v_last_discard_gamer_id IS DISTINCT FROM p_gamer_id THEN
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
        v_last_discard_gamer_id,
        'foolish_penalty',
        -50,
        NULL,
        ARRAY[v_last_discard_card_id],
        jsonb_build_object(
          'winner_gamer_id', p_gamer_id,
          'winning_type', (p_winning_type::public.game_move_type)::TEXT
        )
      );
    END IF;
  END;

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
        WHEN p_winning_type = ANY(
          ARRAY[
            'dummy_finish'::public.game_move_type,
            'knock'::public.game_move_type,
            'gin'::public.game_move_type
          ]
        ) THEN 50
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
          jsonb_build_object(
            'winning_type',
            (p_winning_type::public.game_move_type)::TEXT
          )
        );
      END IF;
    ELSE
      -- ตรวจสอบว่าผู้เล่นนี้เคยเกิดหรือไม่ (ลบมืด)
      DECLARE
        v_has_melds BOOLEAN := false;
        v_penalty_multiplier INTEGER := 1;
        v_final_penalty INTEGER;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM public.game_melds gm
          WHERE gm.session_id = p_session_id
            AND gm.gamer_id = v_player_id
        )
        INTO v_has_melds;

        -- ถ้าไม่เคยเกิดเลย = ลบมืด คูณแต้มลบ x2
        IF NOT v_has_melds THEN
          v_penalty_multiplier := 2;
        END IF;

        IF v_deadwood_value_player > 0 THEN
          v_final_penalty := -v_deadwood_value_player * v_penalty_multiplier;

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
            v_final_penalty,
            NULL,
            v_deadwood_card_ids,
            jsonb_build_object(
              'deadwood_cards', v_deadwood_cards_json,
              'deadwood_value', v_deadwood_value_player,
              'is_dark_lose', NOT v_has_melds,
              'penalty_multiplier', v_penalty_multiplier
            )
          );
        END IF;
      END;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(points), 0)
  INTO v_winner_score
  FROM public.game_score_events
  WHERE session_id = p_session_id
    AND gamer_id = p_gamer_id;

  v_winner_total_before_multiplier := v_winner_score;

  IF v_is_dark_color_knock THEN
    v_knock_multiplier := 4;
  ELSIF v_is_dark_knock OR v_is_color_knock THEN
    v_knock_multiplier := 2;
  ELSE
    v_knock_multiplier := 1;
  END IF;

  IF v_knock_multiplier > 1 AND v_winner_total_before_multiplier > 0 THEN
    v_knock_extra_points := v_winner_total_before_multiplier * (v_knock_multiplier - 1);

    IF v_is_dark_color_knock THEN
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
        'dark_color_knock_bonus',
        v_knock_extra_points,
        NULL,
        '{}',
        jsonb_build_object(
          'base_score', v_winner_total_before_multiplier,
          'multiplier', v_knock_multiplier
        )
      );
    ELSIF v_is_dark_knock THEN
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
        'dark_knock_bonus',
        v_knock_extra_points,
        NULL,
        '{}',
        jsonb_build_object(
          'base_score', v_winner_total_before_multiplier,
          'multiplier', v_knock_multiplier
        )
      );
    ELSE
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
        'color_knock_bonus',
        v_knock_extra_points,
        NULL,
        '{}',
        jsonb_build_object(
          'base_score', v_winner_total_before_multiplier,
          'multiplier', v_knock_multiplier
        )
      );
    END IF;

    v_winner_score := v_winner_score + v_knock_extra_points;
  END IF;

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
      winning_type = (p_winning_type::public.game_move_type)::TEXT,
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
  
  WITH last_moves AS (
    SELECT
      (
        SELECT MAX(gm.move_number)
        FROM public.game_moves gm
        WHERE gm.session_id = p_session_id
          AND gm.gamer_id = p_gamer_id
          AND gm.move_type IN ('draw_deck', 'draw_discard')
      ) AS last_draw_move_number,
      (
        SELECT MAX(gm.move_number)
        FROM public.game_moves gm
        WHERE gm.session_id = p_session_id
          AND gm.gamer_id = p_gamer_id
          AND gm.move_type = 'discard'
      ) AS last_discard_move_number
  )
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
    'discard_stack', (
      SELECT json_agg(row_to_json(c) ORDER BY c.position_in_location)
      FROM public.game_cards c
      WHERE c.session_id = p_session_id
        AND c.location = 'discard'
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
    ),
    'has_drawn_this_turn', (
      SELECT
        CASE
          WHEN lm.last_draw_move_number IS NULL THEN false
          WHEN lm.last_discard_move_number IS NULL THEN true
          ELSE lm.last_draw_move_number > lm.last_discard_move_number
        END
      FROM last_moves lm
    )
  ) INTO v_result
  FROM public.game_sessions s
  CROSS JOIN last_moves
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
