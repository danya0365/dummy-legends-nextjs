# Dummy Legends - Database Schema Documentation

## Overview

ระบบฐานข้อมูลสำหรับเกมไพ่ Dummy Legends แบบ multiplayer realtime โดยใช้ Supabase พร้อมรองรับทั้ง **guest players** และ **authenticated users**

## 🎯 Core Concepts

### 1. Gamer-Centric Design

- ระบบเกมทั้งหมดผูกกับ `public.gamers.id` เท่านั้น
- **Guest Players**: `profile_id = NULL`, ใช้ `guest_identifier` (จาก localStorage)
- **Authenticated Players**: `profile_id != NULL`, เชื่อมกับ `public.profiles`

### 2. Security Model

```sql
-- สำหรับ Authenticated Users
ตรวจสอบว่า public.get_active_profile_id() = gamers.profile_id

-- สำหรับ Guest Users
ส่ง guest_identifier เป็น RPC parameter
ตรวจสอบว่า guest_identifier = gamers.guest_identifier
```

### 3. Realtime Features

ใช้ Supabase Realtime subscriptions สำหรับ:

- การเข้า-ออกห้องเกม (room_players)
- สถานะความพร้อม (is_ready)
- การแจกไพ่และเทิร์น (game_sessions, game_cards)
- การเล่นไพ่แต่ละใบ (game_moves)

## 📊 Database Schema

### Migration Files

#### 1. **20251030000001_gamers_and_enums.sql**

- **Enums**: room_status, player_status, game_mode, card_suit, card_rank, game_move_type
- **Table: gamers** - ตาราง core identity
  ```sql
  profile_id UUID (nullable) → profiles.id
  guest_identifier TEXT (nullable, unique)
  guest_display_name TEXT
  elo_rating, level, stats...
  ```

#### 2. **20251030000002_game_rooms.sql**

- **Table: game_rooms** - ห้องเกม
  ```sql
  host_gamer_id → gamers.id
  room_code (6 digits, unique)
  status, mode, max_players, bet_amount
  ```
- **Table: room_players** - ผู้เล่นในห้อง
  ```sql
  room_id → game_rooms.id
  gamer_id → gamers.id
  position (0-3), is_ready, is_host
  ```
- **Table: room_spectators** - ผู้ชมเกม

#### 3. **20251030000003_game_sessions_and_cards.sql**

- **Table: game_sessions** - รอบเกม
- **Table: game_hands** - ไพ่ในมือผู้เล่น
- **Table: game_cards** - ไพ่แต่ละใบ
- **Table: game_moves** - บันทึกการเล่น
- **Table: game_results** - ผลการแข่งขัน
- **Table: gamer_achievements** - ความสำเร็จ

#### 4. **20251030000004_rpc_functions.sql**

- RPC functions สำหรับจัดการเกม

## 🔐 RLS Policies

### Guest Access Pattern

```sql
-- Guest users ส่ง guest_identifier มาผ่าน RPC function
CREATE OR REPLACE FUNCTION can_access_gamer(
  p_gamer_id UUID,
  p_guest_identifier TEXT DEFAULT NULL
)
RETURNS BOOLEAN;
```

### Authenticated Access Pattern

```sql
-- Authenticated users ใช้ get_active_profile_id()
WHERE profile_id = public.get_active_profile_id()
```

### Policy Examples

```sql
-- Gamers: ทุกคนดูได้, แก้ไขได้เฉพาะตัวเอง
"gamers_select_all" - SELECT USING (true)
"gamers_update_own" - UPDATE USING (profile_id = get_active_profile_id())

-- Rooms: ดูห้องสาธารณะได้ทุกคน
"rooms_select_public" - SELECT USING (NOT is_private AND status IN ('waiting', 'ready'))

-- Hands: ดูไพ่ตัวเองได้เท่านั้น
"hands_select_own" - SELECT USING (gamer_id IN (SELECT id FROM gamers WHERE profile_id = get_active_profile_id()))
```

## 🎮 Core RPC Functions

### Gamer Management

#### `create_or_get_gamer()`

```sql
-- สร้างหรือดึง gamer record
-- สำหรับ guest: ส่ง guest_identifier + guest_display_name
-- สำหรับ authenticated: ส่ง profile_id

SELECT * FROM public.create_or_get_gamer(
  p_guest_identifier := 'uuid-from-localstorage',
  p_guest_display_name := 'Player123'
);
```

