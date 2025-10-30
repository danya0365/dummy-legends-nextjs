/**
 * Tournament Types for Dummy Legends
 */

export type TournamentStatus = "upcoming" | "registration" | "ongoing" | "completed" | "cancelled";
export type TournamentFormat = "single-elimination" | "double-elimination" | "round-robin" | "swiss";
export type BracketStatus = "pending" | "active" | "completed";
export type MatchStatus = "pending" | "ongoing" | "completed" | "cancelled";

export interface TournamentParticipant {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  level: number;
  elo: number;
  seed: number; // Tournament seeding
  registeredAt: string;
  status: "registered" | "checked-in" | "playing" | "eliminated" | "winner";
}

export interface TournamentPrize {
  rank: number;
  prize: number;
  title?: string;
}

export interface TournamentRules {
  minLevel: number;
  maxLevel: number;
  minElo?: number;
  maxElo?: number;
  requireCheckIn: boolean;
  checkInDuration: number; // minutes before start
  matchTimeLimit: number; // minutes per match
  gamesPerMatch: number; // best of X
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  image: string;
  status: TournamentStatus;
  format: TournamentFormat;
  
  // Schedule
  registrationStart: string;
  registrationEnd: string;
  checkInStart?: string;
  checkInEnd?: string;
  startDate: string;
  endDate?: string;
  
  // Participants
  maxParticipants: number;
  currentParticipants: number;
  participants: TournamentParticipant[];
  
  // Prize Pool
  prizePool: number;
  entryFee: number;
  prizes: TournamentPrize[];
  
  // Rules
  rules: TournamentRules;
  
  // Metadata
  organizer: string;
  sponsorName?: string;
  sponsorLogo?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  bracketPosition: string; // e.g., "R1-M1", "R2-M3"
  
  player1Id: string | null;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  
  status: MatchStatus;
  startTime?: string;
  endTime?: string;
  
  // Next match progression
  nextMatchId?: string;
}

export interface Bracket {
  id: string;
  tournamentId: string;
  format: TournamentFormat;
  status: BracketStatus;
  rounds: number;
  matches: Match[];
  createdAt: string;
}

export interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  currentBracket: Bracket | null;
  myTournaments: Tournament[]; // Tournaments user is registered for
  isLoading: boolean;
  error: string | null;
}

export interface RegisterTournamentData {
  tournamentId: string;
}

export interface CheckInData {
  tournamentId: string;
}

export interface TournamentFilters {
  status?: TournamentStatus;
  format?: TournamentFormat;
  minPrizePool?: number;
  maxEntryFee?: number;
  featured?: boolean;
}
