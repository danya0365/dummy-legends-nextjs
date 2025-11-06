-- =====================================================
-- HELPER: ตรวจสอบว่าไพ่ที่จะทิ้งผิดกติกาหรือไม่
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_discard_card_rules(
  p_session_id UUID,
  p_gamer_id UUID,
  p_card_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_can_discard BOOLEAN := true;
  v_violation_type TEXT := NULL;
  v_violation_message TEXT := NULL;
  v_next_gamer_id UUID;
  v_can_next_player_meld BOOLEAN := false;
  v_player_hand_count INTEGER;
  v_player_meld_count INTEGER;
BEGIN
  -- หาผู้เล่นถัดไป
  SELECT gamer_id INTO v_next_gamer_id
  FROM public.room_players
  WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id)
  AND position = (
    SELECT (position + 1) % (SELECT COUNT(*) FROM public.room_players WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id))
    FROM public.room_players
    WHERE room_id = (SELECT room_id FROM public.game_sessions WHERE id = p_session_id)
    AND gamer_id = p_gamer_id
  );

  -- ตรวจสอบว่าผู้เล่นมีไพ่ในมือกี่ใบและเกิดไปกี่กอง
  SELECT 
    gh.card_count,
    COALESCE(jsonb_array_length(gh.melds), 0)
  INTO v_player_hand_count, v_player_meld_count
  FROM public.game_hands gh
  WHERE gh.session_id = p_session_id
    AND gh.gamer_id = p_gamer_id;

  -- กฎ 1: ห้ามทิ้งไพ่ที่ผู้เล่นถัดไปสามารถเกิดได้ทันที (ยกเว้นเป็นไพ่ใบสุดท้าย)
  IF v_next_gamer_id IS NOT NULL AND v_player_hand_count > 1 THEN
    v_can_next_player_meld := public.check_discard_can_meld(
      p_session_id,
      p_card_id,
      v_next_gamer_id
    );

    IF v_can_next_player_meld THEN
      v_can_discard := false;
      v_violation_type := 'can_meld_immediately';
      v_violation_message := 'ไม่สามารถทิ้งไพ่ที่ผู้เล่นถัดไปสามารถเกิดได้ทันที';
    END IF;
  END IF;

  -- กฎ 2: ถ้าเป็นไพ่ใบสุดท้าย (กำลังจะน็อก) ต้องมีการเกิดอย่างน้อย 1 กอง
  IF v_player_hand_count = 1 AND v_player_meld_count = 0 THEN
    v_can_discard := false;
    v_violation_type := 'no_meld_before_knock';
    v_violation_message := 'ต้องเกิดไพ่อย่างน้อย 1 กองก่อนน็อก';
  END IF;

  RETURN jsonb_build_object(
    'can_discard', v_can_discard,
    'violation_type', v_violation_type,
    'violation_message', v_violation_message,
    'next_player_can_meld', v_can_next_player_meld,
    'hand_count', v_player_hand_count,
    'meld_count', v_player_meld_count
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ปรับ discard_card ให้ตรวจสอบกติกาก่อนทิ้ง
-- =====================================================

CREATE OR REPLACE FUNCTION public.discard_card_with_validation(
  p_session_id UUID,
  p_gamer_id UUID,
  p_card_id UUID,
  p_guest_identifier TEXT DEFAULT NULL,
  p_force_discard BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_validation_result JSONB;
  v_can_discard BOOLEAN;
  v_discard_result BOOLEAN;
BEGIN
  -- ตรวจสอบกติกาก่อนทิ้ง (ยกเว้นถ้า force_discard = true)
  IF NOT p_force_discard THEN
    v_validation_result := public.validate_discard_card_rules(
      p_session_id,
      p_gamer_id,
      p_card_id
    );

    v_can_discard := (v_validation_result->>'can_discard')::BOOLEAN;

    IF NOT v_can_discard THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'validation_failed',
        'validation', v_validation_result
      );
    END IF;
  END IF;

  -- ถ้าผ่านการตรวจสอบ ให้ทิ้งไพ่ตามปกติ
  v_discard_result := public.discard_card(
    p_session_id,
    p_gamer_id,
    p_card_id,
    p_guest_identifier
  );

  RETURN jsonb_build_object(
    'success', v_discard_result,
    'validation', v_validation_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
