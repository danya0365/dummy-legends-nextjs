# Phase 4: Game Logic Implementation ✅

## สรุปการพัฒนา

Phase 4 เสร็จสมบูรณ์แล้ว! ระบบเกมไพ่ Dummy พร้อมสำหรับการเล่นแบบ multiplayer ด้วย Supabase Realtime

---

## 🎴 Card System & Utilities

### ไฟล์: `/src/utils/cardUtils.ts`

#### Card Generation & Shuffling
- ✅ `generateDeck()` - สร้างไพ่ครบ 52 ใบ
- ✅ `shuffleDeck()` - สับไพ่ด้วย Fisher-Yates algorithm
- ✅ `dealCards()` - แจกไพ่ให้ผู้เล่น (13 ใบ/คน)

#### Card Operations
- ✅ `sortCards()` - เรียงไพ่ตามชนิดและหมายเลข
- ✅ `calculateCardValue()` - คำนวณค่าไพ่
- ✅ `getCardDisplayName()` - แสดงชื่อไพ่พร้อม symbol
- ✅ `getCardColor()` - ระบุสีไพ่ (แดง/ดำ)

#### Meld Validation
- ✅ `isValidSet()` - ตรวจสอบ Set (ไพ่เลขเดียวกัน 3+ ใบ)
- ✅ `isValidRun()` - ตรวจสอบ Run (ไพ่ติดกัน 3+ ใบชนิดเดียว)
- ✅ `isValidMeld()` - ตรวจสอบว่าวางไพ่ได้หรือไม่
- ✅ `findPossibleMelds()` - หาชุดไพ่ที่วางได้ทั้งหมด

#### Scoring
- ✅ `calculateDeadwood()` - คำนวณไพ่เหลือที่ไม่ได้วาง

---

## 🗄️ Database Functions

### ไฟล์: `/supabase/migrations/20250830000004_game_play_functions.sql`

#### RPC Functions Created

**1. initialize_game_state(p_room_id)**
- สร้าง game state เริ่มต้น
- กำหนดผู้เล่นคนแรกเป็นคนเริ่ม
- Return: Player info, game config

**2. draw_card(p_room_id, p_from_discard)**
- จั่วไพ่จากกอง deck หรือ discard pile
- ตรวจสอบเทิร์น
- Log การจั่วไพ่
- Return: Card data

**3. discard_card(p_room_id, p_card)**
- ทิ้งไพ่ลง discard pile
- เปลี่ยนเทิร์นให้ผู้เล่นคนต่อไป
- Log การทิ้งไพ่
- Return: Next player ID

**4. meld_cards(p_room_id, p_cards)**
- วางชุดไพ่ (Set หรือ Run)
- บันทึก meld ของผู้เล่น
- Log การวางไพ่

**5. knock(p_room_id, p_deadwood_value)**
- ประกาศจบรอบ (Knock)
- ตรวจสอบ deadwood <= 10
- Log การ knock

**6. update_game_state(...)**
- อัพเดท game state (deck, discard pile, hands, melds, scores)
- ใช้สำหรับ sync state ระหว่างผู้เล่น

---

## 🎮 Game Repository

### ไฟล์: `/src/infrastructure/supabase/gameRepository.ts`

#### เพิ่ม Methods ใหม่

```typescript
// Game initialization
initializeGameState(roomId: string): Promise<any>
updateGameState(params: {...}): Promise<void>

// Card actions
drawCard(roomId: string, fromDiscard?: boolean): Promise<any>
discardCard(roomId: string, card: any): Promise<any>
meldCards(roomId: string, cards: any[]): Promise<void>

// Game end
knock(roomId: string, deadwoodValue: number): Promise<any>
```

---

## 📦 Game Store

### ไฟล์: `/src/stores/gameStore.ts`

#### เพิ่ม Gameplay State

```typescript
interface GameStore {
  // Gameplay state
  gamePlayState: GamePlayState | null;
  myHand: Card[];
  selectedCards: Card[];
  
  // ... existing room management state
}
```

#### เพิ่ม Gameplay Actions

```typescript
// Game initialization
initializeGame(): Promise<void>

// Card actions  
drawCard(fromDiscard?: boolean): Promise<void>
discardCard(card: Card): Promise<void>

// Card selection
selectCard(card: Card): void
deselectCard(card: Card): void
clearSelection(): void

// Melds
meldCards(cards: Card[]): Promise<void>

// Game end
knock(deadwoodValue: number): Promise<void>
```

---

## 🎯 Game Flow

```
1. Room created & players joined (Phase 3)
   ↓
2. Host starts game
   ↓
3. initializeGame() - แจกไพ่ให้ผู้เล่น
   ↓
4. Game loop:
   - ผู้เล่นเทิร์นปัจจุบัน:
     a. drawCard() - จั่วไพ่ (จาก deck หรือ discard)
     b. (Optional) meldCards() - วางชุดไพ่
     c. discardCard() - ทิ้งไพ่
     d. (Optional) knock() - ประกาศจบ
   ↓
5. เปลี่ยนเทิร์นผู้เล่นคนต่อไป
   ↓
6. Repeat until someone knocks or deck empty
   ↓
7. Calculate scores
   ↓
8. Next round or game end
```

---

## 🔧 Implementation Details

### Card Dealing Logic

```typescript
// Generate full deck (52 cards)
const deck = generateDeck();

// Deal 13 cards to each player
const { playerHands, remainingDeck } = dealCards(
  deck,
  playerCount,
  13
);

// Sort each player's hand
playerHands.forEach((hand, index) => {
  playerHandsObj[playerIds[index]] = sortCards(hand);
});
```