#### `link_guest_to_profile()`

```sql
-- เชื่อม guest account เข้ากับ profile (เมื่อ guest ลงทะเบียน/login)
SELECT * FROM public.link_guest_to_profile(
  p_guest_identifier := 'guest-uuid',
  p_profile_id := 'profile-uuid'
);
```

#### `update_gamer_preferences()`

```sql
-- อัพเดต preferences (guest ต้องส่ง guest_identifier)
SELECT * FROM public.update_gamer_preferences(
  p_gamer_id := 'gamer-uuid',
  p_guest_identifier := 'guest-uuid', -- สำหรับ guest
  p_preferences := '{"sound_enabled": false}'::jsonb
);
```

### Room Management

#### `create_game_room()`

```sql
-- สร้างห้องเกม
SELECT * FROM public.create_game_room(
  p_gamer_id := 'gamer-uuid',
  p_guest_identifier := 'guest-uuid', -- สำหรับ guest
  p_room_name := 'ห้องมือใหม่',
  p_mode := 'casual',
  p_max_players := 4,
  p_bet_amount := 100,
  p_is_private := false
);

-- Returns: (room_id, room_code)
```

#### `join_game_room()`

```sql
-- เข้าร่วมห้องเกม
SELECT * FROM public.join_game_room(
  p_gamer_id := 'gamer-uuid',
  p_guest_identifier := 'guest-uuid', -- สำหรับ guest
  p_room_code := '123456',
  p_room_password := NULL -- สำหรับห้องที่มีรหัสผ่าน
);

-- Returns: room_id
```

#### `leave_game_room()`

```sql
-- ออกจากห้อง (หาก host ออก จะโอน host หรือยกเลิกห้อง)
SELECT * FROM public.leave_game_room(
  p_gamer_id := 'gamer-uuid',
  p_guest_identifier := 'guest-uuid',
  p_room_id := 'room-uuid'
);
```

#### `toggle_ready_status()`

```sql
-- สลับสถานะความพร้อม
SELECT * FROM public.toggle_ready_status(
  p_gamer_id := 'gamer-uuid',
  p_guest_identifier := 'guest-uuid',
  p_room_id := 'room-uuid'
);
```

#### `get_available_rooms()`

```sql
-- ดึงรายการห้องที่เปิดรับผู้เล่น
SELECT * FROM public.get_available_rooms(
  p_mode := 'casual', -- หรือ NULL สำหรับทุกโหมด
  p_limit := 20,
  p_offset := 0
);
```

#### `get_room_details()`

```sql
-- ดึงข้อมูลห้องพร้อมรายชื่อผู้เล่น
SELECT * FROM public.get_room_details('room-uuid');

-- Returns: JSON with room info + players array
```

## 🔄 Realtime Subscriptions

### Subscribe to Room Updates

```typescript
// Client-side code example
const roomChannel = supabase
  .channel(`room:${roomId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "room_players",
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      console.log("Player update:", payload);
      // Update UI
    }
  )
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "game_rooms",
      filter: `id=eq.${roomId}`,
    },
    (payload) => {
      console.log("Room update:", payload);
      // Update room status, etc.
    }
  )
  .subscribe();
