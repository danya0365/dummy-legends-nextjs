-- Additional Guest RPC Functions
-- Created: 2025-08-30
-- Description: Add guest support to leave, ready, and start game functions

-- Leave game room (guest support)
CREATE OR REPLACE FUNCTION leave_game_room_guest(
  p_room_id UUID,
  p_guest_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_guest BOOLEAN;
  v_is_host BOOLEAN;
  v_player_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  v_is_guest := (v_user_id IS NULL AND p_guest_id IS NOT NULL);
  
  IF NOT v_is_guest AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated or provide guest ID';
  END IF;
  
  -- Check if user/guest is in the room
  IF v_is_guest THEN
    SELECT is_host INTO v_is_host
    FROM public.room_players
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
  ELSE
    SELECT is_host INTO v_is_host
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;
  
  IF v_is_host IS NULL THEN
    RAISE EXCEPTION 'You are not in this room';
  END IF;
  
  -- Remove player from room
  IF v_is_guest THEN
    DELETE FROM public.room_players
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
  ELSE
    DELETE FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;
  
  -- Get remaining player count
  SELECT COUNT(*) INTO v_player_count
  FROM public.room_players
  WHERE room_id = p_room_id;
  
  -- If no players left or host left, delete the room
  IF v_player_count = 0 OR v_is_host THEN
    DELETE FROM public.game_rooms WHERE id = p_room_id;
    RETURN json_build_object('success', TRUE, 'roomDeleted', TRUE);
  END IF;
  
  -- Update room player count
  UPDATE public.game_rooms
  SET current_player_count = v_player_count
  WHERE id = p_room_id;
  
  RETURN json_build_object('success', TRUE, 'roomDeleted', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle ready status (guest support)
CREATE OR REPLACE FUNCTION toggle_ready_status_guest(
  p_room_id UUID,
  p_guest_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_guest BOOLEAN;
  v_current_status BOOLEAN;
  v_new_status BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_is_guest := (v_user_id IS NULL AND p_guest_id IS NOT NULL);
  
  IF NOT v_is_guest AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated or provide guest ID';
  END IF;
  
  -- Get current ready status
  IF v_is_guest THEN
    SELECT is_ready INTO v_current_status
    FROM public.room_players
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
  ELSE
    SELECT is_ready INTO v_current_status
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;
  
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'You are not in this room';
  END IF;
  
  -- Toggle status
  v_new_status := NOT v_current_status;
  
  -- Update ready status
  IF v_is_guest THEN
    UPDATE public.room_players
    SET is_ready = v_new_status, updated_at = NOW()
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
  ELSE
    UPDATE public.room_players
    SET is_ready = v_new_status, updated_at = NOW()
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', TRUE,
    'isReady', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start game (guest support)
CREATE OR REPLACE FUNCTION start_game_guest(
  p_room_id UUID,
  p_guest_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_guest BOOLEAN;
  v_is_host BOOLEAN;
  v_all_ready BOOLEAN;
  v_player_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  v_is_guest := (v_user_id IS NULL AND p_guest_id IS NOT NULL);
  
  IF NOT v_is_guest AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated or provide guest ID';
  END IF;
  
  -- Check if user/guest is the host
  IF v_is_guest THEN
    SELECT is_host INTO v_is_host
    FROM public.room_players
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
  ELSE
    SELECT is_host INTO v_is_host
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id;
  END IF;
  
  IF v_is_host IS NULL THEN
    RAISE EXCEPTION 'You are not in this room';
  END IF;
  
  IF NOT v_is_host THEN
    RAISE EXCEPTION 'Only the host can start the game';
  END IF;
  
  -- Check player count (at least 2 players)
  SELECT COUNT(*) INTO v_player_count
  FROM public.room_players
  WHERE room_id = p_room_id;
  
  IF v_player_count < 2 THEN
    RAISE EXCEPTION 'At least 2 players required to start the game';
  END IF;
  
  -- Check if all players are ready
  SELECT bool_and(is_ready OR is_host) INTO v_all_ready
  FROM public.room_players
  WHERE room_id = p_room_id;
  
  IF NOT v_all_ready THEN
    RAISE EXCEPTION 'All players must be ready before starting';
  END IF;
  
  -- Update room status to playing
  UPDATE public.game_rooms
  SET status = 'playing', updated_at = NOW()
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'roomId', p_room_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION leave_game_room_guest(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_ready_status_guest(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION start_game_guest(UUID, TEXT) TO anon, authenticated;
