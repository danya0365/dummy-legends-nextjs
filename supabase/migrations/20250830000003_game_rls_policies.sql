-- Dummy Legends Game RLS Policies
-- Created: 2025-08-30
-- Description: Row Level Security policies for game tables

-- Enable RLS on all game tables
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GAME ROOMS POLICIES
-- ============================================================================

-- Anyone can view non-private rooms
CREATE POLICY "Anyone can view public rooms"
ON public.game_rooms FOR SELECT
TO anon, authenticated
USING (
  (settings->>'isPrivate')::BOOLEAN = FALSE
  OR auth.uid() IN (
    SELECT user_id FROM public.room_players WHERE room_id = game_rooms.id
  )
);

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
ON public.game_rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

-- Host can update their room
CREATE POLICY "Host can update their room"
ON public.game_rooms FOR UPDATE
TO authenticated
USING (auth.uid() = host_id);

-- Host can delete their room (or auto-deleted when empty)
CREATE POLICY "Host can delete their room"
ON public.game_rooms FOR DELETE
TO authenticated
USING (auth.uid() = host_id);

-- ============================================================================
-- ROOM PLAYERS POLICIES
-- ============================================================================

-- Users can view players in rooms they can see
CREATE POLICY "Users can view room players"
ON public.room_players FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE id = room_players.room_id
    AND (
      (settings->>'isPrivate')::BOOLEAN = FALSE
      OR auth.uid() IN (
        SELECT user_id FROM public.room_players WHERE room_id = game_rooms.id
      )
    )
  )
);

-- Users can join rooms (handled by RPC function)
CREATE POLICY "Users can join rooms"
ON public.room_players FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own player status
CREATE POLICY "Users can update their own status"
ON public.room_players FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can leave rooms
CREATE POLICY "Users can leave rooms"
ON public.room_players FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- GAME STATES POLICIES
-- ============================================================================

-- Players in the room can view game state
CREATE POLICY "Players can view their game state"
ON public.game_states FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.room_players WHERE room_id = game_states.room_id
  )
);

-- System can create game state (via RPC)
CREATE POLICY "System can create game state"
ON public.game_states FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.room_players WHERE room_id = game_states.room_id
  )
);

-- Players can update game state
CREATE POLICY "Players can update game state"
ON public.game_states FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.room_players WHERE room_id = game_states.room_id
  )
);

-- ============================================================================
-- GAME ACTIONS POLICIES
-- ============================================================================

-- Players can view game actions in their room
CREATE POLICY "Players can view game actions"
ON public.game_actions FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.room_players WHERE room_id = game_actions.room_id
  )
);

-- Players can log their own actions
CREATE POLICY "Players can log their actions"
ON public.game_actions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PLAYER STATS POLICIES
-- ============================================================================

-- Anyone can view player stats
CREATE POLICY "Anyone can view player stats"
ON public.player_stats FOR SELECT
TO anon, authenticated
USING (true);

-- Users can update their own stats (usually via triggers/functions)
CREATE POLICY "Users can update own stats"
ON public.player_stats FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- System can create player stats
CREATE POLICY "System can create player stats"
ON public.player_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Comment on policies
COMMENT ON POLICY "Anyone can view public rooms" ON public.game_rooms IS 'Allow viewing of non-private game rooms';
COMMENT ON POLICY "Authenticated users can create rooms" ON public.game_rooms IS 'Allow authenticated users to create game rooms';
COMMENT ON POLICY "Host can update their room" ON public.game_rooms IS 'Allow room host to update room settings';
