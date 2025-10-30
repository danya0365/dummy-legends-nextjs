/**
 * Mock Data สำหรับ Leaderboard System
 */

import type { PlayerRank } from "@/src/domain/types/leaderboard.types";

const generatePlayerName = (rank: number): { username: string; displayName: string } => {
  const names = [
    { username: "card_master_99", displayName: "เซียนไพ่ 99" },
    { username: "lucky_ace_777", displayName: "โชคดี 777" },
    { username: "pro_player_01", displayName: "มือโปร 01" },
    { username: "dummy_king", displayName: "ราชาดัมมี่" },
    { username: "ace_hunter", displayName: "นักล่าเอซ" },
    { username: "card_wizard", displayName: "จอมเวทย์ไพ่" },
    { username: "golden_hand", displayName: "มือทอง" },
    { username: "strategic_mind", displayName: "ยุทธวิธี" },
    { username: "speed_demon", displayName: "ปีศาจความเร็ว" },
    { username: "patience_master", displayName: "ปรมาจารย์อดทน" },
    { username: "lucky_streak", displayName: "โชคเฮง" },
    { username: "card_counter", displayName: "นักนับไพ่" },
    { username: "risk_taker", displayName: "ผู้กล้าเสี่ยง" },
    { username: "calm_player", displayName: "ใจเย็น" },
    { username: "tournament_beast", displayName: "เจ้าทัวร์นาเมนต์" },
    { username: "comeback_king", displayName: "ราชากลับชาติ" },
    { username: "consistent_pro", displayName: "มือโปรต่อเนื่อง" },
    { username: "bluff_master", displayName: "นักหลอก" },
    { username: "sharp_eye", displayName: "ตาแหลม" },
    { username: "rising_star", displayName: "ดาวรุ่ง" },
  ];

  if (rank <= names.length) {
    return names[rank - 1];
  }

  return {
    username: `player_${rank}`,
    displayName: `ผู้เล่น ${rank}`,
  };
};

export const mockLeaderboard: PlayerRank[] = Array.from({ length: 100 }, (_, index) => {
  const rank = index + 1;
  const { username, displayName } = generatePlayerName(rank);
  
  // Calculate stats based on rank (higher rank = better stats)
  const baseElo = 2500 - (rank - 1) * 15;
  const gamesPlayed = Math.floor(Math.random() * 500) + 100;
  const winRatePercent = Math.max(45, 85 - (rank - 1) * 0.3);
  const gamesWon = Math.floor((gamesPlayed * winRatePercent) / 100);
  const gamesLost = gamesPlayed - gamesWon;

  return {
    rank,
    previousRank: rank === 1 ? 1 : rank + Math.floor(Math.random() * 5) - 2,
    userId: `user-${String(rank).padStart(3, "0")}`,
    username,
    displayName,
    avatar: null,
    level: Math.min(100, Math.floor(50 + (100 - rank) / 2)),
    
    // ELO and games
    elo: baseElo + Math.floor(Math.random() * 30) - 15,
    gamesPlayed,
    gamesWon,
    gamesLost,
    winRate: parseFloat(winRatePercent.toFixed(2)),
    
    // Tournament stats
    tournamentsPlayed: Math.floor(Math.random() * 30) + 5,
    tournamentsWon: rank <= 20 ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3),
    tournamentTop3: rank <= 20 ? Math.floor(Math.random() * 10) + 3 : Math.floor(Math.random() * 5),
    
    // Earnings
    totalEarnings: Math.floor((100 - rank) * 10000 + Math.random() * 50000),
    
    // Streaks
    currentWinStreak: Math.floor(Math.random() * 10),
    longestWinStreak: Math.floor(Math.random() * 25) + 5,
    
    // Last active
    lastActiveAt: new Date(
      Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
    ).toISOString(),
  };
});

// Top 10 players for quick access
export const mockTopPlayers = mockLeaderboard.slice(0, 10);

// Stats summary
export const mockLeaderboardStats = {
  totalPlayers: mockLeaderboard.length,
  averageElo: Math.floor(
    mockLeaderboard.reduce((sum, p) => sum + p.elo, 0) / mockLeaderboard.length
  ),
  topElo: mockLeaderboard[0].elo,
  mostActivePlayer: mockLeaderboard[0].displayName,
  totalGamesPlayed: mockLeaderboard.reduce((sum, p) => sum + p.gamesPlayed, 0),
};

export const leaderboardMockData = {
  rankings: mockLeaderboard,
  topPlayers: mockTopPlayers,
  stats: mockLeaderboardStats,
};
