/**
 * Game Types for Dummy Legends
 */

export type RoomStatus = "waiting" | "ready" | "playing" | "finished";
export type PlayerStatus = "waiting" | "ready" | "playing" | "disconnected";
export type GameMode = "casual" | "ranked" | "tournament" | "private";

export interface Player {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  level: number;
  elo: number;
  status: PlayerStatus;
  isHost: boolean;
  isReady: boolean;
  position: number; // 0-3 for 4 players max
  joinedAt: string;
}

export interface RoomSettings {
  maxPlayers: number; // 2-4 players
  betAmount: number;
  timeLimit: number; // seconds per turn
  isPrivate: boolean;
  password?: string;
  allowSpectators: boolean;
}

export interface GameRoom {
  id: string;
  code: string; // 6-digit room code
  hostId: string;
  name: string;
  status: RoomStatus;
  mode: GameMode;
  settings: RoomSettings;
  players: Player[];
  spectators: string[]; // user IDs
  currentPlayerCount: number;
  maxPlayerCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface CreateRoomData {
  name: string;
  mode: GameMode;
  maxPlayers: number;
  betAmount: number;
  timeLimit: number;
  isPrivate: boolean;
  password?: string;
  allowSpectators: boolean;
}

export interface JoinRoomData {
  roomId?: string;
  roomCode?: string;
  password?: string;
}

export interface GameState {
  currentRoom: GameRoom | null;
  availableRooms: GameRoom[];
  isInRoom: boolean;
  isLoading: boolean;
  error: string | null;
}

// Dummy Card Game Types
export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  id: string;
}

export interface PlayerHand {
  playerId: string;
  cards: Card[];
  melds: Card[][]; // Sets and runs that have been laid down
}

export interface GamePlayState {
  roomId: string;
  deck: Card[];
  discardPile: Card[];
  playerHands: PlayerHand[];
  currentTurn: string; // player ID
  turnStartTime: string;
  round: number;
  scores: { [playerId: string]: number };
}
