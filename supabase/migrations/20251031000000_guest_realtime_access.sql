-- =====================================================
-- Dummy Legends - Guest Realtime Access Policies
-- Created: 2025-10-31
-- Description: Allow unauthenticated guests (anon role) who are
-- part of a room/session to receive realtime updates by extending
-- RLS policies for game_sessions and game_cards.
-- =====================================================

-- Helper function: check if the current session relates to any guest players
CREATE OR REPLACE FUNCTION public.is_guest_participant_in_session(
  p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_sessions gs
    JOIN public.room_players rp
      ON rp.room_id = gs.room_id
    JOIN public.gamers g
      ON g.id = rp.gamer_id
    WHERE gs.id = p_session_id
      AND g.guest_identifier IS NOT NULL
  );
$$;

-- Helper function: check if a room has any guest participants
CREATE OR REPLACE FUNCTION public.is_guest_participant_in_room(
  p_room_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_players rp
    JOIN public.gamers g
      ON g.id = rp.gamer_id
    WHERE rp.room_id = p_room_id
      AND g.guest_identifier IS NOT NULL
  );
$$;

-- =====================================================
-- RLS Policies for guests (anon role)
-- =====================================================

-- Allow anon role to select game sessions that contain guest participants
CREATE POLICY "sessions_select_guest_participants"
  ON public.game_sessions FOR SELECT
  USING (
    auth.role() = 'anon'
    AND public.is_guest_participant_in_room(room_id)
  );

-- Allow anon role to select game cards for sessions that contain guest participants
CREATE POLICY "cards_select_guest_participants"
  ON public.game_cards FOR SELECT
  USING (
    auth.role() = 'anon'
    AND public.is_guest_participant_in_session(session_id)
  );
