# TODO RULES - Dummy Legends Detailed Rules

## ภาพรวมสถานะ (อัปเดต 2025-11-05)

- ✅ รองรับผู้เล่น 2-4 คน และแจกไพ่ตามจำนวนที่ถูกต้อง @supabase/migrations/20251030000005_game_logic_functions.sql#68-166
- ✅ สร้างกองกลาง (หัวไพ่) พร้อมบันทึกสถานะ `is_head` @supabase/migrations/20251030000005_game_logic_functions.sql#167-188
- ✅ กติกาเกิดไพ่ (รวมการใช้หัว/สเปโต) และคิดคะแนนโบนัส @supabase/migrations/20251030000005_game_logic_functions.sql#1485-1615
- ✅ เก็บกองทิ้งเพื่อเกิด (รวมตรวจสอบไพ่ที่หยิบ) @supabase/migrations/20251030000005_game_logic_functions.sql#1349-1653
- ✅ ฝากไพ่ (layoff) พร้อมบันทึกคะแนนสเปโต @supabase/migrations/20251030000005_game_logic_functions.sql#908-969
- ✅ การทิ้งไพ่และจัดเรียงตำแหน่งกองทิ้งถูกต้อง @supabase/migrations/20251030000005_game_logic_functions.sql#1693-1752
- ✅ จั่วจากกองหลักและรีชัฟเฟิลกองทิ้งเมื่อกองหลักหมด @supabase/migrations/20251030000005_game_logic_functions.sql#349-492
- ✅ ระบบคะแนนพื้นฐาน (เกิด, หัว, สเปโต, ฝากสเปโต, น็อก) @supabase/migrations/20251030000005_game_logic_functions.sql#1485-2055
- ✅ UI แสดงคำแนะนำสำหรับ flow ทิ้งไพ่/เกิด/ฝาก @src/presentation/components/game/hooks/useGamePlayController.ts#496-545
- ✅ รองรับการตรวจและให้โบนัสสำหรับน็อกมืด, น็อกสี, น็อกมืดสี @supabase/migrations/20251030000005_game_logic_functions.sql#1889-2093
- ✅ ตรวจและบันทึกโทษทิ้งมี่/ทิ้งปี้หัว/ทิ้งเต็ม @supabase/migrations/20251106000001_discard_penalty_check.sql#1-175 @supabase/migrations/20251030000005_game_logic_functions.sql#1778-1786
- ✅ ตรวจและบันทึกโทษทิ้งโง่ (ทิ้งแล้วคนถัดไปน็อก) @supabase/migrations/20251030000005_game_logic_functions.sql#1968-2004
- ✅ ตรวจและบันทึกโทษถูกฝากสเปโต @supabase/migrations/20251030000005_game_logic_functions.sql#1086-1109
- ✅ รองรับลบมืด (ไม่เคยเกิดแล้วโดนน็อก - คูณแต้มลบ x2) @supabase/migrations/20251030000005_game_logic_functions.sql#2055-2100
- ✅ มีระบบจับผิด/เตือนเมื่อทิ้งไพ่ผิดกติกา @supabase/migrations/20251106000002_validate_discard_rules.sql @src/stores/gameStore.ts#2398-2444
  - ตรวจสอบไม่ให้ทิ้งไพ่ที่ผู้เล่นถัดไปสามารถเกิดได้ทันที
  - ตรวจสอบต้องเกิดอย่างน้อย 1 กองก่อนน็อก
  - รองรับ force discard สำหรับกรณีพิเศษ
- ✅ คำนวณ multiplier x2/x4 สำหรับรูปแบบน็อกพิเศษในสรุปผลคะแนน @supabase/migrations/20251030000005_game_logic_functions.sql#1998-2083
- 🔄 กำลังทำ UX Support
  - ✅ ValidationErrorDialog แสดงข้อความเตือนเมื่อทิ้งไพ่ผิดกติกา @src/presentation/components/game/game-play/ValidationErrorDialog.tsx
  - ⚠️ ยังไม่มี Tooltip อธิบายโบนัส/โทษในเกม
  - ⚠️ ยังไม่มีสรุปเหตุการณ์โดยละเอียดในหน้าผลรอบ
- ❌ ยังไม่รองรับโหมดกติกา Tournament/Custom หรือปรับแต้มตาม RULES.md ส่วนนี้ยังไม่เริ่ม
- ✅ บันทึกสถิติโทษพิเศษ (spe_to_penalty, dummy_penalty, head_penalty, foolish_penalty) ใน flow ปัจจุบัน

## TODO ตามลำดับความสำคัญ

1. **เพิ่มโบนัสน็อกพิเศษ** (น็อกมืด/น็อกสี/น็อกมืดสี) ✅ สำเร็จ @supabase/migrations/20251030000005_game_logic_functions.sql#1889-2083

2. **ระบบโทษการทิ้งไพ่** ✅ สำเร็จ
   - ✅ ตรวจเมื่อผู้เล่นทิ้งไพ่ แล้วผู้เล่นถัดไปสามารถเกิดได้ทันที (ทิ้งมี่/เต็ม/ปี้หัว) @supabase/migrations/20251106000001_discard_penalty_check.sql
   - ✅ หากทิ้งแล้วผู้เล่นถัดไปน็อก ให้บันทึก `foolish_penalty` @supabase/migrations/20251030000005_game_logic_functions.sql#1968-2004
   - ✅ หากผู้เล่นถูกฝากสเปโต ต้องบันทึก `spe_to_penalty` @supabase/migrations/20251030000005_game_logic_functions.sql#1086-1109

3. **ปรับการสรุปคะแนนรอบ**
   - เพิ่มการใช้คะแนนลบพิเศษจากข้อ 2
   - ปรับ `compute_thai_dummy_scores` ให้รองรับ multiplier น็อกพิเศษ และสรุปแต้มตาม RULES.md

4. **UX Support**
   - เพิ่ม Tooltip/Guidance อธิบายโบนัส/โทษเมื่อเกิดเหตุการณ์
   - เพิ่มสรุปในหน้าเกมหรือผลรอบว่ามีเหตุการณ์อะไรเกิดขึ้นบ้าง

5. **Rule Variations & Config**
   - ออกแบบโครงสร้างให้ตั้งค่าเดิมพัน/แต้มพิเศษได้ (ตัวเลือกในหน้าห้อง)
   - รองรับ Tournament Rule / Custom Rule (จาก RULES.md ส่วนต่อขยาย)

## หมายเหตุ

- ฟังก์ชันที่ใช้คะแนนหลักอยู่ใน `public.compute_thai_dummy_scores` และ `finish_game_round`
- Enum `score_event_type` มีค่ารองรับโทษ/โบนัสหลายแบบ แต่ implementation ยังไม่ครบ
- ควรกำหนด test case (unit/integration) สำหรับแต่ละเหตุการณ์ เพื่อกัน regression ในอนาคต
