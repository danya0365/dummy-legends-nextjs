"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DiscardStackEntry,
  TurnActionPermission,
} from "@/src/domain/types/gameplay.types";
import { useGameStore } from "@/src/stores/gameStore";
import type { GamePlayLayoutProps, GamePlayViewTheme } from "../game-play/types";
import { GamePlayViewTheme as GamePlayViewThemeEnum } from "../game-play/types";

interface UseGamePlayControllerArgs {
  sessionId: string;
}

interface UseGamePlayControllerResult {
  layoutProps: GamePlayLayoutProps | null;
  orientation: "portrait" | "landscape";
  theme: GamePlayViewTheme;
  isInitializing: boolean;
}

export function useGamePlayController({
  sessionId,
}: UseGamePlayControllerArgs): UseGamePlayControllerResult {
  const router = useRouter();
  const {
    currentRoom,
    currentSession,
    myHand,
    myMelds,
    tableMelds,
    discardTop,
    discardStack,
    otherPlayers,
    gamerId,
    loadGameState,
    subscribeToGameSession,
    drawCard,
    discardCard,
    sortHandByRank,
    sortHandBySuit,
    createMeld,
    startMeldSelection,
    cancelMeldSelection,
    toggleMeldCard,
    startLayoffSelection,
    cancelLayoffSelection,
    toggleLayoffCard,
    selectLayoffTarget,
    confirmLayoff,
    pendingMeldCardIds,
    pendingLayoffCardIds,
    isSelectingMeld,
    isSelectingLayoff,
    targetMeldId,
    selectedDiscardCardId,
    selectDiscardCard,
    unsubscribeFromGame,
    isLoading,
    error,
    loadGameResultSummaryForRoom,
    turnActionState,
    hasDrawnThisTurn,
  } = useGameStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(hasDrawnThisTurn);
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    () => currentRoom?.settings.timeLimit ?? 60
  );

  const discardSelectionCount =
    turnActionState.context.discardSelectionCount ?? 0;
  const discardPickupCount = turnActionState.context.discardPickupCount ?? 0;
  const totalMeldSelectionCount =
    turnActionState.context.totalMeldSelectionCount ??
    pendingMeldCardIds.length + discardSelectionCount;
  const requiredHandCardsForSelectedDiscard =
    turnActionState.context.requiredHandCardsForSelectedDiscard ??
    Math.max(0, 3 - discardSelectionCount);
  const remainingHandCardsNeeded =
    turnActionState.context.remainingHandCardsNeeded ??
    Math.max(0, requiredHandCardsForSelectedDiscard - pendingMeldCardIds.length);
  const remainingCardsNeededForMeld =
    turnActionState.context.remainingCardsNeededForMeld ??
    Math.max(0, 3 - totalMeldSelectionCount);
  const isDiscardMeldFlow = Boolean(turnActionState.context.isDiscardMeld);
  const canConfirmMeld =
    totalMeldSelectionCount >= 3 &&
    pendingMeldCardIds.length >= Math.max(1, requiredHandCardsForSelectedDiscard);
  const canConfirmLayoff = pendingLayoffCardIds.length > 0 && !!targetMeldId;

  const pendingMeldSet = useMemo(
    () => new Set(pendingMeldCardIds),
    [pendingMeldCardIds]
  );
  const pendingLayoffSet = useMemo(
    () => new Set(pendingLayoffCardIds),
    [pendingLayoffCardIds]
  );

  const turnTimeLimit = currentRoom?.settings.timeLimit ?? 60;

  const isGameFinished = useMemo(() => {
    if (!currentSession) return false;
    return (
      !currentSession.isActive ||
      !!currentSession.finishedAt ||
      !!currentSession.winnerId
    );
  }, [currentSession]);

  const didIWin = useMemo(() => {
    if (!currentSession || !isGameFinished) return false;
    return currentSession.winnerId === gamerId;
  }, [currentSession, gamerId, isGameFinished]);

  const winnerName = useMemo(() => {
    if (!currentSession?.winnerId) return "";
    if (currentSession.winnerId === gamerId) return "คุณ";
    return (
      otherPlayers.find((player) => player.gamerId === currentSession.winnerId)
        ?.displayName || "ผู้เล่น"
    );
  }, [currentSession?.winnerId, gamerId, otherPlayers]);

  const winningTypeLabel = useMemo(() => {
    if (!currentSession?.winningType) return null;
    const map: Record<string, string> = {
      knock: "น็อก",
      gin: "กิ้น",
      dummy_finish: "น็อก Dummy",
    };
    return map[currentSession.winningType] || currentSession.winningType;
  }, [currentSession?.winningType]);

  const communityMelds = useMemo(
    () => tableMelds.filter((meld) => meld.ownerGamerId !== gamerId),
    [tableMelds, gamerId]
  );

  const otherPlayersWithDetails = useMemo(() => {
    const playersById = new Map(
      (currentRoom?.players ?? []).map((player) => [player.userId, player])
    );

    return otherPlayers.map((player, index) => {
      const roomPlayer = playersById.get(player.gamerId);
      const fallbackName = `ผู้เล่น${
        otherPlayers.length > 1 ? ` ${index + 1}` : ""
      }`;

      return {
        ...player,
        displayName:
          roomPlayer?.displayName || roomPlayer?.username || fallbackName,
        avatar: roomPlayer?.avatar ?? null,
        isHost: roomPlayer?.isHost ?? false,
      };
    });
  }, [currentRoom?.players, otherPlayers]);

  const isMyTurn = currentSession?.currentTurnGamerId === gamerId;

  const actionAvailability = useMemo(() => {
    const allowed = new Set<TurnActionPermission>(turnActionState.allowedActions);
    return {
      canDrawFromDeck: allowed.has("draw_from_deck") && isMyTurn,
      canDrawFromDiscard:
        allowed.has("draw_from_discard") &&
        isMyTurn &&
        !!turnActionState.context.allowDrawFromDiscard,
      canSelectDiscardCard:
        allowed.has("select_discard_card") &&
        isMyTurn &&
        !!turnActionState.context.allowDrawFromDiscard,
      canSelectHandCard:
        isMyTurn &&
        (allowed.has("select_hand_card") ||
          allowed.has("toggle_meld_card") ||
          allowed.has("toggle_layoff_card")),
      canStartMeldSelection: allowed.has("start_meld_selection") && isMyTurn,
      canCancelSelection: allowed.has("cancel_selection") && isMyTurn,
      canToggleMeldCard: allowed.has("toggle_meld_card") && isMyTurn,
      canConfirmMeldAction: allowed.has("confirm_meld") && isMyTurn,
      canStartLayoffSelection: allowed.has("start_layoff_selection") && isMyTurn,
      canToggleLayoffCard: allowed.has("toggle_layoff_card") && isMyTurn,
      canConfirmLayoffAction: allowed.has("confirm_layoff") && isMyTurn,
      canDiscardCard: allowed.has("discard_card") && isMyTurn,
    };
  }, [isMyTurn, turnActionState.allowedActions, turnActionState.context]);

  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () => {
      if (typeof window === "undefined") return "portrait";
      return window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOrientation = () => {
      setOrientation(
        window.innerWidth >= window.innerHeight ? "landscape" : "portrait"
      );
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    if (!currentSession || !currentSession.currentTurnStartedAt) {
      setRemainingSeconds(turnTimeLimit);
      return;
    }

    if (isGameFinished || turnTimeLimit <= 0) {
      setRemainingSeconds(0);
      return;
    }

    const startedAt = new Date(currentSession.currentTurnStartedAt).getTime();

    const updateRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(turnTimeLimit - elapsedSeconds, 0);
      setRemainingSeconds(remaining);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    currentSession?.currentTurnStartedAt,
    isGameFinished,
    turnTimeLimit,
    currentSession,
  ]);

  useEffect(() => {
    if (!currentRoom) return;
    setRemainingSeconds(turnTimeLimit);
  }, [currentRoom, turnTimeLimit]);

  const formattedRemaining = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingSeconds]);

  const timerPercentage = useMemo(() => {
    if (turnTimeLimit <= 0) return 0;
    return Math.max(Math.min((remainingSeconds / turnTimeLimit) * 100, 100), 0);
  }, [remainingSeconds, turnTimeLimit]);

  useEffect(() => {
    let isActive = true;

    const initializeGame = async () => {
      try {
        await loadGameState(sessionId);

        if (!isActive) {
          return;
        }

        await subscribeToGameSession(sessionId);
      } catch (initError) {
        console.error("Failed to initialize gameplay session:", initError);
      }
    };

    initializeGame();

    return () => {
      isActive = false;
      unsubscribeFromGame();
    };
  }, [sessionId, loadGameState, subscribeToGameSession, unsubscribeFromGame]);

  const selectedDiscardEntries = useMemo(() => {
    if (!discardStack || !selectedDiscardCardId) {
      return [] as DiscardStackEntry[];
    }

    const selectedEntry = discardStack.entries.find(
      (entry) => entry.card.id === selectedDiscardCardId
    );

    if (!selectedEntry) {
      return [] as DiscardStackEntry[];
    }

    const targetPosition = selectedEntry.card.position;

    return discardStack.entries.filter(
      (entry) => entry.card.position <= targetPosition
    );
  }, [discardStack, selectedDiscardCardId]);

  useEffect(() => {
    if (!isSelectingMeld || isSelectingLayoff) {
      return;
    }

    if (isDiscardMeldFlow) {
      if (pendingMeldCardIds.length === 0) {
        setGuidanceMessage(
          `เลือกไพ่ในมืออย่างน้อย ${requiredHandCardsForSelectedDiscard} ใบเพื่อรวมกับกองทิ้ง`
        );
        return;
      }

      if (remainingHandCardsNeeded > 0) {
        setGuidanceMessage(
          `เลือกไพ่ในมือเพิ่มอีก ${remainingHandCardsNeeded} ใบเพื่อรวมกับกองทิ้ง`
        );
        return;
      }
    }

    if (totalMeldSelectionCount === 0) {
      setGuidanceMessage("เริ่มเลือกไพ่ในมือเพื่อเกิดอย่างน้อย 3 ใบ");
    } else if (totalMeldSelectionCount < 3) {
      setGuidanceMessage(
        `เลือกเพิ่มอีก ${remainingCardsNeededForMeld} ใบเพื่อให้ครบก่อนกดเกิดไพ่`
      );
    } else {
      setGuidanceMessage('ครบแล้ว! กดปุ่ม "เกิดไพ่" ได้เลย');
    }
  }, [
    isSelectingMeld,
    isSelectingLayoff,
    isDiscardMeldFlow,
    pendingMeldCardIds,
    remainingHandCardsNeeded,
    totalMeldSelectionCount,
    remainingCardsNeededForMeld,
    requiredHandCardsForSelectedDiscard,
  ]);

  const handleDrawFromDeck = useCallback(async () => {
    if (!actionAvailability.canDrawFromDeck) return;
    try {
      await drawCard(true);
      setHasDrawn(true);
      setGuidanceMessage("เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Draw from deck error:", error);
      setGuidanceMessage("จั่วไพ่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }, [actionAvailability.canDrawFromDeck, drawCard]);

  const handleDrawFromDiscard = useCallback(async () => {
    if (!actionAvailability.canDrawFromDiscard) return;
    try {
      if (!isSelectingMeld) {
        startMeldSelection();
      }

      if (!selectedDiscardCardId) {
        setGuidanceMessage("เลือกใบที่ต้องการหยิบจากกองทิ้งก่อน");
        return;
      }

      if (pendingMeldCardIds.length < requiredHandCardsForSelectedDiscard) {
        const needed =
          requiredHandCardsForSelectedDiscard - pendingMeldCardIds.length;
        setGuidanceMessage(
          needed > 0
            ? `เลือกไพ่ในมือเพิ่มอีก ${needed} ใบเพื่อรวมกับกองทิ้ง`
            : "เลือกไพ่ในมืออย่างน้อย 1 ใบเพื่อรวมกับกองทิ้ง"
        );
        return;
      }

      const requiredDiscardCards = selectedDiscardEntries.map(
        (entry) => entry.card.id
      );

      const combinedSelectionCount =
        pendingMeldCardIds.length + requiredDiscardCards.length;
      if (combinedSelectionCount < 3) {
        const needed = 3 - combinedSelectionCount;
        setGuidanceMessage(
          `ต้องเลือกไพ่เพิ่มอีก ${needed} ใบเพื่อรวมกับกองทิ้งก่อนเก็บ`
        );
        return;
      }

      const meldCards = Array.from(
        new Set([...requiredDiscardCards, ...pendingMeldCardIds])
      );

      await drawCard(false, {
        meldCards,
        selectedDiscardCardId,
      });
      setHasDrawn(true);
      setGuidanceMessage("เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Draw from discard error:", error);
      setGuidanceMessage("ไม่สามารถเก็บไพ่จากกองทิ้งได้ กรุณาลองใหม่");
    }
  }, [
    actionAvailability.canDrawFromDiscard,
    drawCard,
    isSelectingMeld,
    pendingMeldCardIds,
    requiredHandCardsForSelectedDiscard,
    selectedDiscardCardId,
    selectedDiscardEntries,
    startMeldSelection,
  ]);

  const handleSelectDiscardCard = useCallback(
    (cardId: string) => {
      if (!actionAvailability.canSelectDiscardCard) return;
      selectDiscardCard(cardId === selectedDiscardCardId ? null : cardId);
    },
    [actionAvailability.canSelectDiscardCard, selectDiscardCard, selectedDiscardCardId]
  );

  const handleSelectCard = useCallback(
    (cardId: string) => {
      if (!actionAvailability.canSelectHandCard) return;
      setSelectedCardId(cardId === selectedCardId ? null : cardId);
    },
    [actionAvailability.canSelectHandCard, selectedCardId]
  );

  const handleToggleMeldCard = useCallback(
    (cardId: string) => {
      if (!actionAvailability.canToggleMeldCard) return;
      toggleMeldCard(cardId);
    },
    [actionAvailability.canToggleMeldCard, toggleMeldCard]
  );

  const handleStartMeldSelection = useCallback(() => {
    if (!actionAvailability.canStartMeldSelection) return;
    cancelLayoffSelection();
    startMeldSelection();
    setGuidanceMessage("เลือกไพ่ในมือเพื่อเตรียมเกิด");
  }, [actionAvailability.canStartMeldSelection, cancelLayoffSelection, startMeldSelection]);

  const handleCancelMeldSelection = useCallback(() => {
    cancelMeldSelection();
    setGuidanceMessage(null);
  }, [cancelMeldSelection]);

  useEffect(() => {
    if (!isMyTurn) {
      setGuidanceMessage("รอผู้เล่นคนอื่นดำเนินการ");
      return;
    }

    switch (turnActionState.mode) {
      case "awaiting_draw":
        setGuidanceMessage(
          turnActionState.context.allowDrawFromDiscard
            ? "เลือกจั่วจากกองหรือเก็บกองทิ้ง"
            : "จั่วไพ่จากกองกลาง"
        );
        break;
      case "selecting_discard":
      case "assembling_discard_meld":
        setGuidanceMessage("เลือกไพ่ในมือเพื่อรวมกับกองทิ้ง");
        break;
      case "selecting_meld":
        setGuidanceMessage("เลือกไพ่ในมือเพื่อเกิดไพ่");
        break;
      case "selecting_layoff":
        setGuidanceMessage("เลือกไพ่ในมือเพื่อฝากไพ่");
        break;
      case "awaiting_discard":
        setGuidanceMessage(
          selectedCardId ? "กดทิ้งไพ่เพื่อจบเทิร์น" : "เลือกไพ่ที่จะทิ้ง"
        );
        break;
      default:
        setGuidanceMessage(null);
    }
  }, [isMyTurn, selectedCardId, turnActionState]);

  useEffect(() => {
    if (!isSelectingLayoff) {
      return;
    }

    if (!targetMeldId) {
      setGuidanceMessage("เลือกกองเกิดที่ต้องการฝาก (ฝากได้ทุกกอง)");
    } else if (pendingLayoffCardIds.length === 0) {
      setGuidanceMessage("เลือกไพ่ในมือที่จะฝากให้กับกองที่เลือก");
    } else {
      setGuidanceMessage('เลือกไพ่เพิ่มหรือกด "ฝากไพ่" เพื่อยืนยัน');
    }
  }, [isSelectingLayoff, targetMeldId, pendingLayoffCardIds]);

  const handleConfirmMeld = useCallback(async () => {
    if (!canConfirmMeld) return;
    try {
      await createMeld();
      setGuidanceMessage("ไพ่เกิดแล้ว จั่วหรือทิ้งตามลำดับเทิร์น");
    } catch (error) {
      console.error("Create meld error:", error);
      setGuidanceMessage("ไม่สามารถเกิดไพ่ได้ กรุณาลองใหม่");
    }
  }, [canConfirmMeld, createMeld]);

  const handleStartLayoffSelection = useCallback(() => {
    if (!actionAvailability.canStartLayoffSelection) return;
    cancelMeldSelection();
    startLayoffSelection();
    setGuidanceMessage("เลือกกองที่ต้องการฝาก แล้วเลือกไพ่ในมือ");
  }, [
    actionAvailability.canStartLayoffSelection,
    cancelMeldSelection,
    startLayoffSelection,
  ]);

  const handleToggleLayoffCard = useCallback(
    (cardId: string) => {
      if (!actionAvailability.canToggleLayoffCard) return;
      toggleLayoffCard(cardId);
    },
    [actionAvailability.canToggleLayoffCard, toggleLayoffCard]
  );

  const handleConfirmLayoff = useCallback(async () => {
    if (!pendingLayoffCardIds.length || !targetMeldId) return;
    try {
      await confirmLayoff();
      setGuidanceMessage("ฝากไพ่สำเร็จ เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Layoff error:", error);
      setGuidanceMessage("ฝากไพ่ไม่สำเร็จ กรุณาลองใหม่");
    }
  }, [confirmLayoff, pendingLayoffCardIds.length, targetMeldId]);

  const handleCancelLayoffSelection = useCallback(() => {
    cancelLayoffSelection();
    setGuidanceMessage(null);
  }, [cancelLayoffSelection]);

  const handleSelectLayoffTarget = useCallback(
    (meldId: string | null) => {
      if (!actionAvailability.canToggleLayoffCard) return;
      selectLayoffTarget(meldId);
    },
    [actionAvailability.canToggleLayoffCard, selectLayoffTarget]
  );

  const handleDiscard = useCallback(async () => {
    if (!selectedCardId || !actionAvailability.canDiscardCard) return;
    try {
      await discardCard(selectedCardId);
      setSelectedCardId(null);
      setHasDrawn(false);
      setGuidanceMessage(null);
    } catch (error) {
      console.error("Discard error:", error);
      setGuidanceMessage("ทิ้งไพ่ไม่สำเร็จ กรุณาลองใหม่");
    }
  }, [actionAvailability.canDiscardCard, discardCard, selectedCardId]);

  const currentTurnPlayer = otherPlayersWithDetails.find(
    (p) => p.isCurrentTurn
  );
  const currentTurnPlayerName = currentTurnPlayer?.displayName || "ผู้เล่น";

  const handleBack = useCallback(() => {
    router.push("/game/lobby");
  }, [router]);

  const handleRefresh = useCallback(() => {
    return loadGameState(sessionId);
  }, [loadGameState, sessionId]);

  const hasNavigatedToResult = useRef(false);

  useEffect(() => {
    hasNavigatedToResult.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (
      !isGameFinished ||
      !currentSession?.id ||
      !currentSession.roomId ||
      hasNavigatedToResult.current
    ) {
      return;
    }

    hasNavigatedToResult.current = true;

    const roomId = currentSession.roomId;
    const finishedSessionId = currentSession.id;

    void loadGameResultSummaryForRoom(roomId);

    const query = new URLSearchParams({ sessionId: finishedSessionId }).toString();
    router.push(`/game/room/${roomId}/result?${query}`);
  }, [
    isGameFinished,
    currentSession?.id,
    currentSession?.roomId,
    loadGameResultSummaryForRoom,
    router,
  ]);

  if (!currentSession) {
    return {
      layoutProps: null,
      orientation,
      theme: GamePlayViewThemeEnum.Simple,
      isInitializing: true,
    };
  }

  const layoutProps: GamePlayLayoutProps = {
    currentRoom,
    currentSession,
    gamerId,
    otherPlayers: otherPlayersWithDetails,
    myHand,
    myMelds,
    tableMelds,
    communityMelds,
    discardTop,
    discardStack,
    isMyTurn,
    hasDrawn,
    selectedCardId,
    selectedDiscardCardId,
    remainingSeconds,
    formattedRemaining,
    timerPercentage,
    turnTimeLimit,
    guidanceMessage,
    isGameFinished,
    didIWin,
    winnerName,
    winningTypeLabel,
    pendingMeldCardIds,
    pendingMeldSet,
    discardSelectionCount,
    discardPickupCount,
    totalMeldSelectionCount,
    remainingCardsNeededForMeld,
    requiredHandCardsForSelectedDiscard,
    remainingHandCardsNeeded,
    canConfirmMeld,
    isDiscardMeldFlow,
    isSelectingMeld,
    pendingLayoffCardIds,
    pendingLayoffSet,
    canConfirmLayoff,
    isSelectingLayoff,
    selectedLayoffMeldId: targetMeldId,
    isLoading,
    error,
    currentTurnPlayerName,
    turnActionMode: turnActionState.mode,
    turnActionAllowedActions: turnActionState.allowedActions,
    turnActionContext: turnActionState.context,
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
    onRefresh: handleRefresh,
    onSortHandByRank: sortHandByRank,
    onSortHandBySuit: sortHandBySuit,
  };

  return {
    layoutProps,
    orientation,
    theme: GamePlayViewThemeEnum.Simple,
    isInitializing: false,
  };
}
