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

## Phase 2: Authentication & User System 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

## Phase 3: Game Core 🔜
> ดูรายละเอียดเพิ่มเติมใน `TODO_FEATURES.md`

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

**Next Steps:**
1. Authentication System (Login, Register, Forgot Password)
2. Game Room System (Lobby, Create Room, Join Room)
3. Tournament System (Browse, Details, Registration)

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
