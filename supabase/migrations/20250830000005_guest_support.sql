-- Guest Support for Dummy Legends
-- Created: 2025-08-30
-- Description: Add guest player support

-- Add guest columns to game_rooms
ALTER TABLE public.game_rooms
ADD COLUMN IF NOT EXISTS host_guest_id TEXT;

-- Add guest columns to room_players
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS guest_id TEXT,
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Make user_id nullable for guests
ALTER TABLE public.room_players
ALTER COLUMN user_id DROP NOT NULL;

-- Add check constraint: must have either user_id or guest_id
ALTER TABLE public.room_players
ADD CONSTRAINT user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Update room_players unique constraint to include guest_id
ALTER TABLE public.room_players
DROP CONSTRAINT IF EXISTS room_players_room_id_user_id_key;

-- Add composite unique for both auth and guest
CREATE UNIQUE INDEX IF NOT EXISTS room_players_room_user_unique 
ON public.room_players(room_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS room_players_room_guest_unique 
ON public.room_players(room_id, guest_id) 
WHERE guest_id IS NOT NULL;

-- Update game_states to support guest
ALTER TABLE public.game_states
ALTER COLUMN current_turn_user_id DROP NOT NULL;

ALTER TABLE public.game_states
ADD COLUMN IF NOT EXISTS current_turn_guest_id TEXT;

-- Add check: must have either user_id or guest_id for current turn
ALTER TABLE public.game_states
ADD CONSTRAINT current_turn_check 
CHECK (
  (current_turn_user_id IS NOT NULL AND current_turn_guest_id IS NULL) OR
  (current_turn_user_id IS NULL AND current_turn_guest_id IS NOT NULL)
);

-- Update game_actions to support guest
ALTER TABLE public.game_actions
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.game_actions
ADD COLUMN IF NOT EXISTS guest_id TEXT,
ADD COLUMN IF NOT EXISTS guest_name TEXT;

ALTER TABLE public.game_actions
ADD CONSTRAINT action_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Update player_stats to support guest
ALTER TABLE public.player_stats
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.player_stats
ADD COLUMN IF NOT EXISTS guest_id TEXT UNIQUE;

ALTER TABLE public.player_stats
ADD CONSTRAINT stats_user_or_guest_check 
CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR
  (user_id IS NULL AND guest_id IS NOT NULL)
);

-- Create index for guest lookups
CREATE INDEX IF NOT EXISTS idx_room_players_guest_id ON public.room_players(guest_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_guest_id ON public.game_actions(guest_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_guest_id ON public.player_stats(guest_id);

-- Comment on changes
COMMENT ON COLUMN public.room_players.guest_id IS 'Guest player ID for unauthenticated players';
COMMENT ON COLUMN public.room_players.guest_name IS 'Guest display name';
COMMENT ON COLUMN public.game_rooms.host_guest_id IS 'Guest ID if host is a guest player';