```

### Subscribe to Game Session

```typescript
const gameChannel = supabase
  .channel(`game:${sessionId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "game_moves",
      filter: `session_id=eq.${sessionId}`,
    },
    (payload) => {
      console.log("New move:", payload);
      // Update game state
    }
  )
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "game_sessions",
      filter: `id=eq.${sessionId}`,
    },
    (payload) => {
      console.log("Session update:", payload);
      // Update current turn, etc.
    }
  )
  .subscribe();
```

## 🎯 Implementation Flow

### Guest Player Flow

#### 1. First Time Visit

```typescript
// Client generates and stores identifier
const guestId = crypto.randomUUID();
localStorage.setItem("guest_identifier", guestId);

// Create gamer record
const { data } = await supabase.rpc("create_or_get_gamer", {
  p_guest_identifier: guestId,
  p_guest_display_name: "Guest_" + Math.random().toString(36).substr(2, 6),
});

const gamerId = data[0].gamer_id;
localStorage.setItem("gamer_id", gamerId);
```

#### 2. Create/Join Room

```typescript
// All game operations use gamer_id + guest_identifier
const { data: room } = await supabase.rpc("create_game_room", {
  p_gamer_id: gamerId,
  p_guest_identifier: guestId,
  p_room_name: "My Room",
  p_mode: "casual",
  p_max_players: 4,
});
```

#### 3. Convert Guest to User (ถ้าลงทะเบียน)

```typescript
// After user signs up/logs in
const profileId = user.profile_id;

const { data } = await supabase.rpc("link_guest_to_profile", {
  p_guest_identifier: guestId,
  p_profile_id: profileId,
});

// Clear guest data from localStorage
localStorage.removeItem("guest_identifier");
```

### Authenticated Player Flow

#### 1. Login

```typescript
// Get profile_id from auth
const {
  data: { user },
} = await supabase.auth.getUser();
const profileId = user.user_metadata.profile_id;

// Create or get gamer
const { data } = await supabase.rpc("create_or_get_gamer", {
  p_profile_id: profileId,
});

const gamerId = data[0].gamer_id;
```

#### 2. Create/Join Room

```typescript
// No need to pass guest_identifier
const { data: room } = await supabase.rpc("create_game_room", {
  p_gamer_id: gamerId,
  p_room_name: "Ranked Match",
  p_mode: "ranked",
  p_max_players: 4,
});
```

## 📋 Tables Summary

| Table                | Purpose              | Key Relations                   |
| -------------------- | -------------------- | ------------------------------- |
| `gamers`             | Core player identity | → profiles (nullable)           |
| `game_rooms`         | Game lobbies         | → gamers (host)                 |
| `room_players`       | Players in rooms     | → game_rooms, gamers            |
| `room_spectators`    | Spectators           | → game_rooms, gamers            |
| `game_sessions`      | Active game rounds   | → game_rooms, gamers (turn)     |
| `game_hands`         | Player hands         | → game_sessions, gamers         |
| `game_cards`         | Individual cards     | → game_sessions, gamers (owner) |
| `game_moves`         | Move history         | → game_sessions, gamers         |
| `game_results`       | Completed games      | → game_rooms, gamers (winner)   |
| `gamer_achievements` | Achievements         | → gamers                        |

## 🚀 Next Steps

### 1. Run Migrations

```bash
cd /Users/marosdeeuma/dummy-legends-nextjs
supabase db reset # หรือ
supabase migration up
```

### 2. Generate Types

```bash
supabase gen types typescript --local > src/domain/types/supabase.ts
```

### 3. Update gameStore.ts

- เชื่อมต่อกับ Supabase RPC functions
- ใช้ Realtime subscriptions
- จัดการ guest_identifier จาก localStorage
- Implement game logic

### 4. Create UI Components

- Room Lobby (with realtime player updates)
- Game Board (with realtime card updates)
- Player Status (with realtime ready status)
- Leaderboard

## 🔒 Security Checklist

- ✅ RLS enabled on all tables
- ✅ Guest access controlled via guest_identifier parameter
- ✅ Authenticated access via get_active_profile_id()
- ✅ Host-only operations (start game, kick players)
- ✅ Player-only operations (view own hand)
- ✅ Public data (leaderboard, room list)
- ✅ Private data (player hands, private rooms)

## 📝 Notes

1. **Guest Identifier**: ใช้ `crypto.randomUUID()` เก็บใน `localStorage`
2. **Profile Linking**: Guest สามารถ link เข้ากับ profile ได้ภายหลัง
3. **Realtime**: ใช้ Supabase Realtime สำหรับ live updates
4. **Security**: ทุก RPC function ตรวจสอบ access permission
5. **Performance**: มี indexes สำหรับ common queries

## 🎮 Game Flow Summary

```
Guest Visit
  ↓
Generate guest_identifier
  ↓
create_or_get_gamer()
  ↓
Browse/Create Room
  ↓
Join Room (realtime subscription)
  ↓
Toggle Ready
  ↓
Host Starts Game
  ↓
Game Session Created
  ↓
Deal Cards
  ↓
Play Turns (realtime moves)
  ↓
Game Ends
  ↓
Save Results
  ↓
Update Stats & ELO
  ↓
Return to Lobby
```

---

**สร้างเมื่อ**: 2025-10-30  
**เวอร์ชัน**: 1.0  
**สถานะ**: Ready for Implementation
