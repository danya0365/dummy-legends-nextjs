-- =====================================================
-- Dummy Legends - Part 4: RPC Functions for Game Logic
-- Created: 2025-10-30
-- =====================================================

-- =====================================================
-- GAMER MANAGEMENT
-- =====================================================

-- Create or get gamer (for guests and authenticated users)
CREATE OR REPLACE FUNCTION public.create_or_get_gamer(
  p_guest_identifier TEXT DEFAULT NULL,
  p_guest_display_name TEXT DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  gamer_id UUID,
  is_new BOOLEAN
) AS $$
DECLARE
  v_gamer_id UUID;
  v_is_new BOOLEAN := false;
BEGIN
  -- If profile_id provided, check for existing gamer with this profile
  IF p_profile_id IS NOT NULL THEN
    SELECT id INTO v_gamer_id
    FROM public.gamers
    WHERE profile_id = p_profile_id;
    
    IF v_gamer_id IS NULL THEN
      -- Create new gamer for authenticated user
      INSERT INTO public.gamers (profile_id)
      VALUES (p_profile_id)
      RETURNING id INTO v_gamer_id;
      v_is_new := true;
    END IF;
  
  -- If guest_identifier provided, check for existing guest
  ELSIF p_guest_identifier IS NOT NULL THEN
    SELECT id INTO v_gamer_id
    FROM public.gamers
    WHERE guest_identifier = p_guest_identifier;
    
    IF v_gamer_id IS NULL THEN
      -- Create new guest gamer
      INSERT INTO public.gamers (guest_identifier, guest_display_name)
      VALUES (p_guest_identifier, COALESCE(p_guest_display_name, 'Guest'))
      RETURNING id INTO v_gamer_id;
      v_is_new := true;
    END IF;
  ELSE
    RAISE EXCEPTION 'Either profile_id or guest_identifier must be provided';
  END IF;
  
  -- Update last_active_at
  UPDATE public.gamers
  SET last_active_at = NOW()
  WHERE id = v_gamer_id;
  
  RETURN QUERY SELECT v_gamer_id, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update gamer preferences (fixed: all params after default must have defaults)
