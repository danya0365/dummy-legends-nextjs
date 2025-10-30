# Dummy Legends - Realtime Game Implementation

## 🎮 ภาพรวมระบบ

ระบบเกม Dummy Legends ได้ถูกสร้างด้วย **Supabase Realtime** เพื่อให้ผู้เล่นสามารถเล่นเกมไพ่ Dummy แบบ multiplayer ได้แบบ realtime

## 🏗️ สถาปัตยกรรม (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│  - GameLobbyView (หน้า lobby)                       │
│  - GameRoomView (หน้าห้องเกม)                       │
│  - gameStore (Zustand state management)             │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Infrastructure Layer                    │
│  - gameRepository (Supabase operations)             │
│  - Realtime subscriptions                           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Supabase Backend                     │
│  - PostgreSQL Database                              │
│  - RPC Functions                                    │
│  - Realtime Channels                                │
│  - Row Level Security (RLS)                         │
└─────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Tables

#### 1. **game_rooms** - ข้อมูลห้องเกม
- `id` (UUID) - Primary key
- `code` (TEXT) - รหัสห้อง 6 หลัก (unique)
- `name` (TEXT) - ชื่อห้อง
- `host_id` (UUID) - เจ้าของห้อง (foreign key → auth.users)
- `status` (room_status) - สถานะห้อง: waiting, ready, playing, finished
- `mode` (game_mode) - โหมดเกม: casual, ranked, tournament, private
- `settings` (JSONB) - การตั้งค่าห้อง
- `current_player_count` (INTEGER) - จำนวนผู้เล่นปัจจุบัน
- `max_player_count` (INTEGER) - จำนวนผู้เล่นสูงสุด (2-4)
- `spectators` (TEXT[]) - รายการผู้ชม
- `created_at`, `started_at`, `finished_at` (TIMESTAMP)

#### 2. **room_players** - ผู้เล่นในห้อง
- `id` (UUID) - Primary key
- `room_id` (UUID) - Foreign key → game_rooms
- `user_id` (UUID) - Foreign key → auth.users
- `profile_id` (UUID) - Foreign key → profiles
- `status` (player_status) - สถานะผู้เล่น: waiting, ready, playing, disconnected
- `is_host` (BOOLEAN) - เป็นเจ้าของห้องหรือไม่
- `is_ready` (BOOLEAN) - พร้อมหรือยัง
- `position` (INTEGER) - ตำแหน่งผู้เล่น (0-3)
- `joined_at`, `left_at` (TIMESTAMP)

#### 3. **game_states** - สถานะเกมระหว่างเล่น
- `id` (UUID) - Primary key
- `room_id` (UUID) - Foreign key → game_rooms (unique)
- `deck` (JSONB) - ไพ่ที่เหลือในกอง
- `discard_pile` (JSONB) - ไพ่ที่ทิ้ง
- `current_turn_user_id` (UUID) - ผู้เล่นที่กำลังเล่น
- `turn_start_time` (TIMESTAMP) - เวลาเริ่มเทิร์น
- `round` (INTEGER) - รอบปัจจุบัน
- `player_hands` (JSONB) - ไพ่บนมือของผู้เล่น
- `player_melds` (JSONB) - ไพ่ที่วางแล้ว
- `scores` (JSONB) - คะแนน

#### 4. **game_actions** - บันทึกการเล่น
- `id` (UUID) - Primary key
- `room_id` (UUID) - Foreign key → game_rooms
- `user_id` (UUID) - Foreign key → auth.users
- `action_type` (TEXT) - ประเภทการเล่น: draw, discard, meld, knock, gin
- `action_data` (JSONB) - ข้อมูลการเล่น
- `created_at` (TIMESTAMP)

#### 5. **player_stats** - สถิติผู้เล่น
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key → auth.users (unique)
- `profile_id` (UUID) - Foreign key → profiles
- `level`, `exp`, `coins`, `rank`, `elo` (INTEGER)
- `games_played`, `games_won`, `games_lost` (INTEGER)
- `win_rate` (DECIMAL)
- `total_score`, `highest_score` (INTEGER)

## 🔧 RPC Functions

### 1. **create_game_room**
สร้างห้องเกมใหม่และเพิ่มเจ้าของห้องเป็นผู้เล่นคนแรก

