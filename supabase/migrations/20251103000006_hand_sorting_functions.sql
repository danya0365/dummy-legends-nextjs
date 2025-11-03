-- =====================================================
-- Dummy Legends - Hand Sorting RPC Functions
-- Created: 2025-11-03
-- =====================================================

-- Sort player hand by card value (number)
CREATE OR REPLACE FUNCTION public.sort_hand_by_rank(
  p_session_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  -- Ensure caller has access to the gamer record
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH ordered_cards AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY
          array_position(
            ARRAY['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
            rank::text
          ),
          suit,
          card_value,
          id
      ) - 1 AS new_position
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND owner_gamer_id = p_gamer_id
      AND location = 'hand'
  )
  UPDATE public.game_cards gc
  SET position_in_location = ordered_cards.new_position,
      updated_at = NOW()
  FROM ordered_cards
  WHERE gc.id = ordered_cards.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sort player hand by suit first, then card value
CREATE OR REPLACE FUNCTION public.sort_hand_by_suit(
  p_session_id UUID,
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  -- Ensure caller has access to the gamer record
  v_can_access := public.can_access_gamer(p_gamer_id, p_guest_identifier);
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH ordered_cards AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY
               CASE suit
                 WHEN 'hearts' THEN 1
                 WHEN 'diamonds' THEN 2
                 WHEN 'clubs' THEN 3
                 WHEN 'spades' THEN 4
                 ELSE 5
               END,
               card_value,
               rank,
               id
           ) - 1 AS new_position
    FROM public.game_cards
    WHERE session_id = p_session_id
      AND owner_gamer_id = p_gamer_id
      AND location = 'hand'
  )
  UPDATE public.game_cards gc
  SET position_in_location = ordered_cards.new_position,
      updated_at = NOW()
  FROM ordered_cards
  WHERE gc.id = ordered_cards.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
