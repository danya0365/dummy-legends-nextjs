export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "game" | "tournament" | "social" | "reward";
}

export const FEATURES: Feature[] = [
  {
    id: "online-play",
    title: "เล่นออนไลน์แบบเรียลไทม์",
    description: "เล่นเกมไพ่ดัมมี่กับผู้เล่นจากทั่วประเทศได้ตลอด 24 ชั่วโมง",
    icon: "🃏",
    category: "game",
  },
  {
    id: "tournaments",
    title: "ทัวร์นาเมนต์ระดับโปร",
    description: "เข้าร่วมการแข่งขันระดับประเทศและนานาชาติ ชิงรางวัลเงินสดมูลค่าสูง",
    icon: "🏆",
    category: "tournament",
  },
  {
    id: "leaderboard",
    title: "ระบบจัดอันดับ",
    description: "ติดตามอันดับและคะแนนของคุณ แข่งขันกับผู้เล่นชั้นนำ",
    icon: "📊",
    category: "tournament",
  },
  {
    id: "matchmaking",
    title: "จับคู่อัตโนมัติ",
    description: "ระบบจับคู่คู่แข่งอัจฉริยะตามระดับทักษะและ ELO Rating",
    icon: "🎯",
    category: "game",
  },
  {
    id: "community",
    title: "คอมมูนิตี้",
    description: "พบปะผู้เล่น แชร์ประสบการณ์ และสร้างกิลด์ร่วมกัน",
    icon: "👥",
    category: "social",
  },
  {
    id: "live-streaming",
    title: "ถ่ายทอดสดการแข่งขัน",
    description: "ชมการแข่งขันสดและเรียนรู้เทคนิคจากมือโปร",
    icon: "📺",
    category: "social",
  },
  {
    id: "rewards",
    title: "รางวัลและความสำเร็จ",
    description: "รับรางวัลจากการเล่น ปลดล็อคความสำเร็จและเหรียญตรา",
    icon: "🎁",
    category: "reward",
  },
  {
    id: "mobile",
    title: "เล่นได้ทุกที่",
    description: "รองรับการเล่นบนมือถือ แท็บเล็ต และคอมพิวเตอร์",
    icon: "📱",
    category: "game",
  },
];
