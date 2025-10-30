# TODO FEATURES - Dummy Legends Detailed Features

## Phase 2: Authentication & User System

### 2.1 Authentication Pages
- [ ] `/auth/login` - หน้าเข้าสู่ระบบ
  - Email/Password login
  - Social login (Google, Facebook, Line)
  - Remember me
  - Forgot password link
- [ ] `/auth/register` - หน้าสมัครสมาชิก
  - Username, Email, Password
  - Terms & Conditions acceptance
  - Email verification
- [ ] `/auth/forgot-password` - หน้าขอรหัสผ่านใหม่
- [ ] `/auth/reset-password` - หน้าตั้งรหัสผ่านใหม่
- [ ] `/auth/verify-email` - หน้ายืนยันอีเมล

### 2.2 User Profile System
- [ ] `/profile` - โปรไฟล์ผู้เล่น
  - Avatar/Profile picture upload
  - Display name, bio
  - Stats (games played, win rate, ranking)
  - Achievements/Badges
  - Match history
- [ ] `/profile/settings` - ตั้งค่าบัญชี
  - Change password
  - Email preferences
  - Notification settings
  - Privacy settings
  - Delete account
- [ ] `/profile/[userId]` - ดูโปรไฟล์ผู้เล่นอื่น

### 2.3 Authentication Store (Zustand)
- [ ] User state management
- [ ] Login/Logout actions
- [ ] Token management
- [ ] Guest mode support

---

## Phase 3: Game Core

### 3.1 Game Room System
- [ ] `/game/lobby` - ล็อบบี้เกม
  - Quick match
  - Create private room
  - Join room by code
  - Active rooms list
- [ ] `/game/room/[roomId]` - ห้องเกม
  - Waiting room (2-4 players)
  - Ready/Not Ready
  - Chat system
  - Room settings (bet amount, time limit)
  - Start game

### 3.2 Dummy Game Play
- [ ] `/game/play/[gameId]` - หน้าเล่นเกม
  - **Card Display**: แสดงไพ่บนมือ (13 ใบ)
  - **Card Sorting**: จัดเรียงไพ่ (by suit, by rank)
  - **Draw Card**: จั่วไพ่จากกอง/เปิดกอง
  - **Discard Card**: ทิ้งไพ่
  - **Meld Cards**: วางหน้าไพ่ (Set/Run)
  - **Lay Off**: วางเพิ่มบนชุดไพ่ที่วางแล้ว
  - **Knock/Gin**: เคาะจบเกม
  - **Timer**: เวลานับถอยหลัง
  - **Opponent Display**: แสดงจำนวนไพ่ของฝ่ายตรงข้าม
  - **Score Board**: คะแนนแต่ละรอบ
  - **Game Log**: ประวัติการเล่นในเกม
  - **Leave/Surrender Button**: ออกจากเกม

### 3.3 Game Rules & Variations
- [ ] Classic Dummy (ดัมมี่แบบคลาสสิก)
- [ ] Tournament Rules (กติกาแข่งขัน)
- [ ] Custom Rules (กติกาที่กำหนดเอง)
- [ ] Rule explanation pages

### 3.4 Game Store (Zustand)
- [ ] Game state management
- [ ] Player actions
- [ ] Card management
- [ ] Turn management
- [ ] Score calculation

---

## Phase 4: Tournament System

### 4.1 Tournament Browse
- [ ] `/tournaments` - รายการทัวร์นาเมนต์
  - Filter by: status, entry fee, prize pool
  - Search tournaments
  - Sort by: date, prize, popularity
  - Featured tournaments
  - Upcoming tournaments
  - Live tournaments
  - Completed tournaments

### 4.2 Tournament Details
- [ ] `/tournaments/[tournamentId]` - รายละเอียดทัวร์นาเมนต์
  - Tournament info (name, description, rules)
  - Prize pool breakdown
  - Entry fee
  - Schedule (start date, end date)
  - Format (single elimination, double elimination, round robin)
  - Number of participants (current/max)
  - Participants list
  - Bracket visualization
  - Live matches
  - Results/Standings
  - Register/Unregister button

