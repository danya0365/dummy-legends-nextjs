import type {
  GameCard,
  PlayerMeld,
  TableMeld,
  GameSession,
  OtherPlayer,
  DiscardStackInfo,
  TurnActionMode,
  TurnActionPermission,
  TurnActionContext,
  GameEventLogEntry,
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

export interface EventParticipantInfo {
  displayName: string;
  avatarUrl?: string | null;
  isSelf?: boolean;
}

export type EventParticipantLookup = Record<string, EventParticipantInfo>;

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
  discardStack: DiscardStackInfo | null;
  isMyTurn: boolean;
  hasDrawn: boolean;
  selectedCardId: string | null;
  selectedDiscardCardId: string | null;
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
  discardSelectionCount: number;
  discardPickupCount: number;
  selectedDiscardPickupCardIds: string[];
  selectedDiscardMeldCardIds: string[];
  discardHighlightRange: { start: number; end: number } | null;
  totalMeldSelectionCount: number;
  remainingCardsNeededForMeld: number;
  requiredHandCardsForSelectedDiscard: number;
  remainingHandCardsNeeded: number;
  canConfirmMeld: boolean;
  isDiscardMeldFlow: boolean;
  isSelectingMeld: boolean;
  pendingLayoffCardIds: string[];
  pendingLayoffSet: Set<string>;
  canConfirmLayoff: boolean;
  isSelectingLayoff: boolean;
  selectedLayoffMeldId: string | null;
  isLoading: boolean;
  error: string | null;
  discardRiskWarning: {
    riskType: "can_meld_immediately" | "no_meld_before_knock" | "general" | null;
    messageKey?: string | null;
    message?: string;
    canOverride?: boolean;
  } | null;
  currentTurnPlayerName: string;
  turnActionMode: TurnActionMode;
  turnActionAllowedActions: TurnActionPermission[];
  turnActionContext: TurnActionContext;
  actionAvailability: {
    canDrawFromDeck: boolean;
    canDrawFromDiscard: boolean;
    canSelectDiscardCard: boolean;
    canSelectHandCard: boolean;
    canStartMeldSelection: boolean;
    canCancelSelection: boolean;
    canToggleMeldCard: boolean;
    canConfirmMeldAction: boolean;
    canStartLayoffSelection: boolean;
    canToggleLayoffCard: boolean;
    canConfirmLayoffAction: boolean;
    canDiscardCard: boolean;
  };
  onBack: () => void;
  onDrawFromDeck: () => void;
  onDrawFromDiscard: () => void;
  onSelectDiscardCard: (cardId: string) => void;
  onSelectCard: (cardId: string) => void;
  onToggleMeldCard: (cardId: string) => void;
  onStartMeldSelection: () => void;
  onCancelMeldSelection: () => void;
  onConfirmMeld: () => void;
  onToggleLayoffCard: (cardId: string) => void;
  onStartLayoffSelection: () => void;
  onCancelLayoffSelection: () => void;
  onConfirmLayoff: () => void;
  onSelectLayoffTarget: (meldId: string | null) => void;
  onDiscard: () => void;
  onForceDiscard: () => void;
  onClearDiscardRisk: () => void;
  onRefresh: () => void;
  onSortHandByRank: () => void;
  onSortHandBySuit: () => void;
  gameEventLogs: GameEventLogEntry[];
  isLoadingEventLogs: boolean;
  eventLogError: string | null;
  onRefreshEventLogs: () => void;
  eventParticipants: EventParticipantLookup;
}
