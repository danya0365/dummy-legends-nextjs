-- =====================================================
-- HELPER: ตรวจสอบว่าไพ่ที่ทิ้งสามารถนำไปเกิดได้ทันทีหรือไม่
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_discard_can_meld(
  p_session_id UUID,
  p_discarded_card_id UUID,
  p_next_gamer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_meld BOOLEAN := false;
  v_discarded_rank public.card_rank;
  v_discarded_suit public.card_suit;
  v_discarded_order INTEGER;
  v_same_rank_count INTEGER;
  v_has_lower1 BOOLEAN := false;
  v_has_lower2 BOOLEAN := false;
  v_has_upper1 BOOLEAN := false;
  v_has_upper2 BOOLEAN := false;
BEGIN
  -- ดึงข้อมูลไพ่ที่ทิ้ง
  SELECT rank, suit
  INTO v_discarded_rank, v_discarded_suit
  FROM public.game_cards
  WHERE id = p_discarded_card_id
    AND session_id = p_session_id;

  IF v_discarded_rank IS NULL THEN
    RETURN false;
  END IF;

  -- ตรวจสอบว่าผู้เล่นถัดไปมีไพ่ในมือที่สามารถเกิดกับไพ่ที่ทิ้งได้หรือไม่
  -- กรณี 1: ตอง (same rank) - ต้องมีอย่างน้อย 2 ใบที่ rank เดียวกัน
  SELECT COUNT(*)
  INTO v_same_rank_count
  FROM public.game_cards
  WHERE session_id = p_session_id
    AND owner_gamer_id = p_next_gamer_id
    AND location = 'hand'
    AND rank = v_discarded_rank;

  IF v_same_rank_count >= 2 THEN
    RETURN true;
  END IF;

  v_discarded_order := public.get_card_rank_order(v_discarded_rank);

  SELECT
    COALESCE(bool_or(rank_order = v_discarded_order - 1), false) AS has_lower1,
    COALESCE(bool_or(rank_order = v_discarded_order - 2), false) AS has_lower2,
    COALESCE(bool_or(rank_order = v_discarded_order + 1), false) AS has_upper1,
    COALESCE(bool_or(rank_order = v_discarded_order + 2), false) AS has_upper2
  INTO
    v_has_lower1,
    v_has_lower2,
    v_has_upper1,
    v_has_upper2
  FROM (
    SELECT public.get_card_rank_order(gc.rank) AS rank_order
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.owner_gamer_id = p_next_gamer_id
      AND gc.location = 'hand'
      AND gc.suit = v_discarded_suit
  ) hand_orders;

  IF (v_has_lower1 AND v_has_lower2)
    OR (v_has_lower1 AND v_has_upper1)
    OR (v_has_upper1 AND v_has_upper2) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- HELPER: บันทึกโทษการทิ้งไพ่ (ทิ้งมี่/ทิ้งปี้หัว/ทิ้งเต็ม)
-- =====================================================

CREATE OR REPLACE FUNCTION public.record_discard_penalty_if_needed(
  p_session_id UUID,
  p_discarder_gamer_id UUID,
  p_discarded_card_id UUID,
  p_next_gamer_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_can_meld BOOLEAN;
  v_is_head BOOLEAN;
  v_penalty_type public.score_event_type;
  v_penalty_points INTEGER := -50;
BEGIN
  -- ตรวจสอบว่าไพ่ที่ทิ้งสามารถนำไปเกิดได้ทันทีหรือไม่
  v_can_meld := public.check_discard_can_meld(
    p_session_id,
    p_discarded_card_id,
    p_next_gamer_id
  );

  IF NOT v_can_meld THEN
    RETURN;
  END IF;

  -- ตรวจสอบว่าไพ่ที่ทิ้งเป็นหัวหรือไม่
  SELECT is_head
  INTO v_is_head
  FROM public.game_cards
  WHERE id = p_discarded_card_id
    AND session_id = p_session_id;

  -- กำหนดประเภทโทษ
  IF COALESCE(v_is_head, false) THEN
    v_penalty_type := 'head_penalty'; -- ทิ้งปี้หัว
  ELSE
    -- ตรวจสอบเพิ่มเติมว่าเป็นทิ้งเต็มหรือทิ้งมี่
    -- ถ้าไพ่ที่ทิ้งทำให้เกิดชุดเต็ม (3 ใบพอดี) = ทิ้งเต็ม
    -- ถ้าไพ่ที่ทิ้งทำให้เกิดชุดที่มากกว่า 3 ใบ = ทิ้งมี่
    -- ในที่นี้เราจะใช้ penalty เดียวกันคือ dummy_penalty
    v_penalty_type := 'dummy_penalty'; -- ทิ้งมี่/ทิ้งเต็ม
  END IF;

  -- บันทึกโทษ
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
    p_discarder_gamer_id,
    v_penalty_type,
    v_penalty_points,
    NULL,
    ARRAY[p_discarded_card_id],
    jsonb_build_object(
      'next_gamer_id', p_next_gamer_id,
      'can_meld', v_can_meld,
      'is_head', COALESCE(v_is_head, false)
    )
  );
END;
$$ LANGUAGE plpgsql;
