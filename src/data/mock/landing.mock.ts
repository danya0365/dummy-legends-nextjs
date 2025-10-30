/**
 * Mock Data สำหรับ Landing Page
 */

export interface LandingStats {
  totalPlayers: number;
  activeTournaments: number;
  totalPrizePool: number;
  gamesPlayed: number;
}

export interface FeaturedTournament {
  id: string;
  name: string;
  description: string;
  image: string;
  prizePool: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  status: "upcoming" | "live" | "completed";
  format: string;
}

export interface TopPlayer {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  points: number;
  gamesPlayed: number;
  winRate: number;
  level: number;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Site Statistics
export const landingStats: LandingStats = {
  totalPlayers: 125430,
  activeTournaments: 45,
  totalPrizePool: 2500000,
  gamesPlayed: 1845200,
};

// Featured Tournaments
export const featuredTournaments: FeaturedTournament[] = [
  {
    id: "tour-001",
    name: "Dummy Championship 2024",
    description: "การแข่งขันชิงแชมป์ประจำปี รางวัลรวมสูงสุด!",
    image: "/images/tournaments/championship-2024.jpg",
    prizePool: 500000,
    entryFee: 500,
    maxParticipants: 128,
    currentParticipants: 96,
    startDate: "2024-12-01T10:00:00",
    status: "upcoming",
    format: "Single Elimination",
  },
  {
    id: "tour-002",
    name: "Weekly Masters",
    description: "ทัวร์นาเมนต์รายสัปดาห์สำหรับมือโปร",
    image: "/images/tournaments/weekly-masters.jpg",
    prizePool: 100000,
    entryFee: 200,
    maxParticipants: 64,
    currentParticipants: 58,
    startDate: "2024-11-05T14:00:00",
    status: "live",
    format: "Double Elimination",
  },
  {
    id: "tour-003",
    name: "Newbie Cup",
    description: "ทัวร์นาเมนต์สำหรับผู้เล่นใหม่ ไม่มีค่าสมัคร",
    image: "/images/tournaments/newbie-cup.jpg",
    prizePool: 50000,
    entryFee: 0,
    maxParticipants: 256,
    currentParticipants: 187,
    startDate: "2024-11-10T16:00:00",
    status: "upcoming",
    format: "Swiss System",
  },
  {
    id: "tour-004",
    name: "Speed Dummy Challenge",
    description: "แข่งแบบสปีด 5 นาทีต่อเกม!",
    image: "/images/tournaments/speed-challenge.jpg",
    prizePool: 75000,
    entryFee: 100,
    maxParticipants: 128,
    currentParticipants: 112,
    startDate: "2024-11-08T18:00:00",
    status: "upcoming",
    format: "Round Robin",
  },
  {
    id: "tour-005",
    name: "VIP Tournament",
    description: "ทัวร์นาเมนต์พิเศษสำหรับสมาชิก VIP",
    image: "/images/tournaments/vip-tournament.jpg",
    prizePool: 200000,
    entryFee: 1000,
    maxParticipants: 32,
    currentParticipants: 28,
    startDate: "2024-11-15T20:00:00",
    status: "upcoming",
    format: "Single Elimination",
  },
  {
    id: "tour-006",
    name: "Team Battle Royale",
    description: "แข่งแบบทีม 2 vs 2",
    image: "/images/tournaments/team-battle.jpg",
    prizePool: 150000,
    entryFee: 300,
    maxParticipants: 64,
    currentParticipants: 52,
    startDate: "2024-11-12T15:00:00",
    status: "upcoming",
    format: "Team Knockout",
  },
];

// Top Players Leaderboard
export const topPlayers: TopPlayer[] = [
  {
    rank: 1,
    userId: "user-001",
    username: "DummyKing",
    displayName: "ราชาดัมมี่",
    avatar: "/images/avatars/user-001.jpg",
    points: 9850,
    gamesPlayed: 1250,
    winRate: 78.5,
    level: 99,
  },
  {
    rank: 2,
    userId: "user-002",
    username: "CardMaster",
    displayName: "เซียนไพ่",
    avatar: "/images/avatars/user-002.jpg",
    points: 9420,
    gamesPlayed: 1180,
    winRate: 76.2,
    level: 95,
  },
  {
    rank: 3,
    userId: "user-003",
    username: "ProPlayer123",
    displayName: "มือโปร 123",
    avatar: "/images/avatars/user-003.jpg",
    points: 9180,
    gamesPlayed: 1050,
    winRate: 74.8,
    level: 92,
  },
  {
    rank: 4,
    userId: "user-004",
    username: "LuckyAce",
    displayName: "เอซโชคดี",
    avatar: "/images/avatars/user-004.jpg",
    points: 8950,
    gamesPlayed: 980,
    winRate: 73.1,
    level: 88,
  },
  {
    rank: 5,
    userId: "user-005",
    username: "ThaiChamp",
    displayName: "แชมป์ไทย",
    avatar: "/images/avatars/user-005.jpg",
    points: 8720,
    gamesPlayed: 920,
    winRate: 71.5,
    level: 85,
  },
  {
    rank: 6,
    userId: "user-006",
    username: "SpeedPlayer",
    displayName: "สายสปีด",
    avatar: "/images/avatars/user-006.jpg",
    points: 8500,
    gamesPlayed: 1100,
    winRate: 70.2,
    level: 82,
  },
  {
    rank: 7,
    userId: "user-007",
    username: "StrategyGuru",
    displayName: "กูรูกลยุทธ์",
    avatar: "/images/avatars/user-007.jpg",
    points: 8280,
    gamesPlayed: 850,
    winRate: 69.8,
    level: 80,
  },
  {
    rank: 8,
    userId: "user-008",
    username: "NightOwl",
    displayName: "นกฮูกราตรี",
    avatar: "/images/avatars/user-008.jpg",
    points: 8050,
    gamesPlayed: 890,
    winRate: 68.5,
    level: 78,
  },
  {
    rank: 9,
    userId: "user-009",
    username: "RisingStar",
    displayName: "ดาวรุ่ง",
    avatar: "/images/avatars/user-009.jpg",
    points: 7850,
    gamesPlayed: 780,
    winRate: 67.9,
    level: 75,
  },
  {
    rank: 10,
    userId: "user-010",
    username: "CardShark",
    displayName: "ฉลามไพ่",
    avatar: "/images/avatars/user-010.jpg",
    points: 7620,
    gamesPlayed: 820,
    winRate: 66.4,
    level: 72,
  },
];

// Testimonials
export const testimonials: Testimonial[] = [
  {
    id: "test-001",
    name: "สมชาย ใจดี",
    avatar: "/images/testimonials/user-1.jpg",
    role: "Pro Player",
    rating: 5,
    comment:
      "Dummy Legends เป็นแพลตฟอร์มที่ดีที่สุดสำหรับการแข่งขันดัมมี่ออนไลน์ ระบบลื่นไหล ไม่มีแลค และที่สำคัญคือมีทัวร์นาเมนต์ให้เล่นตลอด!",
    createdAt: "2024-10-15T10:30:00",
  },
  {
    id: "test-002",
    name: "วรรณา เก่งการด",
    avatar: "/images/testimonials/user-2.jpg",
    role: "Tournament Champion",
    rating: 5,
    comment:
      "ชนะแชมป์ทัวร์นาเมนต์หลายครั้งแล้ว รางวัลจ่ายตรงเวลา และระบบจัดการดีมาก แนะนำเลยค่ะ!",
    createdAt: "2024-10-20T14:20:00",
  },
  {
    id: "test-003",
    name: "ประเสริฐ มั่นคง",
    avatar: "/images/testimonials/user-3.jpg",
    role: "Community Leader",
    rating: 5,
    comment:
      "ระบบคอมมูนิตี้ทำได้ดีมาก สามารถคุยกับเพื่อนๆ นักดัมมี่ทั่วประเทศได้ และยังมีระบบการสอนให้กับมือใหม่ด้วย",
    createdAt: "2024-10-25T16:45:00",
  },
  {
    id: "test-004",
    name: "นันทิดา ชาญฉลาด",
    avatar: "/images/testimonials/user-4.jpg",
    role: "Casual Player",
    rating: 4,
    comment:
      "เล่นสนุกมากค่ะ เริ่มต้นง่าย มีโหมดฝึกซ้อมให้ และมีคนเล่นเยอะ หาคู่แข่งได้ตลอดเวลา",
    createdAt: "2024-10-28T09:15:00",
  },
  {
    id: "test-005",
    name: "อนุชา ชัยสงคราม",
    avatar: "/images/testimonials/user-5.jpg",
    role: "Streamer",
    rating: 5,
    comment:
      "เป็นแพลตฟอร์มที่เหมาะสำหรับการสตรีมมาก มีระบบ spectator mode ที่ทำงานได้ดีและรองรับการถ่ายทอดสด",
    createdAt: "2024-10-29T20:00:00",
  },
];

// Export all mock data
export const landingMockData = {
  stats: landingStats,
  featuredTournaments,
  topPlayers,
  testimonials,
};