**Parameters:**
```typescript
{
  p_name: string,
  p_mode: game_mode,
  p_max_players?: number,
  p_bet_amount?: number,
  p_time_limit?: number,
  p_is_private?: boolean,
  p_password?: string,
  p_allow_spectators?: boolean
}
```

**Returns:** Room details (JSON)

### 2. **join_game_room**
เข้าร่วมห้องเกม

**Parameters:**
```typescript
{
  p_room_id?: UUID,
  p_room_code?: string,
  p_password?: string
}
```

**Returns:** Success status (JSON)

### 3. **leave_game_room**
ออกจากห้องเกม (auto reassign host ถ้าเจ้าของห้องออก)

**Parameters:**
```typescript
{
  p_room_id: UUID
}
```

### 4. **toggle_ready_status**
เปลี่ยนสถานะพร้อม/ไม่พร้อม

**Parameters:**
```typescript
{
  p_room_id: UUID
}
```

### 5. **start_game**
เริ่มเกม (เฉพาะ host)

**Parameters:**
```typescript
{
  p_room_id: UUID
}
```

### 6. **get_available_rooms**
ดึงรายการห้องที่เปิดอยู่

**Parameters:**
```typescript
{
  p_mode?: game_mode,
  p_limit?: number
}
```

**Returns:** Array of rooms (JSON)

### 7. **get_room_details**
ดึงข้อมูลห้องพร้อมผู้เล่น

**Parameters:**
```typescript
{
  p_room_id: UUID
}
```

**Returns:** Room with players (JSON)

## 🔐 Row Level Security (RLS)

### Game Rooms
- ✅ ทุกคนดูห้อง public ได้
- ✅ ผู้เล่นในห้องดูห้อง private ได้
- ✅ Authenticated users สร้างห้องได้
- ✅ Host แก้ไขห้องตัวเองได้
- ✅ Host ลบห้องตัวเองได้

### Room Players
- ✅ ทุกคนดูผู้เล่นในห้องที่มองเห็นได้
- ✅ Authenticated users เข้าร่วมห้องได้
- ✅ ผู้เล่นแก้ไขสถานะตัวเองได้
- ✅ ผู้เล่นออกจากห้องได้

### Game States
- ✅ เฉพาะผู้เล่นในห้องดูสถานะเกมได้
- ✅ ผู้เล่นในห้อง update สถานะได้

### Player Stats
- ✅ ทุกคนดูสถิติได้
- ✅ ผู้เล่น update สถิติตัวเองได้

## 📡 Realtime Subscriptions

### Room Updates
```typescript
gameRepository.subscribeToRoom(
  roomId,
  (updatedRoom) => {
    // Handle room updates
  },
  (players) => {
    // Handle player updates
  }
);
```

**Subscribed Events:**
- Room status changes (waiting → ready → playing → finished)
- Room settings changes
- Player join/leave events
- Player ready status changes

### Auto-sync Features
- ✅ ผู้เล่นเข้า-ออกห้อง → update ทันที
- ✅ เปลี่ยนสถานะพร้อม → sync ทันที
- ✅ Host เริ่มเกม → ทุกคนเห็นพร้อมกัน
- ✅ Reconnect support → subscribe ใหม่อัตโนมัติ

## 🎯 การใช้งาน (GameStore)

### สร้างห้อง
```typescript
const { createRoom } = useGameStore();

const room = await createRoom({
  name: "ห้องมือใหม่",
  mode: "casual",
  maxPlayers: 4,
  betAmount: 100,
  timeLimit: 60,
  isPrivate: false,
  allowSpectators: true
});
```

### เข้าร่วมห้อง
```typescript
const { joinRoom } = useGameStore();

// Join by ID
await joinRoom({ roomId: "room-id" });

// Join by code
await joinRoom({ roomCode: "123456" });

// Join private room
await joinRoom({ 
  roomCode: "123456",
  password: "secret"
});
```

### เปลี่ยนสถานะพร้อม
```typescript
const { toggleReady } = useGameStore();
await toggleReady();
```

### เริ่มเกม (Host)
```typescript
const { startGame } = useGameStore();
await startGame();
```

### ออกจากห้อง
```typescript
const { leaveRoom } = useGameStore();
await leaveRoom();
```

