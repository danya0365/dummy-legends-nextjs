"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/src/stores/gameStore";
import { PlayingCard, CardBack } from "./PlayingCard";
import { Users, ArrowLeft, RefreshCw } from "lucide-react";

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
    drawCard,
    discardCard,
    unsubscribeFromGame,
    isLoading,
    error,
  } = useGameStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [pendingMeldCardIds, setPendingMeldCardIds] = useState<string[]>([]);

  useEffect(() => {
    // Load game state
    loadGameState(sessionId);

    // Cleanup on unmount
    return () => {
      unsubscribeFromGame();
    };
  }, [sessionId, loadGameState, unsubscribeFromGame]);

  const handleDrawFromDeck = async () => {
    if (hasDrawn || !isMyTurn) return;
    try {
      await drawCard(true);
      setHasDrawn(true);
    } catch (error) {
      console.error("Draw from deck error:", error);
    }
  };

  const handleDrawFromDiscard = async () => {
    if (hasDrawn || !isMyTurn) return;
    try {
      if (pendingMeldCardIds.length === 0) {
        throw new Error("ต้องเลือกไพ่ที่จะใช้เกิดก่อนเก็บจากกองทิ้ง");
      }

      const meldCards = discardTop
        ? Array.from(new Set([discardTop.id, ...pendingMeldCardIds]))
        : pendingMeldCardIds;

      await drawCard(false, { meldCards });
      setHasDrawn(true);
      setPendingMeldCardIds([]);
    } catch (error) {
      console.error("Draw from discard error:", error);
    }
  };

  const handleSelectCard = (cardId: string) => {
    if (!hasDrawn || !isMyTurn) return;
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  const handleDiscard = async () => {
    if (!selectedCardId || !hasDrawn || !isMyTurn) return;
    try {
      await discardCard(selectedCardId);
      setSelectedCardId(null);
      setHasDrawn(false);
    } catch (error) {
      console.error("Discard error:", error);
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
            {hasDrawn && selectedCardId && (
              <button
                onClick={handleDiscard}
                disabled={!isMyTurn || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ทิ้งไพ่ใบนี้
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {myHand.map((card) => (
              <PlayingCard
                key={card.id}
                card={card}
                onClick={() => handleSelectCard(card.id)}
                selected={card.id === selectedCardId}
                disabled={!hasDrawn || !isMyTurn}
              />
            ))}
          </div>

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
