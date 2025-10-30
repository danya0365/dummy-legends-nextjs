-- Guest RPC Functions
-- Created: 2025-08-30
-- Description: RPC functions with guest support

-- Create game room (guest support)
CREATE OR REPLACE FUNCTION create_game_room_guest(
  p_name TEXT,
  p_mode public.game_mode,
  p_guest_id TEXT DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_max_players INTEGER DEFAULT 4,
  p_bet_amount INTEGER DEFAULT 100,
  p_time_limit INTEGER DEFAULT 60,
  p_is_private BOOLEAN DEFAULT FALSE,
  p_password TEXT DEFAULT NULL,
  p_allow_spectators BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_user_id UUID;
  v_profile_id UUID;
  v_is_guest BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if guest or authenticated
  v_user_id := auth.uid();
  v_is_guest := (v_user_id IS NULL AND p_guest_id IS NOT NULL);
  
  IF NOT v_is_guest AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated or provide guest ID';
  END IF;
  
  -- Get profile ID for authenticated users
  IF NOT v_is_guest THEN
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_id = v_user_id LIMIT 1;
  END IF;
  
  -- Generate unique room code
  v_room_code := generate_room_code();
  
  -- Create room
  INSERT INTO public.game_rooms (
    code, name, host_id, host_guest_id, mode, settings, max_player_count
  ) VALUES (
    v_room_code,
    p_name,
    CASE WHEN v_is_guest THEN NULL ELSE v_user_id END,
    CASE WHEN v_is_guest THEN p_guest_id ELSE NULL END,
    p_mode,
    jsonb_build_object(
      'maxPlayers', p_max_players,
      'betAmount', p_bet_amount,
      'timeLimit', p_time_limit,
      'isPrivate', p_is_private,
      'password', p_password,
      'allowSpectators', p_allow_spectators
    ),
    p_max_players
  )
  RETURNING id INTO v_room_id;
  
  -- Add host as first player
  INSERT INTO public.room_players (
    room_id, user_id, guest_id, guest_name, profile_id, is_host, is_ready, position
  ) VALUES (
    v_room_id,
    CASE WHEN v_is_guest THEN NULL ELSE v_user_id END,
    CASE WHEN v_is_guest THEN p_guest_id ELSE NULL END,
    CASE WHEN v_is_guest THEN p_guest_name ELSE NULL END,
    v_profile_id,
    TRUE,
    FALSE,
    0
  );
  
  -- Return room details
  SELECT json_build_object(
    'id', r.id,
    'code', r.code,
    'name', r.name,
    'hostId', COALESCE(r.host_id::text, r.host_guest_id),
    'status', r.status,
    'mode', r.mode,
    'settings', r.settings,
    'currentPlayerCount', r.current_player_count,
    'maxPlayerCount', r.max_player_count,
    'createdAt', r.created_at
  )
  INTO v_result
  FROM public.game_rooms r
  WHERE r.id = v_room_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join game room (guest support)
CREATE OR REPLACE FUNCTION join_game_room_guest(
  p_room_id UUID DEFAULT NULL,
  p_room_code TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_guest_id TEXT DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_room_id UUID;
  v_user_id UUID;
  v_profile_id UUID;
  v_room RECORD;
  v_position INTEGER;
  v_is_guest BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if guest or authenticated
  v_user_id := auth.uid();
  v_is_guest := (v_user_id IS NULL AND p_guest_id IS NOT NULL);
  
  IF NOT v_is_guest AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated or provide guest ID';
  END IF;
  
  -- Get profile ID for authenticated users
  IF NOT v_is_guest THEN
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_id = v_user_id LIMIT 1;
  END IF;
  
  -- Find room by ID or code
  IF p_room_id IS NOT NULL THEN
    v_room_id := p_room_id;
  ELSIF p_room_code IS NOT NULL THEN
    SELECT id INTO v_room_id FROM public.game_rooms WHERE code = p_room_code;
  ELSE
    RAISE EXCEPTION 'Room ID or code must be provided';
  END IF;
  
  -- Get room details
  SELECT * INTO v_room FROM public.game_rooms WHERE id = v_room_id;
  
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Check if room is full
  IF v_room.current_player_count >= v_room.max_player_count THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Check if room has started
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Game has already started';
  END IF;
  
  -- Check password if private
  IF (v_room.settings->>'isPrivate')::BOOLEAN = TRUE THEN
    IF p_password IS NULL OR p_password != v_room.settings->>'password' THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;
  
  -- Check if already in room
  IF v_is_guest THEN
    IF EXISTS(SELECT 1 FROM public.room_players WHERE room_id = v_room_id AND guest_id = p_guest_id) THEN
      RAISE EXCEPTION 'You are already in this room';
    END IF;
  ELSE
    IF EXISTS(SELECT 1 FROM public.room_players WHERE room_id = v_room_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'You are already in this room';
    END IF;
  END IF;
  
  -- Find next available position
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_position
  FROM public.room_players
  WHERE room_id = v_room_id;
  
  -- Add player to room
  INSERT INTO public.room_players (
    room_id, user_id, guest_id, guest_name, profile_id, is_host, is_ready, position
  ) VALUES (
    v_room_id,
    CASE WHEN v_is_guest THEN NULL ELSE v_user_id END,
    CASE WHEN v_is_guest THEN p_guest_id ELSE NULL END,
    CASE WHEN v_is_guest THEN p_guest_name ELSE NULL END,
    v_profile_id,
    FALSE,
    FALSE,
    v_position
  );
  
  -- Return success
  SELECT json_build_object(
    'success', TRUE,
    'roomId', v_room_id,
    'position', v_position
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_game_room_guest(TEXT, public.game_mode, TEXT, TEXT, INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_game_room_guest(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