### Turn Management

```typescript
// Get next player (circular)
const nextPosition = (currentPosition + 1) % totalPlayers;
const nextPlayer = players.find(p => p.position === nextPosition);

// Update turn
UPDATE game_states 
SET current_turn_user_id = nextPlayer.userId,
    turn_start_time = NOW()
WHERE room_id = p_room_id;
```

### Meld Validation

```typescript
// Check if cards form valid set
function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  return cards.every(card => card.rank === cards[0].rank);
}

// Check if cards form valid run
function isValidRun(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  // Same suit + consecutive ranks
  const sorted = sortCards(cards);
  return sorted.every((card, i) => {
    if (i === 0) return card.suit === sorted[0].suit;
    return card.suit === sorted[0].suit &&
           CARD_RANKS.indexOf(card.rank) === 
           CARD_RANKS.indexOf(sorted[i-1].rank) + 1;
  });
}
```

---

## 📊 Data Structures

### Card

```typescript
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | ... | 'K';
  id: string; // e.g., "hearts-A"
}
```

### GamePlayState

```typescript
interface GamePlayState {
  roomId: string;
  deck: Card[];
  discardPile: Card[];
  playerHands: PlayerHand[];
  currentTurn: string; // user ID
  turnStartTime: string;
  round: number;
  scores: { [playerId: string]: number };
}
```

### PlayerHand

```typescript
interface PlayerHand {
  playerId: string;
  cards: Card[];
  melds: Card[][]; // วางแล้ว
}
```

---

## 🔒 Security & Validation

### RPC Functions
- ✅ Authentication check ทุก function
- ✅ Turn validation - ตรวจสอบว่าเป็นเทิร์นของผู้เล่นหรือไม่
- ✅ Room membership check - ต้องอยู่ในห้องถึงจะเล่นได้
- ✅ Deadwood validation - knock ได้เฉพาะเมื่อ <= 10
- ✅ Deck/discard pile empty check

### Client-side
- ✅ Card validation ก่อนส่ง
- ✅ Meld validation ก่อนวาง
- ✅ Error handling ครบถ้วน
- ✅ Loading states

---

## 🎨 Features Ready

### ✅ Implemented
- แจกไพ่อัตโนมัติ (13 ใบ/คน)
- จั่วไพ่จาก deck หรือ discard pile
- ทิ้งไพ่
- เลือก/ยกเลิกเลือกไพ่
- วางชุดไพ่ (Set/Run)
- Knock (จบรอบ)
- เรียงไพ่อัตโนมัติ
- คำนวณค่าไพ่
- ตรวจสอบ valid melds
- Turn management
- Game state synchronization

### ⏳ Not Yet Implemented (Next Steps)
- UI components สำหรับเล่นเกม
- Card animation
- Timer countdown
- Score calculation & display
- Gin detection
- Undercut detection
- Round/game winner determination
- Replay system
- Sound effects
- Tutorial mode

---

## 🧪 Testing Guide

### 1. Start Supabase

```bash
npm run supabase-start
```

### 2. Reset Database (fresh migrations)

```bash
npm run supabase-migrate
```

### 3. Generate Types

```bash
npm run supabase-generate
```

### 4. Start Dev Server

```bash
npm run dev
```

### 5. Test Game Flow

```typescript
// In React component or console
const { 
  createRoom, 
  startGame, 
  initializeGame,
  drawCard,
  discardCard,
  meldCards,
  knock 
} = useGameStore();

// Create room
await createRoom({ name: "Test Game", mode: "casual", ... });

// Start game (as host)
await startGame();

// Initialize game (deal cards)
await initializeGame();

// Play
await drawCard(); // Draw from deck
await drawCard(true); // Draw from discard pile
await discardCard(myHand[0]);
await meldCards([card1, card2, card3]); // Valid set/run
await knock(8); // Knock with deadwood = 8
```

---

## 📈 Performance

### Optimizations
- ✅ Efficient card shuffling (Fisher-Yates O(n))
- ✅ Indexed queries on game_states
- ✅ JSONB for flexible data storage
- ✅ Minimal network calls
- ✅ Client-side card sorting
- ✅ Batch updates

---

## 🚀 Next Phase: UI Components

### Recommended Implementation Order

1. **Card Component** - แสดงไพ่ 1 ใบ
2. **Hand Component** - แสดงไพ่บนมือทั้งหมด
3. **Deck & Discard Pile** - แสดงกองไพ่
4. **Meld Area** - แสดงไพ่ที่วางแล้ว
5. **Game Board** - รวม components ทั้งหมด
6. **Turn Indicator** - แสดงเทิร์นของใคร
7. **Action Buttons** - Draw, Discard, Meld, Knock
8. **Score Board** - แสดงคะแนน
9. **Game Over Modal** - แสดงผลการเล่น

---

## 📚 Resources

- [Dummy/Gin Rummy Rules](https://www.pagat.com/rummy/ginrummy.html)
- [Fisher-Yates Shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**สร้างโดย:** Marosdee Uma  
**วันที่:** 2025-01-30  
**Phase:** 4 - Game Logic  
**Status:** ✅ Complete

**ระบบพร้อมสำหรับ:**
- ✅ การแจกไพ่
- ✅ การเล่นไพ่ (Draw, Discard, Meld, Knock)
- ✅ Turn management
- ✅ Validation & Security
- ⏳ UI Implementation (Next Phase)
