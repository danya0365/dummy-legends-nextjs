# 🎮 Dummy Legends - ระบบเล่นเกมพร้อมใช้งาน!

## ✅ ทำสำเร็จแล้ว

### 🗄️ Database - Game Logic Functions
สร้าง Migration ใหม่: `20251030000005_game_logic_functions.sql`

#### RPC Functions ที่เพิ่มเข้ามา:
1. **`start_game_session()`** ✅
   - เริ่มเกมใหม่
   - สร้างสำรับไพ่ 52 ใบ
   - สับไพ่ (Fisher-Yates algorithm)
   - แจกไพ่ให้ผู้เล่น (10 ใบ/คน)
   - วางไพ่ใบแรกใน discard pile
   - กำหนดเทิร์นเริ่มต้น

2. **`draw_card()`** ✅
   - จั่วไพ่จากสำรับหรือกองทิ้ง
   - ตรวจสอบเทิร์น
   - อัพเดทจำนวนไพ่ในมือ
   - บันทึกประวัติการเล่น

3. **`discard_card()`** ✅
   - ทิ้งไพ่ออกจากมือ
   - เปลี่ยนเทิร์นไปผู้เล่นถัดไป
   - อัพเดท discard pile
   - บันทึกประวัติการเล่น

4. **`get_game_state()`** ✅
   - ดึงสถานะเกมปัจจุบัน
   - ไพ่ในมือผู้เล่น
   - ไพ่บนกองทิ้ง
   - ข้อมูลผู้เล่นอื่น
   - ข้อมูลเทิร์น

### 📦 Types & Interfaces
สร้าง `gameplay.types.ts`:
```typescript
- GameCard
- GameSession
- PlayerHand
- Meld
- OtherPlayer
- GameState
- GameMove
```

### 🎮 Game Store - Gameplay Actions
เพิ่มฟังก์ชันใน `gameStore.ts`:

1. **State Management** ✅
   ```typescript
   currentSession: GameSession | null
   myHand: GameCard[]
   discardTop: GameCard | null
   otherPlayers: OtherPlayer[]
   gameChannel: RealtimeChannel | null
   ```

2. **Actions** ✅
   - `startGameSession()` - เริ่มเกมจริง
   - `loadGameState()` - โหลดสถานะเกม
   - `drawCard()` - จั่วไพ่
   - `discardCard()` - ทิ้งไพ่
   - `subscribeToGameSession()` - Realtime sync
   - `unsubscribeFromGame()` - Cleanup

### 🎴 UI Components

#### 1. PlayingCard Component ✅
- แสดงไพ่แบบสวยงาม
- รองรับ 4 ชนิด: ♥ ♦ ♣ ♠
- รองรับ 13 แรงค์: A, 2-10, J, Q, K
- สีแดง (Hearts, Diamonds)
- สีดำ (Clubs, Spades)
- 3 ขนาด: small, medium, large
- มี CardBack สำหรับไพ่คว่ำ

#### 2. GamePlayView Component ✅
**Layout หลัก 3 ส่วน:**

**Left Panel - ผู้เล่นอื่น:**
- แสดงผู้เล่นอื่นทั้งหมด
- จำนวนไพ่ในมือ (แสดงเป็น card back)
- Highlight ผู้เล่นที่กำลังเล่น

**Center Panel - กองไพ่:**
- **Deck** - จั่วจากสำรับ (แสดงจำนวนไพ่ที่เหลือ)
- **Discard Pile** - จั่วจากกองทิ้ง (แสดงไพ่บนสุด)
- คำแนะนำการเล่น

**Right Panel - สถิติ:**
- จำนวนไพ่ในมือ
- จำนวนไพ่ในสำรับ
- รอบปัจจุบัน
- ปุ่มรีเฟรช

**Bottom Panel - ไพ่ในมือ:**
- แสดงไพ่ทั้งหมดในมือ
- คลิกเลือกไพ่ที่จะทิ้ง
- Highlight ไพ่ที่เลือก (-translate-y-2)
- ปุ่มทิ้งไพ่

### 📄 Pages

#### `/app/game/play/[sessionId]/page.tsx` ✅
- รับ sessionId จาก URL
- Render GamePlayView
- SEO metadata

## 🎯 Game Flow (ขั้นตอนการเล่น)

### 1. เข้าห้องรอ
```
/game/lobby → เลือกห้อง → /game/room/[roomId]
```

### 2. พร้อมเล่น
- ผู้เล่นกด "พร้อมแล้ว"
- Host รอให้ทุกคนพร้อม
- Host กด "เริ่มเกม"

### 3. เริ่มเกม 🎮
```typescript
await startGame()           // Validate
await startGameSession()    // Create session + deal cards
→ /game/play/[sessionId]   // Navigate to gameplay
```

### 4. เล่นเกม
```
เทิร์นของคุณ:
1. จั่วไพ่ (จากสำรับ หรือ กองทิ้ง)
   → drawCard(fromDeck: true/false)

2. เลือกไพ่ที่จะทิ้ง (คลิกไพ่ในมือ)
   → setSelectedCardId(cardId)

3. ทิ้งไพ่
   → discardCard(cardId)
   → เปลี่ยนเทิร์นอัตโนมัติ

เทิร์นผู้เล่นอื่น:
- รอ... (ดูไพ่ในมือของตัวเอง)
- ดูผู้เล่นอื่นมีไพ่กี่ใบ
```

