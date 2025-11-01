"use client";

import { useGameStore } from "@/src/stores/gameStore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GamePlayLandscape } from "./game-play/GamePlayLandscape";
import { GamePlayPortrait } from "./game-play/GamePlayPortrait";
import { GamePlaySimpleView } from "./game-play/GamePlaySimpleView";
import { GamePlayViewTheme, type GamePlayLayoutProps } from "./game-play/types";

interface GamePlayViewProps {
  sessionId: string;
}

const gamePlayTheme: GamePlayViewTheme = GamePlayViewTheme.Simple;

export function GamePlayView({ sessionId }: GamePlayViewProps) {
  const router = useRouter();
  const {
    currentRoom,
    currentSession,
    myHand,
    myMelds,
    tableMelds,
    discardTop,
    otherPlayers,
    gamerId,
    loadGameState,
    subscribeToGameSession,
    drawCard,
    discardCard,
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
    unsubscribeFromGame,
    isLoading,
    error,
    loadGameResultSummaryForRoom,
  } = useGameStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    () => currentRoom?.settings.timeLimit ?? 60
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

    // Cleanup on unmount
    return () => {
      isActive = false;
      unsubscribeFromGame();
    };
  }, [sessionId, loadGameState, subscribeToGameSession, unsubscribeFromGame]);

  useEffect(() => {
    if (!isSelectingMeld || isSelectingLayoff) {
      return;
    }

    if (pendingMeldCardIds.length === 0) {
      setGuidanceMessage("เริ่มเลือกไพ่ในมือเพื่อเกิดอย่างน้อย 3 ใบ");
    } else if (pendingMeldCardIds.length < 3) {
      const remaining = 3 - pendingMeldCardIds.length;
      setGuidanceMessage(
        `เลือกเพิ่มอีก ${remaining} ใบเพื่อให้ครบก่อนกดเกิดไพ่`
      );
    } else {
      setGuidanceMessage('ครบแล้ว! กดปุ่ม "เกิดไพ่" ได้เลย');
    }
  }, [isSelectingMeld, pendingMeldCardIds, isSelectingLayoff]);

  const handleDrawFromDeck = async () => {
    if (hasDrawn || !isMyTurn) return;
    try {
      await drawCard(true);
      setHasDrawn(true);
      setGuidanceMessage("เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Draw from deck error:", error);
      setGuidanceMessage("จั่วไพ่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDrawFromDiscard = async () => {
    if (hasDrawn || !isMyTurn) return;
    try {
      if (pendingMeldCardIds.length === 0) {
        if (!isSelectingMeld) {
          startMeldSelection();
        }
        setGuidanceMessage(
          "เลือกไพ่ในมืออย่างน้อย 2 ใบเพื่อรวมกับไพ่กองทิ้ง แล้วกดเกิดไพ่"
        );
        return;
      }

      const meldCards = discardTop
        ? Array.from(new Set([discardTop.id, ...pendingMeldCardIds]))
        : pendingMeldCardIds;

      await drawCard(false, { meldCards });
      setHasDrawn(true);
      setGuidanceMessage("เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Draw from discard error:", error);
      setGuidanceMessage("ไม่สามารถเก็บไพ่จากกองทิ้งได้ กรุณาลองใหม่");
    }
  };

  const handleSelectCard = (cardId: string) => {
    if (!hasDrawn || !isMyTurn) return;
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

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

  const handleToggleMeldCard = (cardId: string) => {
    if (!isMyTurn) return;
    toggleMeldCard(cardId);
  };

  const handleStartMeldSelection = () => {
    if (!isMyTurn) return;
    cancelLayoffSelection();
    startMeldSelection();
    setGuidanceMessage('เลือกไพ่ในมืออย่างน้อย 3 ใบเพื่อกด "เกิดไพ่" หรือเลือกฝาก');
  };

  const handleCancelMeldSelection = () => {
    cancelMeldSelection();
    setGuidanceMessage(null);
  };

  const handleConfirmMeld = async () => {
    if (pendingMeldCardIds.length < 3) return;
    try {
      await createMeld();
      setGuidanceMessage("ไพ่เกิดแล้ว จั่วหรือทิ้งตามลำดับเทิร์น");
    } catch (error) {
      console.error("Create meld error:", error);
      setGuidanceMessage("ไม่สามารถเกิดไพ่ได้ กรุณาลองใหม่");
    }
  };

  const handleStartLayoffSelection = () => {
    if (!isMyTurn) return;
    cancelMeldSelection();
    startLayoffSelection();
    setGuidanceMessage("เลือกกองที่ต้องการฝาก แล้วเลือกไพ่ในมือ");
  };

  const handleToggleLayoffCard = (cardId: string) => {
    if (!isMyTurn) return;
    toggleLayoffCard(cardId);
  };

  const handleCancelLayoffSelection = () => {
    cancelLayoffSelection();
    setGuidanceMessage(null);
  };

  const handleConfirmLayoff = async () => {
    if (!pendingLayoffCardIds.length || !targetMeldId) return;
    try {
      await confirmLayoff();
      setGuidanceMessage("ฝากไพ่สำเร็จ เลือกไพ่ที่จะทิ้งเพื่อจบเทิร์น");
    } catch (error) {
      console.error("Layoff error:", error);
      setGuidanceMessage("ฝากไพ่ไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const handleSelectLayoffTarget = (meldId: string | null) => {
    if (!isMyTurn) return;
    selectLayoffTarget(meldId);
  };

  const canConfirmMeld = pendingMeldCardIds.length >= 3;
  const canConfirmLayoff = pendingLayoffCardIds.length > 0 && !!targetMeldId;
  const pendingMeldSet = useMemo(
    () => new Set(pendingMeldCardIds),
    [pendingMeldCardIds]
  );
  const pendingLayoffSet = useMemo(
    () => new Set(pendingLayoffCardIds),
    [pendingLayoffCardIds]
  );

  const handleDiscard = async () => {
    if (!selectedCardId || !hasDrawn || !isMyTurn) return;
    try {
      await discardCard(selectedCardId);
      setSelectedCardId(null);
      setHasDrawn(false);
      setGuidanceMessage(null);
    } catch (error) {
      console.error("Discard error:", error);
      setGuidanceMessage("ทิ้งไพ่ไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const isMyTurn = currentSession?.currentTurnGamerId === gamerId;
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดเกม...</p>
        </div>
      </div>
    );
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
    isMyTurn,
    hasDrawn,
    selectedCardId,
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
    canConfirmMeld,
    pendingLayoffCardIds,
    pendingLayoffSet,
    canConfirmLayoff,
    isSelectingMeld,
    isSelectingLayoff,
    selectedLayoffMeldId: targetMeldId,
    isLoading,
    error,
    currentTurnPlayerName,
    onBack: handleBack,
    onDrawFromDeck: handleDrawFromDeck,
    onDrawFromDiscard: handleDrawFromDiscard,
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
  };

  switch (gamePlayTheme) {
    case GamePlayViewTheme.Simple:
      return <GamePlaySimpleView {...layoutProps} />;
    case GamePlayViewTheme.Theme1:
      return orientation === "portrait" ? (
        <GamePlayPortrait {...layoutProps} />
      ) : (
        <GamePlayLandscape {...layoutProps} />
      );
    default:
      return <GamePlayPortrait {...layoutProps} />;
  }
}
