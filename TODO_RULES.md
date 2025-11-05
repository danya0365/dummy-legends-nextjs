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
- ⚠️ ยังไม่รองรับการตรวจและให้โบนัสสำหรับ
  - น็อกมืด, น็อกสี, น็อกมืดสี
  - ทิ้งมี่, ทิ้งปี้หัว, ทิ้งเต็ม, ทิ้งโง่, ลบมืด
  - ตรวจ deadwood เพื่อนับแต้มติดลบให้ผู้เล่นอื่นแบบละเอียด (ยังขาดบันทึกประเภท penalty เฉพาะ)
- ⚠️ ยังไม่มีระบบจับผิด/เตือนเมื่อทิ้งไพ่ผิดกติกา (ต้องตรวจจากกองที่เกิดได้ทันที)
- ✅ คำนวณ multiplier x2/x4 สำหรับรูปแบบน็อกพิเศษในสรุปผลคะแนน @supabase/migrations/20251030000005_game_logic_functions.sql#1998-2083
- ⚠️ ยังไม่มี UX อธิบายกติกาในเกม (เช่น Tooltip, Rule overlay)
- ❌ ยังไม่รองรับโหมดกติกา Tournament/Custom หรือปรับแต้มตาม RULES.md ส่วนนี้ยังไม่เริ่ม
- ❌ ยังไม่บันทึกสถิติโทษพิเศษ (เช่น spe_to_penalty, dummy_penalty) ใน flow ปัจจุบัน แม้ enum มีประกาศไว้

## TODO ตามลำดับความสำคัญ

1. **เพิ่มโบนัสน็อกพิเศษ** (น็อกมืด/น็อกสี/น็อกมืดสี) ✅ สำเร็จ @supabase/migrations/20251030000005_game_logic_functions.sql#1889-2083

2. **ระบบโทษการทิ้งไพ่**
   - ตรวจเมื่อผู้เล่นทิ้งไพ่ แล้วผู้เล่นถัดไปสามารถเกิดได้ทันที (ทิ้งมี่/เต็ม/ปี้หัว)
   - หากทิ้งแล้วผู้เล่นถัดไปน็อก ให้บันทึก `foolish_penalty`
   - หากผู้เล่นถูกฝากสเปโต ต้องบันทึก `spe_to_penalty`

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
