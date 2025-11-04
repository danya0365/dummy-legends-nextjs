/**
 * Gameplay Types for Dummy Legends
 */

import type { Database } from "@/src/domain/types/supabase";

export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardRank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface GameCard {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  value: number;
  location: "deck" | "discard" | "hand" | "meld";
  ownerId: string | null;
  position: number;
  meldId?: string | null;
  isHead?: boolean;
  isSpeto?: boolean;
  meldCardIndex?: number | null;
}

export interface GameSession {
  id: string;
  roomId: string;
  roundNumber: number;
  currentTurnGamerId: string | null;
  currentTurnStartedAt: string | null;
  remainingDeckCards: number;
  discardPileTopCardId: string | null;
  isActive: boolean;
  winnerId: string | null;
  winningType: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface DiscardStackEntry {
  card: GameCard;
  canSelect: boolean;
}

export interface DiscardStackInfo {
  entries: DiscardStackEntry[];
  selectedCardId: string | null;
}

export type TurnActionPermission =
  | "draw_from_deck"
  | "draw_from_discard"
  | "select_discard_card"
  | "select_hand_card"
  | "toggle_meld_card"
  | "confirm_meld"
  | "cancel_selection"
  | "start_meld_selection"
  | "start_layoff_selection"
  | "toggle_layoff_card"
  | "confirm_layoff"
  | "discard_card";

export type TurnActionMode =
  | "idle"
  | "awaiting_draw"
  | "selecting_discard"
  | "selecting_discard_meld"
  | "assembling_discard_meld"
  | "selecting_meld"
  | "selecting_layoff"
  | "awaiting_discard";

export interface TurnActionContext {
  discardSelectionCount?: number;
  discardPickupCount?: number;
  requiredHandCardsForSelectedDiscard?: number;
  remainingHandCardsNeeded?: number;
  totalMeldSelectionCount?: number;
  remainingCardsNeededForMeld?: number;
  returnMode?: TurnActionMode;
  allowDrawFromDiscard?: boolean;
  isDiscardMeld?: boolean;
  minimumHandCardsRequiredForMeld?: number;
  selectedDiscardPickupCardIds?: string[];
  selectedDiscardMeldCardIds?: string[];
  discardHighlightRange?: { start: number; end: number } | null;
}

export interface TurnActionState {
  mode: TurnActionMode;
  allowedActions: TurnActionPermission[];
  context: TurnActionContext;
}

export interface PlayerHand {
  gamerId: string;
  cardCount: number;
  deadwoodCount: number;
  deadwoodValue: number;
  melds: Meld[];
}

export interface Meld {
  type: "set" | "run";
  cards: string[]; // card IDs
}

export interface PlayerMeld {
  meldId: string;
  cards: GameCard[];
  createdAt?: string | null;
}

export interface TableMeld {
  meldId: string;
  ownerGamerId: string | null;
  cards: GameCard[];
  createdAt?: string | null;
}

export interface DeadwoodCardDetail {
  cardId: string;
  score: number;
}

export interface GameResultSummary {
  id: string;
  sessionId: string;
  roomId: string;
  winnerGamerId: string | null;
  winningType: string | null;
  totalRounds: number;
  totalMoves: number;
  durationSeconds: number;
  createdAt: string | null;
  summaryMetadata: Record<string, unknown>;
  eloChanges: Record<string, unknown>;
}

export interface GameResultPlayerSummary {
  id: string;
  resultId: string;
  gamerId: string;
  position: number;
  totalPoints: number;
  meldPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  handPoints: number;
  isWinner: boolean;
  specialEvents: string[];
  displayedMeldIds: string[];
  remainingCardIds: string[];
  remainingCards: GameCard[];
  metadata: Record<string, unknown>;
  deadwoodScore: number;
  deadwoodCards: DeadwoodCardDetail[];
  createdAt: string | null;
}

export interface GameScoreEventEntry {
  id: string;
  sessionId: string;
  gamerId: string;
  eventType: string;
  points: number;
  relatedMeldId: string | null;
  relatedCardIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export interface GameResultMeld {
  id: string;
  sessionId: string;
  gamerId: string;
  meldType: "set" | "run";
  createdFromHead: boolean;
  includesSpeto: boolean;
  scoreValue: number;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  cards: GameCard[];
}

export interface OtherPlayer {
  gamerId: string;
  cardCount: number;
  isCurrentTurn: boolean;
  displayName?: string;
  avatar?: string | null;
}

export interface GameState {
  session: GameSession | null;
  myHand: GameCard[];
  discardTop: GameCard | null;
  otherPlayers: OtherPlayer[];
  isMyTurn: boolean;
  canDraw: boolean;
  mustDiscard: boolean;
}

export interface GameStateViewModel {
  session: GameSession | null;
  myHand: GameCard[];
  discardTop: GameCard | null;
  discardStack: DiscardStackInfo | null;
  otherPlayers: OtherPlayer[];
  isMyTurn: boolean;
  canDraw: boolean;
  mustDiscard: boolean;
}

export type GameSessionRow = Database["public"]["Tables"]["game_sessions"]["Row"];
export type GameCardRow = Database["public"]["Tables"]["game_cards"]["Row"];
export type GameResultRow = Database["public"]["Tables"]["game_results"]["Row"];
export type GameResultPlayerRow =
  Database["public"]["Tables"]["game_result_players"]["Row"];
export type GameScoreEventRow =
  Database["public"]["Tables"]["game_score_events"]["Row"];
export type GameMeldRow = Database["public"]["Tables"]["game_melds"]["Row"];

export interface GameStateOtherPlayerSummary {
  gamer_id: string;
  card_count: number;
  is_current_turn: boolean;
}

export interface GameStatePayload {
  session: GameSessionRow | null;
  my_hand: GameCardRow[] | null;
  discard_top: GameCardRow | null;
  discard_stack?: GameCardRow[] | null;
  other_players: GameStateOtherPlayerSummary[] | null;
  my_melds?: Array<{
    meld_id: string;
    created_at?: string | null;
    cards: GameCardRow[];
  }> | null;
  table_melds?: Array<{
    meld_id: string;
    owner_gamer_id: string | null;
    created_at?: string | null;
    cards: GameCardRow[];
  }> | null;
}

export interface GameMove {
  id: string;
  sessionId: string;
  gamerId: string;
  moveType: "draw" | "discard" | "meld" | "knock" | "gin" | "dummy_finish";
  moveNumber: number;
  moveData: Record<string, unknown>;
  timeTakenSeconds: number | null;
  createdAt: string;
}
