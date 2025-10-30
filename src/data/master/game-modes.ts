export interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  timeControl: string;
  minPlayers: number;
  maxPlayers: number;
  isAvailable: boolean;
}

export const GAME_MODES: GameMode[] = [
  {
    id: "blitz",
    name: "Blitz",
    description: "เกมรวดเร็ว 3-5 นาทีต่อฝ่าย",
    icon: "⚡",
    timeControl: "3+0",
    minPlayers: 2,
    maxPlayers: 2,
    isAvailable: true,
  },
  {
    id: "rapid",
    name: "Rapid",
    description: "เกมกลาง 10-15 นาทีต่อฝ่าย",
    icon: "🎯",
    timeControl: "10+0",
    minPlayers: 2,
    maxPlayers: 2,
    isAvailable: true,
  },
  {
    id: "classical",
    name: "Classical",
    description: "เกมมาตรฐาน 30+ นาทีต่อฝ่าย",
    icon: "♔",
    timeControl: "30+0",
    minPlayers: 2,
    maxPlayers: 2,
    isAvailable: true,
  },
  {
    id: "daily",
    name: "Daily",
    description: "เกมแบบทีละตา 1 วันต่อตา",
    icon: "📅",
    timeControl: "1 day",
    minPlayers: 2,
    maxPlayers: 2,
    isAvailable: true,
  },
  {
    id: "puzzle",
    name: "Puzzle",
    description: "ฝึกทักษะด้วยปริศนาหมากรุก",
    icon: "🧩",
    timeControl: "No limit",
    minPlayers: 1,
    maxPlayers: 1,
    isAvailable: true,
  },
  {
    id: "ai",
    name: "vs AI",
    description: "เล่นกับคอมพิวเตอร์",
    icon: "🤖",
    timeControl: "Custom",
    minPlayers: 1,
    maxPlayers: 1,
    isAvailable: true,
  },
];
