# TODO - Dummy Legends Project

## Project Overview
Dummy Legends - แพลตฟอร์มแข่งขันเกมไพ่ดัมมี่ออนไลน์ระดับโลก
- เน้นสร้าง UI และ Master Data ก่อน
- ใช้ Mock Data และ Dynamic Data ฝั่ง Client-side ด้วย Zustand
- ทำตาม Clean Architecture และ SOLID Principles
- ทุก page.tsx ต้องทำตาม pattern ใน `/prompt/CREATE_PAGE_PATTERN.md`

## Phase 1: Foundation & Core UI ✅

### 1.1 Project Setup ✅
- [x] Setup project structure
- [x] Install dependencies (Next.js 15, Tailwind CSS, Zustand)
- [x] Setup ThemeProvider
- [x] Configure Metadata (SEO)

### 1.2 Main Layout & Navigation ✅
- [x] Create MainLayout component with:
  - [x] Header with navigation menu
  - [x] Footer with social links & info
  - [x] Theme toggle button (dark/light mode)
  - [x] Responsive mobile menu
  - [x] User profile dropdown (for authenticated users)
- [x] Create navigation data/structure
- [x] Implement smooth scroll and active link highlighting

### 1.3 Landing Page (Home) ✅
- [x] Hero Section with:
  - [x] Eye-catching headline
  - [x] CTA buttons (เข้าสู่ระบบ, สมัครสมาชิก, เล่นเป็นแขก)
  - [x] Animated background/cards
- [x] Features Section:
  - [x] แข่งขันทัวร์นาเมนต์
  - [x] ระบบจัดอันดับ
  - [x] คอมมูนิตี้
  - [x] รางวัล
- [x] Statistics Section (จำนวนผู้เล่น, การแข่งขัน, รางวัลที่แจก)
- [x] Latest Tournaments Section
- [x] Top Players Section
- [x] Testimonials Section
- [x] Create master data for landing page
- [x] Create mock data for landing page

## Phase 2: Authentication & User System ✅

### 2.1 Authentication Store (Zustand) ✅
- [x] Create auth types and interfaces
- [x] Setup Zustand store with persist middleware
- [x] Login action with validation
- [x] Register action with validation
- [x] Logout action
- [x] Forgot password action
- [x] Update user action
- [x] Error handling

### 2.2 Authentication Pages ✅
- [x] Login page with form validation
- [x] Register page with password strength indicator
- [x] Forgot password page with success state
- [x] Form error handling
- [x] Loading states
- [x] Dark mode support

### 2.3 Header Integration ✅
- [x] User menu dropdown
- [x] Profile links
- [x] Logout functionality
- [x] Mobile responsive
- [x] Authenticated/Unauthenticated states

## Phase 3: Game Core 🔄

### 3.1 Game Foundation ✅
- [x] Create game types and interfaces
- [x] Setup Game Store with Zustand
- [x] Create mock game data (6 rooms)
- [x] Room management actions
- [x] Player management
- [x] Error handling

### 3.2 Game Lobby System ✅
- [x] Game Lobby View with room list
- [x] Search and filter functionality
- [x] Room cards with details
- [x] Join room with password support
- [x] Create room button
- [x] Refresh functionality
- [x] Empty state handling
- [x] Loading states

### 3.3 Room Management 🔄
- [ ] Create Room page
- [ ] Join Room by code
- [ ] Game Room (Waiting Room)
- [ ] Ready system
- [ ] Start game (host only)

## Phase 4: Tournament System 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

## Phase 5: Leaderboard System 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

## Phase 6: Community System 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

## Phase 7: Advanced Features 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

---

## Current Priority
~~1. MainLayout with Header, Footer, Theme Toggle~~ ✅ เสร็จสิ้น
~~2. Landing Page with Master Data และ Mock Data~~ ✅ เสร็จสิ้น
~~3. Authentication System (Login, Register, Forgot Password)~~ ✅ เสร็จสิ้น
~~4. Game Lobby System~~ ✅ เสร็จสิ้น

**Next Steps (Phase 3: Game Core - ต่อ):**
1. Create Room Page & Functionality
2. Game Room (Waiting Room) UI
3. Ready System & Start Game

## Notes
- ✅ = Completed
- 🔄 = In Progress
- 🔜 = Planned
- ⏳ = Current Phase
- ❌ = Blocked/Issues

## Architecture Rules
1. ทุก page ต้องทำตาม pattern ใน `/prompt/CREATE_PAGE_PATTERN.md`
2. ใช้ Clean Architecture (Presenter → View → Hook pattern)
3. State management ด้วย Zustand
4. UI ด้วย Tailwind CSS
5. TypeScript strict mode
6. Mock data ก่อน เชื่อม Supabase ทีหลัง
