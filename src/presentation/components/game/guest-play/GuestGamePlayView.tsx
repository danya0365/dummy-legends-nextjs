"use client";

import type {
  DiscardStackInfo,
  GameSession,
  TableMeld,
  TurnActionMode,
  TurnActionPermission,
} from "@/src/domain/types/gameplay.types";
import { GamePlaySimpleView } from "@/src/presentation/components/game/game-play/GamePlaySimpleView";
import type {
  EventParticipantLookup,
  GamePlayLayoutProps,
} from "@/src/presentation/components/game/game-play/types";
import type { GameSnapshot } from "@/src/stores/gamePlayWebRtcStore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGuestGamePlayController } from "./useGuestGamePlayController";

interface GuestGamePlayViewProps {
  roomId?: string | null;
}

const TURN_TIME_LIMIT_SECONDS = 45;
const MIN_MELD_SIZE = 3;

const formatSeconds = (value: number): string => {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(1, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const buildGameSession = (snapshot: GameSnapshot): GameSession => {
  const startedAt = new Date(snapshot.room.createdAt).toISOString();
  const currentTurnStartedAt = snapshot.turn.startedAt
    ? new Date(snapshot.turn.startedAt).toISOString()
    : null;
  const finishedAt = snapshot.result?.finishedAt
    ? new Date(snapshot.result.finishedAt).toISOString()
    : null;

  return {
    id: snapshot.room.roomId,
    roomId: snapshot.room.roomId,
    roundNumber: 1,
    currentTurnGamerId: snapshot.turn.currentPeerId,
    currentTurnStartedAt,
    remainingDeckCards: snapshot.deckCount,
    discardPileTopCardId: snapshot.discardStack.topCard?.id ?? null,
    isActive: snapshot.phase !== "finished",
    winnerId: snapshot.result?.winnerPeerId ?? null,
    winningType: snapshot.result?.winningType ?? null,
    startedAt,
    finishedAt,
  };
};

const mapTableMelds = (snapshot: GameSnapshot): TableMeld[] =>
  snapshot.tableMelds.map((meld) => ({
    meldId: meld.meldId,
    ownerGamerId: meld.ownerPeerId ?? null,
    cards: meld.cards,
    createdAt: null,
  }));

const buildDiscardStack = (
  snapshot: GameSnapshot,
  selectedDiscardCardId: string | null
): DiscardStackInfo | null => {
  const entries = snapshot.discardStack.entries ?? [];
  if (entries.length === 0) {
    return null;
  }

  return {
    entries: entries.map((entry, index) => ({
      card: entry.card,
      canSelect: index === entries.length - 1,
    })),
    selectedCardId: selectedDiscardCardId,
  };
};

const deriveTurnActionPermissions = (
  availability: GamePlayLayoutProps["actionAvailability"]
): TurnActionPermission[] => {
  const permissions: TurnActionPermission[] = [];
  if (availability.canDrawFromDeck) permissions.push("draw_from_deck");
  if (availability.canDrawFromDiscard) permissions.push("draw_from_discard");
  if (availability.canSelectDiscardCard)
    permissions.push("select_discard_card");
  if (availability.canSelectHandCard) permissions.push("select_hand_card");
  if (availability.canToggleMeldCard) permissions.push("toggle_meld_card");
  if (availability.canConfirmMeldAction) permissions.push("confirm_meld");
  if (availability.canCancelSelection) permissions.push("cancel_selection");
  if (availability.canStartMeldSelection)
    permissions.push("start_meld_selection");
  if (availability.canStartLayoffSelection)
    permissions.push("start_layoff_selection");
  if (availability.canToggleLayoffCard) permissions.push("toggle_layoff_card");
  if (availability.canConfirmLayoffAction) permissions.push("confirm_layoff");
  if (availability.canDiscardCard) permissions.push("discard_card");
  return permissions;
};

export function GuestGamePlayView({ roomId }: GuestGamePlayViewProps) {
  const router = useRouter();
  const controller = useGuestGamePlayController(roomId ?? null);
  const {
    roomId: resolvedRoomId,
    joinCode,
    isHost,
    isSynced,
    snapshot,
    myHand,
    notices,
    pendingActions,
    lastActionAck,
    sendGuestAction,
    requestSync,
    clearNotice,
    hostBroadcastSampleState,
    localPeerId,
    participants,
  } = controller;

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedDiscardCardId, setSelectedDiscardCardId] = useState<
    string | null
  >(null);
  const [pendingMeldCardIds, setPendingMeldCardIds] = useState<string[]>([]);
  const [pendingLayoffCardIds, setPendingLayoffCardIds] = useState<string[]>(
    []
  );
  const [selectedLayoffMeldId, setSelectedLayoffMeldId] = useState<
    string | null
  >(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSelectingMeld, setIsSelectingMeld] = useState(false);
  const [isSelectingLayoff, setIsSelectingLayoff] = useState(false);

  useEffect(() => {
    if (selectedCardId && !myHand.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [myHand, selectedCardId]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    if (snapshot.turn.currentPeerId !== localPeerId) {
      setHasDrawn(false);
      setIsSelectingMeld(false);
      setIsSelectingLayoff(false);
      setPendingMeldCardIds([]);
      setPendingLayoffCardIds([]);
      setSelectedLayoffMeldId(null);
    }
  }, [localPeerId, snapshot]);

  const handleBack = useCallback(() => {
    router.push("/game/guest-lobby");
  }, [router]);

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const handleToggleMeldCard = useCallback((cardId: string) => {
    setPendingMeldCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const handleStartMeldSelection = useCallback(() => {
    setIsSelectingMeld(true);
    setPendingMeldCardIds((prev) =>
      prev.length > 0 ? prev : selectedCardId ? [selectedCardId] : []
    );
  }, [selectedCardId]);

  const handleCancelMeldSelection = useCallback(() => {
    setIsSelectingMeld(false);
    setPendingMeldCardIds([]);
  }, []);

  const handleConfirmMeld = useCallback(() => {
    if (pendingMeldCardIds.length < MIN_MELD_SIZE) {
      return;
    }
    sendGuestAction("START_MELD", { cardIds: pendingMeldCardIds });
    sendGuestAction("CONFIRM_MELD");
    setPendingMeldCardIds([]);
    setIsSelectingMeld(false);
  }, [pendingMeldCardIds, sendGuestAction]);

  const handleToggleLayoffCard = useCallback((cardId: string) => {
    setPendingLayoffCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const handleStartLayoffSelection = useCallback(() => {
    setIsSelectingLayoff(true);
    setPendingLayoffCardIds([]);
    setSelectedLayoffMeldId(null);
  }, []);

  const handleCancelLayoffSelection = useCallback(() => {
    setIsSelectingLayoff(false);
    setPendingLayoffCardIds([]);
    setSelectedLayoffMeldId(null);
  }, []);

  const handleConfirmLayoff = useCallback(() => {
    if (!selectedLayoffMeldId || pendingLayoffCardIds.length === 0) {
      return;
    }
    sendGuestAction("LAYOFF", {
      targetMeldId: selectedLayoffMeldId,
      cardIds: pendingLayoffCardIds,
    });
    setPendingLayoffCardIds([]);
    setSelectedLayoffMeldId(null);
    setIsSelectingLayoff(false);
  }, [pendingLayoffCardIds, selectedLayoffMeldId, sendGuestAction]);

  const handleSelectLayoffTarget = useCallback((meldId: string | null) => {
    setSelectedLayoffMeldId(meldId);
  }, []);

  const handleSelectDiscardCard = useCallback((cardId: string) => {
    setSelectedDiscardCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const handleDrawFromDeck = useCallback(() => {
    sendGuestAction("DRAW_FROM_DECK");
    setHasDrawn(true);
    setSelectedDiscardCardId(null);
  }, [sendGuestAction]);

  const handleDrawFromDiscard = useCallback(() => {
    if (!selectedDiscardCardId) return;
    sendGuestAction("DRAW_FROM_DISCARD", {
      discardCardId: selectedDiscardCardId,
    });
    setHasDrawn(true);
    setSelectedDiscardCardId(null);
  }, [selectedDiscardCardId, sendGuestAction]);

  const handleDiscard = useCallback(() => {
    if (!selectedCardId) return;
    sendGuestAction("DISCARD_CARD", { cardId: selectedCardId });
    setSelectedCardId(null);
    setHasDrawn(false);
  }, [selectedCardId, sendGuestAction]);

  const handleForceDiscard = useCallback(() => {
    sendGuestAction("END_TURN");
    setHasDrawn(false);
  }, [sendGuestAction]);

  const handleClearDiscardRisk = useCallback(() => {
    requestSync();
  }, [requestSync]);

  const handleRefresh = useCallback(() => {
    requestSync();
  }, [requestSync]);

  const handleSortHandByRank = useCallback(() => {
    requestSync();
  }, [requestSync]);

  const handleSortHandBySuit = useCallback(() => {
    requestSync();
  }, [requestSync]);

  const handleRefreshEventLogs = useCallback(() => {
    requestSync();
  }, [requestSync]);

  const layoutProps = useMemo<GamePlayLayoutProps | null>(() => {
    if (!snapshot || !localPeerId) {
      return null;
    }

    const allTableMelds = mapTableMelds(snapshot);
    const myMelds = allTableMelds.filter(
      (meld) => meld.ownerGamerId === localPeerId
    );
    const communityMelds = allTableMelds.filter(
      (meld) => meld.ownerGamerId && meld.ownerGamerId !== localPeerId
    );
    const discardStack = buildDiscardStack(snapshot, selectedDiscardCardId);
    const isMyTurn = snapshot.turn.currentPeerId === localPeerId;

    const remainingMs =
      snapshot.turn.remainingMs ??
      (isMyTurn ? TURN_TIME_LIMIT_SECONDS * 1000 : 0);
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const formattedRemaining = formatSeconds(remainingSeconds);
    const timerPercentage = TURN_TIME_LIMIT_SECONDS
      ? Math.min(
          100,
          Math.max(0, (remainingSeconds / TURN_TIME_LIMIT_SECONDS) * 100)
        )
      : 0;

    const actionAvailability: GamePlayLayoutProps["actionAvailability"] = {
      canDrawFromDeck: isMyTurn && !hasDrawn,
      canDrawFromDiscard:
        isMyTurn && !hasDrawn && Boolean(selectedDiscardCardId),
      canSelectDiscardCard: isMyTurn && !hasDrawn,
      canSelectHandCard: isMyTurn,
      canStartMeldSelection: isMyTurn && myHand.length >= MIN_MELD_SIZE,
      canCancelSelection: isSelectingMeld || isSelectingLayoff,
      canToggleMeldCard: isSelectingMeld,
      canConfirmMeldAction:
        isSelectingMeld && pendingMeldCardIds.length >= MIN_MELD_SIZE,
      canStartLayoffSelection: isMyTurn && allTableMelds.length > 0,
      canToggleLayoffCard: isSelectingLayoff,
      canConfirmLayoffAction:
        isSelectingLayoff &&
        pendingLayoffCardIds.length > 0 &&
        Boolean(selectedLayoffMeldId),
      canDiscardCard: isMyTurn && hasDrawn && Boolean(selectedCardId),
    };

    const turnActionMode: TurnActionMode = isSelectingMeld
      ? "selecting_meld"
      : isSelectingLayoff
      ? "selecting_layoff"
      : hasDrawn
      ? "awaiting_discard"
      : "awaiting_draw";

    const remainingCardsNeededForMeld = Math.max(
      0,
      MIN_MELD_SIZE - pendingMeldCardIds.length
    );
    const currentTurnPlayerName =
      snapshot.players.find(
        (player) => player.peerId === snapshot.turn.currentPeerId
      )?.displayName ?? "ผู้เล่น";
    const isGameFinished = snapshot.phase === "finished";
    const didIWin = Boolean(
      isGameFinished && snapshot.result?.winnerPeerId === localPeerId
    );
    const winnerName = isGameFinished
      ? snapshot.players.find(
          (player) => player.peerId === snapshot.result?.winnerPeerId
        )?.displayName ?? "ผู้เล่น"
      : "";

    const eventParticipants: EventParticipantLookup =
      snapshot.players.reduce<EventParticipantLookup>((acc, player) => {
        acc[player.peerId] = {
          displayName: player.displayName,
          isSelf: player.peerId === localPeerId,
        };
        return acc;
      }, {} as EventParticipantLookup);

    const otherPlayers = snapshot.players
      .filter((player) => player.peerId !== localPeerId)
      .map((player) => ({
        gamerId: player.peerId,
        cardCount: player.handCount,
        isCurrentTurn: snapshot.turn.currentPeerId === player.peerId,
        displayName: player.displayName,
        avatar: null,
        isHost: player.isHost,
      }));

    const guidanceMessage = isMyTurn
      ? hasDrawn
        ? "เลือกไพ่เพื่อทิ้งหรือจัดชุด"
        : "เริ่มด้วยการจั่วไพ่"
      : `รอ ${currentTurnPlayerName}`;

    const turnActionAllowedActions =
      deriveTurnActionPermissions(actionAvailability);

    return {
      currentRoom: null,
      currentSession: buildGameSession(snapshot),
      gamerId: localPeerId,
      otherPlayers,
      myHand,
      myMelds,
      tableMelds: allTableMelds,
      communityMelds,
      discardTop: snapshot.discardStack.topCard ?? null,
      discardStack,
      isMyTurn,
      hasDrawn,
      selectedCardId,
      selectedDiscardCardId,
      remainingSeconds,
      formattedRemaining,
      timerPercentage,
      turnTimeLimit: TURN_TIME_LIMIT_SECONDS,
      guidanceMessage,
      isGameFinished,
      didIWin,
      winnerName,
      winningTypeLabel: snapshot.result?.winningType ?? null,
      pendingMeldCardIds,
      pendingMeldSet: new Set(pendingMeldCardIds),
      discardSelectionCount: selectedDiscardCardId ? 1 : 0,
      discardPickupCount: 0,
      selectedDiscardPickupCardIds: [],
      selectedDiscardMeldCardIds: [],
      discardHighlightRange: null,
      totalMeldSelectionCount: pendingMeldCardIds.length,
      remainingCardsNeededForMeld,
      requiredHandCardsForSelectedDiscard: 0,
      remainingHandCardsNeeded: remainingCardsNeededForMeld,
      canConfirmMeld:
        isSelectingMeld && pendingMeldCardIds.length >= MIN_MELD_SIZE,
      isDiscardMeldFlow: false,
      isSelectingMeld,
      pendingLayoffCardIds,
      pendingLayoffSet: new Set(pendingLayoffCardIds),
      canConfirmLayoff:
        isSelectingLayoff &&
        pendingLayoffCardIds.length > 0 &&
        Boolean(selectedLayoffMeldId),
      isSelectingLayoff,
      selectedLayoffMeldId,
      isLoading: false,
      error: null,
      discardRiskWarning: null,
      currentTurnPlayerName,
      turnActionMode,
      turnActionAllowedActions,
      turnActionContext: {
        discardSelectionCount: selectedDiscardCardId ? 1 : 0,
        discardPickupCount: 0,
        requiredHandCardsForSelectedDiscard: 0,
        remainingHandCardsNeeded: remainingCardsNeededForMeld,
        totalMeldSelectionCount: pendingMeldCardIds.length,
        remainingCardsNeededForMeld,
        selectedDiscardPickupCardIds: [],
        selectedDiscardMeldCardIds: [],
        discardHighlightRange: null,
        allowDrawFromDiscard: true,
      },
      actionAvailability,
      onBack: handleBack,
      onDrawFromDeck: handleDrawFromDeck,
      onDrawFromDiscard: handleDrawFromDiscard,
      onSelectDiscardCard: handleSelectDiscardCard,
      onSelectCard: handleSelectCard,
      onToggleMeldCard: handleToggleMeldCard,
      onStartMeldSelection: handleStartMeldSelection,
      onCancelMeldSelection: handleCancelMeldSelection,
      onConfirmMeld: handleConfirmMeld,
      onToggleLayoffCard: handleToggleLayoffCard,
      onStartLayoffSelection: handleStartLayoffSelection,
      onCancelLayoffSelection: handleCancelLayoffSelection,
      onConfirmLayoff: handleConfirmLayoff,
      onSelectLayoffTarget: handleSelectLayoffTarget,
      onDiscard: handleDiscard,
      onForceDiscard: handleForceDiscard,
      onClearDiscardRisk: handleClearDiscardRisk,
      onRefresh: handleRefresh,
      onSortHandByRank: handleSortHandByRank,
      onSortHandBySuit: handleSortHandBySuit,
      gameEventLogs: [],
      isLoadingEventLogs: false,
      eventLogError: null,
      onRefreshEventLogs: handleRefreshEventLogs,
      eventParticipants,
    };
  }, [
    snapshot,
    localPeerId,
    hasDrawn,
    selectedDiscardCardId,
    selectedCardId,
    isSelectingMeld,
    isSelectingLayoff,
    pendingMeldCardIds,
    pendingLayoffCardIds,
    selectedLayoffMeldId,
    myHand,
    handleBack,
    handleDrawFromDeck,
    handleDrawFromDiscard,
    handleSelectDiscardCard,
    handleSelectCard,
    handleToggleMeldCard,
    handleStartMeldSelection,
    handleCancelMeldSelection,
    handleConfirmMeld,
    handleToggleLayoffCard,
    handleStartLayoffSelection,
    handleCancelLayoffSelection,
    handleConfirmLayoff,
    handleSelectLayoffTarget,
    handleDiscard,
    handleForceDiscard,
    handleClearDiscardRisk,
    handleRefresh,
    handleSortHandByRank,
    handleSortHandBySuit,
    handleRefreshEventLogs,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-white">
                ห้อง {resolvedRoomId ?? "-"}
              </p>
              <p className="text-slate-300">
                สถานะการซิงก์: {isSynced ? "พร้อม" : "รอซิงก์"}
              </p>
              <p className="text-slate-400">
                ผู้เล่นทั้งหมด {participants.length} คน
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isSynced && (
                <button
                  type="button"
                  onClick={requestSync}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  ขอซิงก์
                </button>
              )}
              {joinCode && (
                <span className="rounded-md bg-white/10 px-3 py-1 text-xs">
                  รหัส {joinCode}
                </span>
              )}
              {isHost && (
                <button
                  type="button"
                  onClick={hostBroadcastSampleState}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  ส่งสถานะตัวอย่าง
                </button>
              )}
            </div>
          </div>
        </section>

        {layoutProps ? (
          <GamePlaySimpleView {...layoutProps} />
        ) : (
          <section className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300">
            <p>
              ยังไม่มี snapshot ล่าสุด โปรดรอให้โฮสต์กระจายสถานะหรือกดปุ่ม
              &quot;ขอซิงก์&quot;
            </p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <header className="mb-2 flex items-center justify-between text-sm">
              <p className="font-semibold text-white">คำสั่งที่รอดำเนินการ</p>
              <span className="text-slate-300">
                {pendingActions.length} รายการ
              </span>
            </header>
            <div className="space-y-2 text-xs text-slate-300">
              {pendingActions.length === 0 ? (
                <p>ยังไม่มีคำสั่งที่รอดำเนินการ</p>
              ) : (
                pendingActions.slice(0, 3).map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p className="font-semibold text-white">{action.action}</p>
                    <p className="text-slate-400">จาก {action.actorPeerId}</p>
                  </div>
                ))
              )}
            </div>
            {lastActionAck && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                <p className="font-semibold text-white">
                  ผลลัพธ์ล่าสุด:{" "}
                  {lastActionAck.status === "accepted" ? "สำเร็จ" : "ถูกปฏิเสธ"}
                </p>
                {lastActionAck.reason && (
                  <p>หมายเหตุ: {lastActionAck.reason}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <header className="mb-2 flex items-center justify-between text-sm">
              <p className="font-semibold text-white">แจ้งเตือน</p>
              <span className="text-slate-300">{notices.length}</span>
            </header>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400">ยังไม่มีแจ้งเตือน</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {notices.slice(0, 4).map((notice) => (
                  <li
                    key={notice.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {notice.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => clearNotice(notice.id)}
                        className="text-white/70 underline-offset-2 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                    <p className="mt-1 text-slate-200">{notice.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