### 4.3 Tournament Creation
- [ ] `/tournaments/create` - สร้างทัวร์นาเมนต์
  - Basic info (name, description, image)
  - Format selection
  - Entry fee & prize pool
  - Schedule settings
  - Participant limits
  - Rules & requirements
  - Visibility (public/private)

### 4.4 Tournament Management (for organizers)
- [ ] `/tournaments/[tournamentId]/manage` - จัดการทัวร์นาเมนต์
  - View participants
  - Start tournament
  - Generate brackets
  - Manage matches
  - Update results
  - Handle disputes
  - Cancel tournament

### 4.5 Tournament Types
- [ ] Quick Tournament (รอบเดียว)
- [ ] Knockout Tournament (แบบน็อกเอาท์)
- [ ] Round Robin (แบบพบกันหมดทุกคู่)
- [ ] Swiss System (แบบสวิส)
- [ ] League System (แบบลีก)

### 4.6 Tournament Store (Zustand)
- [ ] Tournament list state
- [ ] Tournament details state
- [ ] Registration management
- [ ] Bracket state

---

## Phase 5: Leaderboard System

### 5.1 Global Leaderboard
- [ ] `/leaderboard` - อันดับผู้เล่น
  - Overall ranking
  - Filter by: timeframe (all-time, monthly, weekly)
  - Filter by: game mode
  - Top 100 display
  - Your rank display
  - Points/ELO system

### 5.2 Leaderboard Categories
- [ ] Win Rate Leaders
- [ ] Most Games Played
- [ ] Tournament Champions
- [ ] Highest Win Streak
- [ ] Best Tournament Performance

### 5.3 Ranking Store (Zustand)
- [ ] Leaderboard data
- [ ] User rank tracking
- [ ] Rank history

---

## Phase 6: Community System

### 6.1 Social Features
- [ ] `/community` - หน้าคอมมูนิตี้
  - Feed/Timeline
  - Post creation (text, images, game highlights)
  - Like, comment, share
  - Follow system

### 6.2 Friends System
- [ ] `/friends` - รายการเพื่อน
  - Friends list
  - Add friend
  - Friend requests
  - Block users
  - Invite to game

### 6.3 Chat System
- [ ] Private messages
- [ ] Group chat
- [ ] Room chat
- [ ] Emojis & stickers

### 6.4 Guilds/Clubs
- [ ] `/guilds` - กิลด์/ชมรม
  - Create guild
  - Join guild
  - Guild chat
  - Guild tournaments
  - Guild ranking

### 6.5 Community Store (Zustand)
- [ ] Social feed state
- [ ] Friends list
- [ ] Chat messages
- [ ] Guild data

---

## Phase 7: Advanced Features

### 7.1 Rewards & Achievements
- [ ] `/rewards` - ของรางวัล
  - Daily login rewards
  - Achievement system
  - Badges/Titles
  - Coins/Currency system
  - Shop (avatars, card backs, emojis)

### 7.2 Statistics & Analytics
- [ ] `/stats` - สถิติ
  - Personal statistics
  - Game history
  - Win/Loss charts
  - Performance analysis
  - Comparison with others

### 7.3 Spectator Mode
- [ ] Watch live games
- [ ] Replay system
- [ ] Highlight clips

### 7.4 VIP/Premium System
- [ ] `/premium` - สมาชิกพิเศษ
  - Premium features
  - Subscription plans
  - Payment integration
  - Premium tournaments
  - Exclusive rewards

### 7.5 Admin Panel
- [ ] `/admin/dashboard` - แดชบอร์ด
- [ ] `/admin/users` - จัดการผู้ใช้
- [ ] `/admin/tournaments` - จัดการทัวร์นาเมนต์
- [ ] `/admin/reports` - รายงาน
- [ ] `/admin/settings` - ตั้งค่าระบบ

