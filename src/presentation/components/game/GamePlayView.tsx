"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/src/stores/gameStore";
import { PlayingCard, CardBack } from "./PlayingCard";
import { Users, ArrowLeft, RefreshCw, Sparkles, XCircle } from "lucide-react";

interface GamePlayViewProps {
  sessionId: string;
}

export function GamePlayView({ sessionId }: GamePlayViewProps) {
  const router = useRouter();
  const {
    currentSession,
    myHand,
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
    pendingMeldCardIds,
    isSelectingMeld,
    unsubscribeFromGame,
    isLoading,
    error,
  } = useGameStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);

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
    if (!isSelectingMeld) {
      return;
    }

    if (pendingMeldCardIds.length === 0) {
      setGuidanceMessage("เริ่มเลือกไพ่ในมือเพื่อเกิดอย่างน้อย 3 ใบ");
    } else if (pendingMeldCardIds.length < 3) {
      const remaining = 3 - pendingMeldCardIds.length;
      setGuidanceMessage(`เลือกเพิ่มอีก ${remaining} ใบเพื่อให้ครบก่อนกดเกิดไพ่`);
    } else {
      setGuidanceMessage("ครบแล้ว! กดปุ่ม \"เกิดไพ่\" ได้เลย");
    }
  }, [isSelectingMeld, pendingMeldCardIds]);

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

  const handleToggleMeldCard = (cardId: string) => {
    if (!isMyTurn) return;
    toggleMeldCard(cardId);
  };

  const handleStartMeldSelection = () => {
    if (!isMyTurn) return;
    startMeldSelection();
    setGuidanceMessage("เลือกไพ่ในมืออย่างน้อย 3 ใบเพื่อกด \"เกิดไพ่\"");
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

  const canConfirmMeld = pendingMeldCardIds.length >= 3;
  const pendingMeldSet = useMemo(() => new Set(pendingMeldCardIds), [pendingMeldCardIds]);

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
  const currentTurnPlayer = otherPlayers.find((p) => p.isCurrentTurn);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <button
            onClick={() => router.push("/game/lobby")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            ออกจากเกม
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              รอบที่ {currentSession.roundNumber}
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {isMyTurn ? "🎯 ถึงเทิร์นของคุณ!" : `รอ ${currentTurnPlayer?.displayName || "ผู้เล่น"}...`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{otherPlayers.length + 1} ผู้เล่น</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Game Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Left: Other Players */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ผู้เล่นอื่น
            </h3>
            <div className="space-y-3">
              {otherPlayers.map((player) => (
                <div
                  key={player.gamerId}
                  className={`p-3 rounded-lg border-2 ${
                    player.isCurrentTurn
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {player.displayName || "ผู้เล่น"}
                    </span>
                    {player.isCurrentTurn && (
                      <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                        กำลังเล่น
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: player.cardCount }).map((_, i) => (
                      <CardBack key={i} size="small" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {player.cardCount} ใบ
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Deck & Discard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
              กองไพ่
            </h3>
            <div className="flex justify-center gap-6">
              {/* Deck */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  จั่วไพ่ ({currentSession.remainingDeckCards} ใบ)
                </p>
                <button
                  onClick={handleDrawFromDeck}
                  disabled={hasDrawn || !isMyTurn || isLoading}
                  className={`
                    transition-transform
                    ${hasDrawn || !isMyTurn ? "opacity-50 cursor-not-allowed" : "hover:scale-110 cursor-pointer"}
                  `}
                >
                  <CardBack size="large" />
                </button>
              </div>

              {/* Discard */}
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  กองทิ้ง
                </p>
                {discardTop ? (
                  <button
                    onClick={handleDrawFromDiscard}
                    disabled={hasDrawn || !isMyTurn || isLoading}
                    className={`
                      transition-transform
                      ${hasDrawn || !isMyTurn ? "opacity-50 cursor-not-allowed" : "hover:scale-110 cursor-pointer"}
                    `}
                  >
                    <PlayingCard card={discardTop} size="large" />
                  </button>
                ) : (
                  <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-400">ว่าง</p>
                  </div>
                )}
              </div>
            </div>

            {/* Turn Instructions */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-center text-blue-900 dark:text-blue-300">
                {!isMyTurn && "รอเทิร์นของคุณ"}
                {isMyTurn && !hasDrawn && "🎯 จั่วไพ่จากกอง"}
                {isMyTurn && hasDrawn && selectedCardId && "✅ คลิกทิ้งไพ่เพื่อจบเทิร์น"}
                {isMyTurn && hasDrawn && !selectedCardId && "👆 เลือกไพ่ที่จะทิ้ง"}
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              สถิติ
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ไพ่ในมือ:</span>
                <span className="font-semibold">{myHand.length} ใบ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ไพ่ในสำรับ:</span>
                <span className="font-semibold">{currentSession.remainingDeckCards} ใบ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">รอบปัจจุบัน:</span>
                <span className="font-semibold">{currentSession.roundNumber}</span>
              </div>
            </div>

            <button
              onClick={() => loadGameState(sessionId)}
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* My Hand */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              ไพ่ของคุณ ({myHand.length} ใบ)
            </h3>
            <div className="flex items-center gap-2">
              {isSelectingMeld ? (
                <>
                  <button
                    onClick={handleCancelMeldSelection}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleConfirmMeld}
                    disabled={!canConfirmMeld || isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    เกิดไพ่ ({pendingMeldCardIds.length})
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartMeldSelection}
                  className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                  disabled={!isMyTurn}
                >
                  <Sparkles className="h-4 w-4" />
                  โหมดเกิดไพ่
                </button>
              )}

              <button
                onClick={handleDiscard}
                disabled={!isMyTurn || !hasDrawn || !selectedCardId || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedCardId ? "ทิ้งไพ่ใบนี้" : "เลือกไพ่เพื่อทิ้ง"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {myHand.map((card) => (
              <PlayingCard
                key={card.id}
                card={card}
                onClick={() =>
                  isSelectingMeld
                    ? handleToggleMeldCard(card.id)
                    : handleSelectCard(card.id)
                }
                selected={
                  isSelectingMeld
                    ? pendingMeldSet.has(card.id)
                    : card.id === selectedCardId
                }
                disabled={!isMyTurn || (!isSelectingMeld && !hasDrawn)}
              />
            ))}
          </div>

          {guidanceMessage && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                {guidanceMessage}
              </p>
            </div>
          )}

          {isSelectingMeld && (
            <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-4">
              เลือกไพ่ให้ครบอย่างน้อย 3 ใบเพื่อกด &quot;เกิดไพ่&quot;
            </p>
          )}

          {myHand.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              ไม่มีไพ่ในมือ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
