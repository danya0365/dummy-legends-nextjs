import type {
  GameCard,
  PlayerMeld,
  TableMeld,
  GameSession,
  OtherPlayer,
} from "@/src/domain/types/gameplay.types";
import type { GameRoom } from "@/src/domain/types/game.types";

export interface EnhancedOtherPlayer extends OtherPlayer {
  displayName?: string;
  avatar?: string | null;
  isHost?: boolean;
}

export enum GamePlayViewTheme {
  Simple,
  Theme1,
}

export interface GamePlayLayoutProps {
  currentRoom: GameRoom | null;
  currentSession: GameSession;
  gamerId: string | null;
  otherPlayers: EnhancedOtherPlayer[];
  myHand: GameCard[];
  myMelds: PlayerMeld[];
  tableMelds: TableMeld[];
  communityMelds: TableMeld[];
  discardTop: GameCard | null;
  isMyTurn: boolean;
  hasDrawn: boolean;
  selectedCardId: string | null;
  remainingSeconds: number;
  formattedRemaining: string;
  timerPercentage: number;
  turnTimeLimit: number;
  guidanceMessage: string | null;
  isGameFinished: boolean;
  didIWin: boolean;
  winnerName: string;
  winningTypeLabel: string | null;
  pendingMeldCardIds: string[];
  pendingMeldSet: Set<string>;
  canConfirmMeld: boolean;
  isSelectingMeld: boolean;
  isLoading: boolean;
  error: string | null;
  currentTurnPlayerName: string;
  onBack: () => void;
  onDrawFromDeck: () => void;
  onDrawFromDiscard: () => void;
  onSelectCard: (cardId: string) => void;
  onToggleMeldCard: (cardId: string) => void;
  onStartMeldSelection: () => void;
  onCancelMeldSelection: () => void;
  onConfirmMeld: () => void;
  onDiscard: () => void;
  onRefresh: () => void;
}