### ดูรายการห้อง
```typescript
const { fetchAvailableRooms, availableRooms } = useGameStore();
await fetchAvailableRooms();
```

## 🔄 Lifecycle

```
1. User creates/joins room
   ↓
2. Auto-subscribe to room updates
   ↓
3. Realtime sync for all changes
   ↓
4. Game starts (all players notified)
   ↓
5. Gameplay with realtime updates
   ↓
6. Game ends
   ↓
7. Auto-unsubscribe when leaving
```

## 🚀 Triggers & Auto-functions

### update_room_player_count()
อัพเดทจำนวนผู้เล่นอัตโนมัติเมื่อมีคนเข้า-ออก

### create_player_stats_if_not_exists()
สร้างสถิติผู้เล่นอัตโนมัติเมื่อเล่นครั้งแรก

### update_updated_at_column()
อัพเดท timestamp อัตโนมัติ

## 📱 Frontend Integration

### หน้าที่มีอยู่
- ✅ `/game/lobby` - Lobby หลัก
- ✅ `/game/create-room` - สร้างห้อง
- ✅ `/game/room/[roomId]` - ห้องเกม

### State Management
- **Zustand Store** - จัดการ state ทั้งหมด
- **Realtime Sync** - อัพเดทอัตโนมัติ
- **Error Handling** - จัดการ error ทุก case
- **Loading States** - แสดง loading state ที่เหมาะสม

## ⚡ Performance

### Optimizations
- **Indexed Queries** - สร้าง index ทุก foreign key
- **JSONB Fields** - ใช้ JSONB สำหรับข้อมูลที่ flexible
- **Efficient Subscriptions** - Subscribe เฉพาะห้องที่เข้าร่วม
- **Auto Cleanup** - Unsubscribe อัตโนมัติเมื่อออก

## 🧪 Testing

### วิธีทดสอบ

1. **Start Supabase Local**
```bash
npm run supabase-start
```

2. **Run Migrations**
```bash
npm run supabase-migrate
```

3. **Start Dev Server**
```bash
npm run dev
```

4. **เปิด Browser 2 tabs**
- Tab 1: http://localhost:3001/game/lobby
- Tab 2: http://localhost:3001/game/lobby (incognito)

5. **ทดสอบ Realtime**
- Tab 1: สร้างห้อง
- Tab 2: เข้าห้อง (ดูจาก lobby หรือใช้ room code)
- ทดสอบ ready/unready
- ทดสอบ start game
- ทดสอบ leave room

## 🔒 Security

### Authentication
- ✅ ต้อง login ก่อนสร้าง/เข้าห้อง
- ✅ RLS ป้องกันการเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต

### Authorization
- ✅ เฉพาะ host เริ่มเกมได้
- ✅ เฉพาะผู้เล่นในห้องดูสถานะเกมได้
- ✅ Password protection สำหรับห้อง private

### Data Validation
- ✅ Validate ข้อมูลที่ RPC functions
- ✅ Check permissions ทุก operation
- ✅ Prevent duplicate joins

## 📈 Next Steps

### Phase 4: Game Logic (ต่อไป)
- [ ] Card dealing system
- [ ] Turn management
- [ ] Card play validation
- [ ] Meld/Knock/Gin logic
- [ ] Score calculation
- [ ] Win/Loss detection

### Future Features
- [ ] Matchmaking system
- [ ] ELO ranking
- [ ] Tournament system
- [ ] Replay system
- [ ] Achievements
- [ ] In-game chat
- [ ] Emojis & reactions

## 🐛 Troubleshooting

### ห้องไม่แสดงใน lobby
- ตรวจสอบ RLS policies
- ดูว่าห้องเป็น private หรือไม่
- ตรวจสอบ status = 'waiting'

### Realtime ไม่ทำงาน
- ตรวจสอบ Supabase local running
- ดู browser console สำหรับ errors
- ตรวจสอบ subscription setup

### Database errors
- รัน `npm run supabase-reset` เพื่อ reset database
- ตรวจสอบ migrations ทั้งหมด apply สำเร็จ

## 📚 Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**สร้างโดย:** Marosdee Uma  
**วันที่:** 2025-01-30  
**Project:** Dummy Legends - Multiplayer Card Game
