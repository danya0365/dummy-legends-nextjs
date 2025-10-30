-- Dummy Legends Game RPC Functions
-- Created: 2025-08-30
-- Description: RPC functions for game operations

-- Generate unique 6-digit room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.game_rooms WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new game room
CREATE OR REPLACE FUNCTION create_game_room(
  p_name TEXT,
  p_mode public.game_mode,
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
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Get user's profile ID
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_id = v_user_id LIMIT 1;
  
  -- Generate unique room code
  v_room_code := generate_room_code();
  
  -- Create room
  INSERT INTO public.game_rooms (
    code, name, host_id, mode, settings, max_player_count
  ) VALUES (
    v_room_code,
    p_name,
    v_user_id,
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
    room_id, user_id, profile_id, is_host, is_ready, position
  ) VALUES (
    v_room_id, v_user_id, v_profile_id, TRUE, FALSE, 0
  );
  
  -- Return room details
  SELECT json_build_object(
    'id', r.id,
    'code', r.code,
    'name', r.name,
    'hostId', r.host_id,
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

-- Join a game room
CREATE OR REPLACE FUNCTION join_game_room(
  p_room_id UUID DEFAULT NULL,
  p_room_code TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_room_id UUID;
  v_user_id UUID;
  v_profile_id UUID;
  v_room RECORD;
  v_player_count INTEGER;
  v_position INTEGER;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Get user's profile ID
  SELECT id INTO v_profile_id FROM public.profiles WHERE auth_id = v_user_id LIMIT 1;
  
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
  
  -- Check if user already in room
  IF EXISTS(SELECT 1 FROM public.room_players WHERE room_id = v_room_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already in this room';
  END IF;
  
  -- Find next available position
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_position
  FROM public.room_players
  WHERE room_id = v_room_id;
  
  -- Add player to room
  INSERT INTO public.room_players (
    room_id, user_id, profile_id, is_host, is_ready, position
  ) VALUES (
    v_room_id, v_user_id, v_profile_id, FALSE, FALSE, v_position
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

-- Leave a game room
CREATE OR REPLACE FUNCTION leave_game_room(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_host BOOLEAN;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user is host
  SELECT is_host INTO v_is_host
  FROM public.room_players
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  -- Remove player from room
  DELETE FROM public.room_players
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  -- If host left and room has other players, assign new host
  IF v_is_host THEN
    UPDATE public.room_players
    SET is_host = TRUE
    WHERE room_id = p_room_id
    AND id = (
      SELECT id FROM public.room_players
      WHERE room_id = p_room_id
      ORDER BY joined_at
      LIMIT 1
    );
    
    -- Update room host_id
    UPDATE public.game_rooms
    SET host_id = (
      SELECT user_id FROM public.room_players
      WHERE room_id = p_room_id AND is_host = TRUE
      LIMIT 1
    )
    WHERE id = p_room_id;
  END IF;
  
  -- Delete room if no players left
  DELETE FROM public.game_rooms
  WHERE id = p_room_id
  AND NOT EXISTS(SELECT 1 FROM public.room_players WHERE room_id = p_room_id);
  
  SELECT json_build_object('success', TRUE) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle player ready status
CREATE OR REPLACE FUNCTION toggle_ready_status(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_new_status BOOLEAN;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Toggle ready status
  UPDATE public.room_players
  SET is_ready = NOT is_ready
  WHERE room_id = p_room_id AND user_id = v_user_id
  RETURNING is_ready INTO v_new_status;
  
  SELECT json_build_object(
    'success', TRUE,
    'isReady', v_new_status
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start game (host only)
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_is_host BOOLEAN;
  v_all_ready BOOLEAN;
  v_player_count INTEGER;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user is host
  SELECT is_host INTO v_is_host
  FROM public.room_players
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  IF NOT v_is_host THEN
    RAISE EXCEPTION 'Only host can start the game';
  END IF;
  
  -- Check player count
  SELECT current_player_count INTO v_player_count
  FROM public.game_rooms
  WHERE id = p_room_id;
  
  IF v_player_count < 2 THEN
    RAISE EXCEPTION 'At least 2 players required';
  END IF;
  
  -- Check if all non-host players are ready
  SELECT NOT EXISTS(
    SELECT 1 FROM public.room_players
    WHERE room_id = p_room_id AND is_host = FALSE AND is_ready = FALSE
  ) INTO v_all_ready;
  
  IF NOT v_all_ready THEN
    RAISE EXCEPTION 'All players must be ready';
  END IF;
  
  -- Update room status
  UPDATE public.game_rooms
  SET status = 'playing', started_at = NOW()
  WHERE id = p_room_id;
  
  -- Update all players status
  UPDATE public.room_players
  SET status = 'playing'
  WHERE room_id = p_room_id;
  
  -- Initialize game state (will be populated by game logic)
  INSERT INTO public.game_states (room_id)
  VALUES (p_room_id)
  ON CONFLICT (room_id) DO NOTHING;
  
  SELECT json_build_object('success', TRUE) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available rooms
CREATE OR REPLACE FUNCTION get_available_rooms(
  p_mode public.game_mode DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'code', r.code,
      'name', r.name,
      'hostId', r.host_id,
      'status', r.status,
      'mode', r.mode,
      'settings', r.settings,
      'currentPlayerCount', r.current_player_count,
      'maxPlayerCount', r.max_player_count,
      'createdAt', r.created_at,
      'players', (
        SELECT json_agg(
          json_build_object(
            'id', rp.id,
            'userId', rp.user_id,
            'username', COALESCE(p.username, 'Guest'),
            'displayName', COALESCE(p.full_name, 'Guest'),
            'avatar', p.avatar_url,
            'level', COALESCE(ps.level, 1),
            'elo', COALESCE(ps.elo, 1000),
            'status', rp.status,
            'isHost', rp.is_host,
            'isReady', rp.is_ready,
            'position', rp.position,
            'joinedAt', rp.joined_at
          ) ORDER BY rp.position
        )
        FROM public.room_players rp
        LEFT JOIN public.profiles p ON rp.profile_id = p.id
        LEFT JOIN public.player_stats ps ON rp.user_id = ps.user_id
        WHERE rp.room_id = r.id
      )
    ) ORDER BY r.created_at DESC
  )
  INTO v_result
  FROM public.game_rooms r
  WHERE r.status = 'waiting'
    AND (p_mode IS NULL OR r.mode = p_mode)
    AND (r.settings->>'isPrivate')::BOOLEAN = FALSE
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get room details with players
CREATE OR REPLACE FUNCTION get_room_details(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', r.id,
    'code', r.code,
    'name', r.name,
    'hostId', r.host_id,
    'status', r.status,
    'mode', r.mode,
    'settings', r.settings,
    'currentPlayerCount', r.current_player_count,
    'maxPlayerCount', r.max_player_count,
    'createdAt', r.created_at,
    'startedAt', r.started_at,
    'players', (
      SELECT json_agg(
        json_build_object(
          'id', rp.id,
          'userId', rp.user_id,
          'username', COALESCE(p.username, 'Guest'),
          'displayName', COALESCE(p.full_name, 'Guest'),
          'avatar', p.avatar_url,
          'level', COALESCE(ps.level, 1),
          'elo', COALESCE(ps.elo, 1000),
          'status', rp.status,
          'isHost', rp.is_host,
          'isReady', rp.is_ready,
          'position', rp.position,
          'joinedAt', rp.joined_at
        ) ORDER BY rp.position
      )
      FROM public.room_players rp
      LEFT JOIN public.profiles p ON rp.profile_id = p.id
      LEFT JOIN public.player_stats ps ON rp.user_id = ps.user_id
      WHERE rp.room_id = r.id
    )
  )
  INTO v_result
  FROM public.game_rooms r
  WHERE r.id = p_room_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_room_code() TO authenticated;
GRANT EXECUTE ON FUNCTION create_game_room(TEXT, public.game_mode, INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION join_game_room(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_game_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_ready_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_rooms(public.game_mode, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_room_details(UUID) TO authenticated, anon;
