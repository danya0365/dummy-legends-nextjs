/**
 * Leaderboard Types for Dummy Legends
 */

export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all-time";
export type LeaderboardCategory = "elo" | "wins" | "tournaments" | "earnings";

export interface PlayerRank {
  rank: number;
  previousRank: number | null;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  level: number;
  
  // Statistics
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  
  // Tournament stats
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentTop3: number;
  
  // Earnings
  totalEarnings: number;
  
  // Streaks
  currentWinStreak: number;
  longestWinStreak: number;
  
  // Last active
  lastActiveAt: string;
}

export interface PlayerProfile extends PlayerRank {
  // Extended profile data
  bio: string | null;
  country: string | null;
  
  // Detailed statistics
  averageGameDuration: number; // minutes
  fastestWin: number; // minutes
  totalPlayTime: number; // hours
  
  // Per game type
  casualStats: {
    played: number;
    won: number;
    winRate: number;
  };
  rankedStats: {
    played: number;
    won: number;
    winRate: number;
  };
  tournamentStats: {
    played: number;
    won: number;
    winRate: number;
  };
  
  // Achievements
  achievements: Achievement[];
  
  // Recent matches
  recentMatches: RecentMatch[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: string | null;
  progress?: number;
  requirement?: number;
}

export interface RecentMatch {
  id: string;
  opponentName: string;
  opponentElo: number;
  result: "win" | "loss";
  eloChange: number;
  mode: "casual" | "ranked" | "tournament";
  duration: number; // minutes
  playedAt: string;
}

export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  category?: LeaderboardCategory;
  country?: string;
  minLevel?: number;
  maxLevel?: number;
}

export interface LeaderboardState {
  rankings: PlayerRank[];
  currentPlayer: PlayerProfile | null;
  topPlayers: PlayerRank[]; // Top 10
  isLoading: boolean;
  error: string | null;
  filters: LeaderboardFilters;
}

export interface LeaderboardStats {
  totalPlayers: number;
  averageElo: number;
  topElo: number;
  mostActivePlayer: string;
  totalGamesPlayed: number;
}
