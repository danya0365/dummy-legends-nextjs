-- Dummy Legends Game Play RPC Functions
-- Created: 2025-08-30
-- Description: RPC functions for actual gameplay

-- Initialize game state (deal cards and start)
CREATE OR REPLACE FUNCTION initialize_game_state(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_players RECORD;
  v_player_count INTEGER;
  v_deck JSONB;
  v_player_hands JSONB;
  v_discard_pile JSONB;
  v_first_player_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user is in the room
  IF NOT EXISTS(
    SELECT 1 FROM public.room_players 
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not in this room';
  END IF;

  -- Get player count
  SELECT COUNT(*) INTO v_player_count
  FROM public.room_players
  WHERE room_id = p_room_id;

  -- Get first player (position 0)
  SELECT user_id INTO v_first_player_id
  FROM public.room_players
  WHERE room_id = p_room_id AND position = 0;

  -- Initialize game state
  -- Note: Actual card dealing is handled by application logic
  -- This just creates the initial state structure
  INSERT INTO public.game_states (
    room_id,
    deck,
    discard_pile,
    current_turn_user_id,
    turn_start_time,
    round,
    player_hands,
    player_melds,
    scores
  ) VALUES (
    p_room_id,
    '[]'::jsonb,  -- Will be populated by app
    '[]'::jsonb,
    v_first_player_id,
    NOW(),
    1,
    '{}'::jsonb,  -- Will be populated by app
    '{}'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (room_id) DO UPDATE SET
    deck = '[]'::jsonb,
    discard_pile = '[]'::jsonb,
    current_turn_user_id = v_first_player_id,
    turn_start_time = NOW(),
    round = 1,
    player_hands = '{}'::jsonb,
    player_melds = '{}'::jsonb,
    scores = '{}'::jsonb;

  -- Return success
  SELECT json_build_object(
    'success', TRUE,
    'firstPlayerId', v_first_player_id,
    'playerCount', v_player_count
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Draw card from deck or discard pile
CREATE OR REPLACE FUNCTION draw_card(
  p_room_id UUID,
  p_from_discard BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_game_state RECORD;
  v_drawn_card JSONB;
  v_new_deck JSONB;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get game state
  SELECT * INTO v_game_state
  FROM public.game_states
  WHERE room_id = p_room_id;

  IF v_game_state IS NULL THEN
    RAISE EXCEPTION 'Game state not found';
  END IF;

  -- Check if it's user's turn
  IF v_game_state.current_turn_user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Draw from discard pile or deck
  IF p_from_discard THEN
    -- Draw from discard pile
    IF jsonb_array_length(v_game_state.discard_pile) = 0 THEN
      RAISE EXCEPTION 'Discard pile is empty';
    END IF;
    
    v_drawn_card := v_game_state.discard_pile->-1;
    
    -- Remove last card from discard pile
    UPDATE public.game_states
    SET discard_pile = v_game_state.discard_pile - (jsonb_array_length(v_game_state.discard_pile) - 1)
    WHERE room_id = p_room_id;
  ELSE
    -- Draw from deck
    IF jsonb_array_length(v_game_state.deck) = 0 THEN
      RAISE EXCEPTION 'Deck is empty';
    END IF;
    
    v_drawn_card := v_game_state.deck->0;
    
    -- Remove first card from deck
    v_new_deck := v_game_state.deck - 0;
    
    UPDATE public.game_states
    SET deck = v_new_deck
    WHERE room_id = p_room_id;
  END IF;

  -- Log action
  INSERT INTO public.game_actions (room_id, user_id, action_type, action_data)
  VALUES (p_room_id, v_user_id, 'draw', json_build_object(
    'fromDiscard', p_from_discard,
    'card', v_drawn_card
  ));

  SELECT json_build_object(
    'success', TRUE,
    'card', v_drawn_card
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Discard a card
CREATE OR REPLACE FUNCTION discard_card(
  p_room_id UUID,
  p_card JSONB
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_game_state RECORD;
  v_new_discard_pile JSONB;
  v_next_player_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get game state
  SELECT * INTO v_game_state
  FROM public.game_states
  WHERE room_id = p_room_id;

  -- Check if it's user's turn
  IF v_game_state.current_turn_user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Add card to discard pile
  v_new_discard_pile := v_game_state.discard_pile || p_card;

  -- Get next player
  SELECT user_id INTO v_next_player_id
  FROM public.room_players
  WHERE room_id = p_room_id
    AND position = (
      SELECT (position + 1) % (SELECT COUNT(*) FROM public.room_players WHERE room_id = p_room_id)
      FROM public.room_players
      WHERE room_id = p_room_id AND user_id = v_user_id
    );

  -- Update game state
  UPDATE public.game_states
  SET 
    discard_pile = v_new_discard_pile,
    current_turn_user_id = v_next_player_id,
    turn_start_time = NOW()
  WHERE room_id = p_room_id;

  -- Log action
  INSERT INTO public.game_actions (room_id, user_id, action_type, action_data)
  VALUES (p_room_id, v_user_id, 'discard', p_card);

  SELECT json_build_object(
    'success', TRUE,
    'nextPlayerId', v_next_player_id
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Meld cards (lay down a set or run)
CREATE OR REPLACE FUNCTION meld_cards(
  p_room_id UUID,
  p_cards JSONB
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_game_state RECORD;
  v_player_melds JSONB;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get game state
  SELECT * INTO v_game_state
  FROM public.game_states
  WHERE room_id = p_room_id;

  -- Check if it's user's turn
  IF v_game_state.current_turn_user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Get player's current melds
  v_player_melds := COALESCE(v_game_state.player_melds->v_user_id::text, '[]'::jsonb);

  -- Add new meld
  v_player_melds := v_player_melds || jsonb_build_array(p_cards);

  -- Update game state
  UPDATE public.game_states
  SET player_melds = jsonb_set(
    player_melds,
    ARRAY[v_user_id::text],
    v_player_melds
  )
  WHERE room_id = p_room_id;

  -- Log action
  INSERT INTO public.game_actions (room_id, user_id, action_type, action_data)
  VALUES (p_room_id, v_user_id, 'meld', p_cards);

  SELECT json_build_object('success', TRUE) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Knock (end round)
CREATE OR REPLACE FUNCTION knock(
  p_room_id UUID,
  p_deadwood_value INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_game_state RECORD;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get game state
  SELECT * INTO v_game_state
  FROM public.game_states
  WHERE room_id = p_room_id;

  -- Check if it's user's turn
  IF v_game_state.current_turn_user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  -- Check if deadwood is low enough to knock (typically <= 10)
  IF p_deadwood_value > 10 THEN
    RAISE EXCEPTION 'Deadwood too high to knock';
  END IF;

  -- Log action
  INSERT INTO public.game_actions (room_id, user_id, action_type, action_data)
  VALUES (p_room_id, v_user_id, 'knock', json_build_object(
    'deadwoodValue', p_deadwood_value
  ));

  SELECT json_build_object(
    'success', TRUE,
    'knockerId', v_user_id,
    'deadwoodValue', p_deadwood_value
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update game state (for app-side state management)
CREATE OR REPLACE FUNCTION update_game_state(
  p_room_id UUID,
  p_deck JSONB DEFAULT NULL,
  p_discard_pile JSONB DEFAULT NULL,
  p_player_hands JSONB DEFAULT NULL,
  p_player_melds JSONB DEFAULT NULL,
  p_scores JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user is in the room
  IF NOT EXISTS(
    SELECT 1 FROM public.room_players 
    WHERE room_id = p_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not in this room';
  END IF;

  -- Update game state
  UPDATE public.game_states
  SET
    deck = COALESCE(p_deck, deck),
    discard_pile = COALESCE(p_discard_pile, discard_pile),
    player_hands = COALESCE(p_player_hands, player_hands),
    player_melds = COALESCE(p_player_melds, player_melds),
    scores = COALESCE(p_scores, scores),
    updated_at = NOW()
  WHERE room_id = p_room_id;

  SELECT json_build_object('success', TRUE) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initialize_game_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION draw_card(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION discard_card(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION meld_cards(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION knock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_game_state(UUID, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;