### 5. Realtime Sync ⚡
```typescript
subscribeToGameSession(sessionId)
  ↓
postgres_changes on game_cards  → reload game state
postgres_changes on game_sessions → reload game state
```

## 🎨 UI/UX Features

### ✅ Visual Feedback
- 🎯 Highlight เทิร์นของคุณ (เส้นขอบสีเหลือง)
- ⬆️ Card hover effect (scale-110)
- ⬆️⬆️ Selected card (-translate-y-2)
- 🔄 Loading spinner
- ⚠️ Error messages
- 💬 Turn instructions

### ✅ Turn Management
- แสดงชื่อผู้เล่นที่กำลังเล่น
- Disable การกระทำเมื่อไม่ใช่เทิร์นของคุณ
- คำแนะนำเปลี่ยนตามสถานะ:
  - "รอเทิร์นของคุณ"
  - "🎯 จั่วไพ่จากกอง"
  - "👆 เลือกไพ่ที่จะทิ้ง"
  - "✅ คลิกทิ้งไพ่เพื่อจบเทิร์น"

### ✅ Card Display
- ไพ่ในมือ: แสดงเต็มรูป
- ไพ่ผู้เล่นอื่น: แสดงหลังไพ่
- ไพ่กองทิ้ง: แสดงเต็มรูป
- ไพ่สำรับ: แสดงหลังไพ่

## 🛠️ Technical Details

### Database Schema
```sql
game_sessions (เซสชันเกม)
- id, room_id, round_number
- current_turn_gamer_id
- remaining_deck_cards
- discard_pile_top_card_id
- is_active, winner_gamer_id

game_cards (ไพ่)
- id, session_id
- suit, rank, card_value
- location (deck/discard/hand/meld)
- owner_gamer_id
- position_in_location

game_hands (มือผู้เล่น)
- id, session_id, gamer_id
- card_count
- deadwood_count, deadwood_value
- melds (JSONB)

game_moves (ประวัติการเล่น)
- id, session_id, gamer_id
- move_type, move_number
- move_data (JSONB)
- time_taken_seconds
```

### Card Value Calculation
```sql
get_card_value(rank) RETURNS INTEGER
- A = 1
- 2-10 = face value
- J, Q, K = 10
```

### Fisher-Yates Shuffle
```sql
FOR i IN REVERSE array_length(deck)..2 LOOP
  j := random position from 1 to i
  swap deck[i] with deck[j]
END LOOP
```

## 🎮 ทดสอบเกม

### Single Player Test
```bash
# Terminal 1: Supabase
supabase start

# Terminal 2: Next.js
yarn dev

# Browser
http://localhost:3000/game/lobby
```

### Multiplayer Test
1. เปิด 2 browser tabs/windows
2. Tab 1: สร้างห้อง
3. Tab 2: เข้าร่วมห้อง
4. ทั้ง 2 tabs กด "พร้อมแล้ว"
5. Tab 1 (Host) กด "เริ่มเกม"
6. เล่นสลับกันไป!

## ⚡ Realtime Features

### Auto-sync เมื่อ:
- ผู้เล่นจั่วไพ่
- ผู้เล่นทิ้งไพ่
- เปลี่ยนเทิร์น
- Session status เปลี่ยน

### การทำงาน:
```typescript
game_cards changes → loadGameState()
game_sessions changes → loadGameState()
```

## 🎯 สิ่งที่เล่นได้แล้ว

✅ สร้างห้อง
✅ เข้าร่วมห้อง  
✅ Ready system
✅ เริ่มเกม → แจกไพ่
✅ จั่วไพ่ (จากสำรับ/กองทิ้ง)
✅ ทิ้งไพ่
✅ เปลี่ยนเทิร์น
✅ Realtime sync
✅ Guest users support

## 🔜 Features ถัดไป (Optional)

### Phase 1: Meld System
- [ ] รวมไพ่ (Set/Run)
- [ ] แสดง meld
- [ ] Deadwood calculation

### Phase 2: Win Conditions
- [ ] Knock (deadwood ≤ 10)
- [ ] Gin (deadwood = 0)
- [ ] Score calculation
- [ ] Game results

### Phase 3: Advanced Features
- [ ] Chat in game
- [ ] Timer per turn
- [ ] Statistics tracking
- [ ] Replay system

## 📊 สรุป

**ระบบเล่นเกมพร้อมใช้งาน 100%!** 🎉

### ทำได้แล้ว:
- ✅ Database schema + RPC functions
- ✅ Card dealing & shuffling
- ✅ Turn management
- ✅ Draw & discard mechanics
- ✅ Real-time multiplayer
- ✅ Beautiful card UI
- ✅ Guest support

### วิธีเล่น:
```
1. เข้า /game/lobby
2. สร้าง/เข้าห้อง
3. พร้อม → เริ่มเกม
4. จั่ว → ทิ้ง → ซ้ำ
5. สนุก! 🎮
```

---

**Status**: ✅ Fully Playable!  
**Updated**: 2025-10-30  
**เริ่มเล่นเลย**: `http://localhost:3000/game/lobby`