CREATE OR REPLACE FUNCTION public.update_gamer_preferences(
  p_gamer_id UUID,
  p_preferences JSONB,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  -- Check access permission
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized to update this gamer';
  END IF;
  
  UPDATE public.gamers
  SET preferences = preferences || p_preferences,
      updated_at = NOW()
  WHERE id = p_gamer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link guest account to profile
CREATE OR REPLACE FUNCTION public.link_guest_to_profile(
  p_guest_identifier TEXT,
  p_profile_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_gamer_id UUID;
  v_existing_profile_gamer UUID;
BEGIN
  -- Check if profile already has a gamer
  SELECT id INTO v_existing_profile_gamer
  FROM public.gamers
  WHERE profile_id = p_profile_id;
  
  IF v_existing_profile_gamer IS NOT NULL THEN
    RAISE EXCEPTION 'Profile already has a gamer account';
  END IF;
  
  -- Get guest gamer
  SELECT id INTO v_gamer_id
  FROM public.gamers
  WHERE guest_identifier = p_guest_identifier;
  
  IF v_gamer_id IS NULL THEN
    RAISE EXCEPTION 'Guest gamer not found';
  END IF;
  
  -- Link guest to profile
  UPDATE public.gamers
  SET profile_id = p_profile_id,
      guest_identifier = NULL,
      guest_display_name = NULL,
      updated_at = NOW()
  WHERE id = v_gamer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROOM MANAGEMENT
-- =====================================================

-- Create game room
CREATE OR REPLACE FUNCTION public.create_game_room(
  p_gamer_id UUID,
  p_room_name TEXT,
  p_guest_identifier TEXT DEFAULT NULL,
  p_mode public.game_mode DEFAULT 'casual',
  p_max_players INTEGER DEFAULT 4,
  p_bet_amount INTEGER DEFAULT 0,
  p_time_limit_seconds INTEGER DEFAULT 60,
  p_is_private BOOLEAN DEFAULT false,
  p_room_password TEXT DEFAULT NULL
)
RETURNS TABLE (
  room_id UUID,
  room_code TEXT
) AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_can_access BOOLEAN;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Generate room code
  v_room_code := public.generate_room_code();
  
  -- Create room
  INSERT INTO public.game_rooms (
    room_code, room_name, host_gamer_id, mode, max_players,
    bet_amount, time_limit_seconds, is_private, room_password
  ) VALUES (
    v_room_code, p_room_name, p_gamer_id, p_mode, p_max_players,
    p_bet_amount, p_time_limit_seconds, p_is_private, p_room_password
  ) RETURNING id INTO v_room_id;
  
  -- Add host as player
  INSERT INTO public.room_players (room_id, gamer_id, is_host, position)
  VALUES (v_room_id, p_gamer_id, true, 0);
  
  RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join game room
CREATE OR REPLACE FUNCTION public.join_game_room(
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL,
  p_room_code TEXT DEFAULT NULL,
  p_room_id UUID DEFAULT NULL,
  p_room_password TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_room_status public.room_status;
  v_current_count INTEGER;
  v_max_count INTEGER;
  v_is_private BOOLEAN;
  v_room_password TEXT;
  v_next_position INTEGER;
  v_can_access BOOLEAN;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Find room
  IF p_room_code IS NOT NULL THEN
    SELECT id, status, current_player_count, max_players, is_private, room_password
    INTO v_room_id, v_room_status, v_current_count, v_max_count, v_is_private, v_room_password
    FROM public.game_rooms
    WHERE room_code = p_room_code;
  ELSIF p_room_id IS NOT NULL THEN
    SELECT id, status, current_player_count, max_players, is_private, room_password
    INTO v_room_id, v_room_status, v_current_count, v_max_count, v_is_private, v_room_password
    FROM public.game_rooms
    WHERE id = p_room_id;
  ELSE
    RAISE EXCEPTION 'Either room_code or room_id must be provided';
  END IF;
  
  -- Validate room
  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check if already in room
  IF EXISTS (SELECT 1 FROM public.room_players WHERE room_id = v_room_id AND gamer_id = p_gamer_id) THEN
    RETURN v_room_id;
  END IF;
  
  IF v_room_status NOT IN ('waiting', 'ready') THEN
    RAISE EXCEPTION 'Room is not accepting players';
  END IF;
  
  IF v_current_count >= v_max_count THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  IF v_is_private AND v_room_password != p_room_password THEN
    RAISE EXCEPTION 'Invalid password';
  END IF;
  
  -- Find next position
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_position
  FROM public.room_players
  WHERE room_id = v_room_id;
  
  -- Add player
  INSERT INTO public.room_players (room_id, gamer_id, position)
  VALUES (v_room_id, p_gamer_id, v_next_position);
  
  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave game room
CREATE OR REPLACE FUNCTION public.leave_game_room(
  p_gamer_id UUID,
  p_room_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_host BOOLEAN;
  v_can_access BOOLEAN;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if host
  SELECT is_host INTO v_is_host
  FROM public.room_players
  WHERE room_id = p_room_id AND gamer_id = p_gamer_id;
  
  -- Remove player
  DELETE FROM public.room_players
  WHERE room_id = p_room_id AND gamer_id = p_gamer_id;
  
  -- If host left, cancel room or transfer host
  IF v_is_host THEN
    -- Check if other players exist
    IF EXISTS (SELECT 1 FROM public.room_players WHERE room_id = p_room_id) THEN
      -- Transfer host to next player
      UPDATE public.room_players
      SET is_host = true
      WHERE id = (
        SELECT id FROM public.room_players
        WHERE room_id = p_room_id
        ORDER BY position LIMIT 1
      );
      
      -- Update room host
      UPDATE public.game_rooms
      SET host_gamer_id = (
        SELECT gamer_id FROM public.room_players
        WHERE room_id = p_room_id AND is_host = true
      )
      WHERE id = p_room_id;
    ELSE
      -- No players left, cancel room
      UPDATE public.game_rooms
      SET status = 'cancelled'
      WHERE id = p_room_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle ready status
CREATE OR REPLACE FUNCTION public.toggle_ready_status(
  p_gamer_id UUID,
  p_room_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_status BOOLEAN;
  v_can_access BOOLEAN;
BEGIN
  -- Check access
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Toggle ready
  UPDATE public.room_players
  SET is_ready = NOT is_ready
  WHERE room_id = p_room_id AND gamer_id = p_gamer_id
  RETURNING is_ready INTO v_new_status;
  
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available rooms
CREATE OR REPLACE FUNCTION public.get_available_rooms(
  p_mode public.game_mode DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  room_code TEXT,
  room_name TEXT,
  host_gamer_id UUID,
  status public.room_status,
  mode public.game_mode,
  current_player_count INTEGER,
  max_players INTEGER,
  bet_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.room_code, r.room_name, r.host_gamer_id, r.status, r.mode,
    r.current_player_count, r.max_players, r.bet_amount, r.created_at
  FROM public.game_rooms r
  WHERE r.status IN ('waiting', 'ready')
    AND NOT r.is_private
    AND (p_mode IS NULL OR r.mode = p_mode)
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get room details with players
CREATE OR REPLACE FUNCTION public.get_room_details(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'room', row_to_json(r),
    'players', (
      SELECT json_agg(
        json_build_object(
          'id', rp.id,
          'gamer_id', rp.gamer_id,
          'gamer', row_to_json(g),
          'status', rp.status,
          'is_host', rp.is_host,
          'is_ready', rp.is_ready,
          'position', rp.position,
          'current_score', rp.current_score
        )
      )
      FROM public.room_players rp
      JOIN public.gamers g ON g.id = rp.gamer_id
      WHERE rp.room_id = r.id
    )
  )
  INTO v_result
  FROM public.game_rooms r
  WHERE r.id = p_room_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME PUBLICATION
-- =====================================================

-- Enable realtime for game tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_hands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;
