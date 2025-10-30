export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "game" | "tournament" | "social" | "learning";
}

export const FEATURES: Feature[] = [
  {
    id: "online-play",
    title: "เล่นออนไลน์",
    description: "เล่นหมากรุกกับผู้เล่นจากทั่วโลกได้ตลอด 24 ชั่วโมง",
    icon: "🌐",
    category: "game",
  },
  {
    id: "tournaments",
    title: "ทัวร์นาเม้นต์",
    description: "เข้าร่วมการแข่งขันระดับโลก ชิงรางวัลและตำแหน่ง",
    icon: "🏆",
    category: "tournament",
  },
  {
    id: "leaderboard",
    title: "อันดับโลก",
    description: "ติดตามอันดับและคะแนนของคุณในระดับโลก",
    icon: "📊",
    category: "tournament",
  },
  {
    id: "analysis",
    title: "วิเคราะห์เกม",
    description: "เครื่องมือวิเคราะห์เกมด้วย AI เพื่อพัฒนาทักษะ",
    icon: "🔍",
    category: "learning",
  },
  {
    id: "community",
    title: "ชุมชน",
    description: "พบปะผู้เล่น แบ่งปันความรู้ และเรียนรู้ร่วมกัน",
    icon: "👥",
    category: "social",
  },
  {
    id: "lessons",
    title: "บทเรียน",
    description: "เรียนรู้จากบทเรียนและกลยุทธ์จากผู้เชี่ยวชาญ",
    icon: "📚",
    category: "learning",
  },
  {
    id: "puzzles",
    title: "ปริศนา",
    description: "ฝึกทักษะด้วยปริศนาหมากรุกหลายระดับความยาก",
    icon: "🧩",
    category: "learning",
  },
  {
    id: "mobile",
    title: "เล่นบนมือถือ",
    description: "รองรับการเล่นบนมือถือและแท็บเล็ตทุกระบบ",
    icon: "📱",
    category: "game",
  },
];