### 7.6 Notifications System
- [ ] In-app notifications
- [ ] Email notifications
- [ ] Push notifications
- [ ] Notification preferences

### 7.7 Help & Support
- [ ] `/help` - ศูนย์ช่วยเหลือ
  - FAQ
  - Game rules tutorial
  - Contact support
  - Report bugs
  - Report users

### 7.8 Marketing Pages
- [ ] `/about` - เกี่ยวกับเรา
- [ ] `/terms` - ข้อกำหนดการใช้งาน
- [ ] `/privacy` - นโยบายความเป็นส่วนตัว
- [ ] `/blog` - บล็อก/ข่าวสาร

---

## Game Features Inspiration (World-Class Standards)

### Core Gameplay
- ✅ Real-time multiplayer (2-4 players)
- ✅ Matchmaking system (skill-based)
- ✅ Private rooms with invite codes
- ✅ Spectator mode
- ✅ Replay system
- ✅ Tutorial mode for beginners

### Competitive Features
- ✅ ELO/MMR ranking system
- ✅ Seasonal rankings
- ✅ Tournament bracket system
- ✅ Prize pool distribution
- ✅ Live tournament streaming
- ✅ Tournament history & stats

### Social Features
- ✅ Friends & guilds
- ✅ In-game chat
- ✅ Emojis & reactions
- ✅ Social feed
- ✅ Achievement sharing
- ✅ Challenge friends

### Monetization (Optional)
- ✅ Premium membership
- ✅ Cosmetic items (cards, avatars)
- ✅ Tournament entry fees
- ✅ VIP tournaments
- ✅ Ad-free experience

### Technical Features
- ✅ Real-time sync (WebSocket/Supabase Realtime)
- ✅ Mobile responsive
- ✅ Offline mode (practice)
- ✅ Auto-save game state
- ✅ Cross-device sync
- ✅ Performance optimization

### Quality of Life
- ✅ Dark/Light theme
- ✅ Multiple languages (TH/EN)
- ✅ Sound effects & music
- ✅ Keyboard shortcuts
- ✅ Customizable settings
- ✅ Accessibility features

---

## Master Data Structure

### User Data
```typescript
- id: UUID
- username: string
- email: string
- displayName: string
- avatar: string
- bio: string
- level: number
- exp: number
- coins: number
- rank: number
- elo: number
- gamesPlayed: number
- gamesWon: number
- winRate: number
- createdAt: Date
```

### Tournament Data
```typescript
- id: UUID
- name: string
- description: string
- image: string
- format: TournamentFormat
- status: TournamentStatus
- entryFee: number
- prizePool: number
- maxParticipants: number
- currentParticipants: number
- startDate: Date
- endDate: Date
- rules: TournamentRules
- createdBy: UUID
```

### Game Data
```typescript
- id: UUID
- roomId: UUID
- tournamentId?: UUID
- players: Player[]
- status: GameStatus
- currentTurn: number
- deck: Card[]
- discardPile: Card[]
- rounds: GameRound[]
- winner?: UUID
- startedAt: Date
- finishedAt?: Date
```

### Leaderboard Data
```typescript
- rank: number
- userId: UUID
- username: string
- avatar: string
- points: number
- gamesPlayed: number
- winRate: number
- change: number (rank change)
```

---

## Mock Data Requirements

### Landing Page Mock Data
- 6-8 Featured tournaments
- Top 10 players
- 3-5 Testimonials
- Site statistics (users, games, tournaments)

### Tournament List Mock Data
- 20+ sample tournaments
- Various formats and prize pools
- Different statuses (upcoming, live, completed)

### Leaderboard Mock Data
- 100+ sample players
- Realistic stats distribution
- Various ranks and points

### Game Room Mock Data
- Sample active rooms
- Various bet amounts
- Different player counts

---

## Next Steps After Foundation
1. Setup Supabase (Database, Auth, Realtime)
2. Implement real authentication
3. Connect to real database
4. Add WebSocket for real-time gameplay
5. Payment integration
6. Deployment & DevOps
