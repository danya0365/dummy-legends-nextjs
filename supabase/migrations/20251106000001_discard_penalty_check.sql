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
  v_hand_cards RECORD;
  v_same_rank_count INTEGER;
  v_same_suit_sequential INTEGER;
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
    v_can_meld := true;
    RETURN v_can_meld;
  END IF;

  -- กรณี 2: เรียง (run) - ต้องมีไพ่ suit เดียวกันที่ต่อกันได้อย่างน้อย 2 ใบ
  -- ตรวจว่ามีไพ่ที่สามารถต่อเป็นเรียงกับไพ่ที่ทิ้งได้หรือไม่
  WITH hand_same_suit AS (
    SELECT 
      gc.rank,
      public.get_card_rank_order(gc.rank) AS rank_order
    FROM public.game_cards gc
    WHERE gc.session_id = p_session_id
      AND gc.owner_gamer_id = p_next_gamer_id
      AND gc.location = 'hand'
      AND gc.suit = v_discarded_suit
  ),
  discarded_order AS (
    SELECT public.get_card_rank_order(v_discarded_rank) AS rank_order
  ),
  combined AS (
    SELECT rank_order FROM hand_same_suit
    UNION ALL
    SELECT rank_order FROM discarded_order
  ),
  ordered AS (
    SELECT rank_order
    FROM combined
    ORDER BY rank_order
  ),
  sequential_check AS (
    SELECT 
      rank_order,
      rank_order - LAG(rank_order, 1, rank_order - 1) OVER (ORDER BY rank_order) AS diff,
      rank_order - LAG(rank_order, 2, rank_order - 2) OVER (ORDER BY rank_order) AS diff2
    FROM ordered
  )
  SELECT EXISTS (
    SELECT 1
    FROM sequential_check
    WHERE diff = 1 AND diff2 = 2
  )
  INTO v_can_meld;

  RETURN v_can_meld;
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
