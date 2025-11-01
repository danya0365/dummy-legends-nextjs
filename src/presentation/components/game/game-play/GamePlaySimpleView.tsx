"use client";

import {
  ArrowLeft,
  HandCoins,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { CardBack, PlayingCard } from "../PlayingCard";
import { GamePlayLayoutProps } from "./types";

export function GamePlaySimpleView({
  currentRoom,
  currentSession,
  gamerId,
  otherPlayers,
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
  selectedLayoffMeldId,
  isLoading,
  error,
  currentTurnPlayerName,
  onBack,
  onDrawFromDeck,
  onDrawFromDiscard,
  onSelectCard,
  onToggleMeldCard,
  onStartMeldSelection,
  onCancelMeldSelection,
  onConfirmMeld,
  onToggleLayoffCard,
  onStartLayoffSelection,
  onCancelLayoffSelection,
  onConfirmLayoff,
  onSelectLayoffTarget,
  onDiscard,
  onRefresh,
}: GamePlayLayoutProps) {
  const availableLayoffTargets = myMelds.length + tableMelds.length;
  const opponentMeldCount = communityMelds.length;

  const handleLayoffTargetClick = (meldId: string) => {
    const nextTarget = selectedLayoffMeldId === meldId ? null : meldId;
    onSelectLayoffTarget(nextTarget);
  };

  const resolveMeldOwnerName = (ownerId: string | null) => {
    if (!ownerId) return "ผู้เล่น";
    if (ownerId === gamerId) return "คุณ";

    const roomPlayer = currentRoom?.players.find((player) => player.userId === ownerId);
    if (roomPlayer) {
      return roomPlayer.displayName || roomPlayer.username || "ผู้เล่น";
    }

    const otherPlayer = otherPlayers.find((player) => player.gamerId === ownerId);
    return otherPlayer?.displayName || "ผู้เล่น";
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <button
            onClick={() => onBack()}
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
              {isMyTurn
                ? "🎯 ถึงเทิร์นของคุณ!"
                : `รอ ${currentTurnPlayerName}...`}
            </p>
            <div className="mt-2 w-40 mx-auto">
              <div
                className={`text-lg font-bold ${
                  isMyTurn
                    ? remainingSeconds <= 10
                      ? "text-red-600"
                      : "text-emerald-600"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {formattedRemaining}
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    remainingSeconds <= 10 ? "bg-red-500" : "bg-emerald-500"
                  } transition-all duration-500`}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                จำกัด {turnTimeLimit} วินาทีต่อเทิร์น
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>{otherPlayers.length + 1} ผู้เล่น</span>
          </div>
        </div>

        {isGameFinished && (
          <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  เกมจบแล้ว!{" "}
                  {didIWin ? "คุณเป็นผู้ชนะ" : `${winnerName} ชนะเกมนี้`}
                </p>
                {winningTypeLabel && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    วิธีชนะ: {winningTypeLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
              {otherPlayers.map((player) => {
                const previewCount = Math.min(player.cardCount, 6);
                const remainingCards = player.cardCount - previewCount;

                return (
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
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center">
                        {Array.from({ length: previewCount }).map((_, index) => (
                          <div
                            key={index}
                            className={index === 0 ? "relative" : "relative -ml-5"}
                          >
                            <CardBack size="small" />
                          </div>
                        ))}
                        {remainingCards > 0 && (
                          <span className="ml-3 text-xs font-semibold text-gray-500 dark:text-gray-300">
                            +{remainingCards}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {player.cardCount} ใบ
                      </span>
                    </div>
                  </div>
                );
              })}
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
                  onClick={onDrawFromDeck}
                  disabled={hasDrawn || !isMyTurn || isLoading}
                  className={`
                    transition-transform
                    ${
                      hasDrawn || !isMyTurn
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-110 cursor-pointer"
                    }
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
                    onClick={onDrawFromDiscard}
                    disabled={hasDrawn || !isMyTurn || isLoading}
                    className={`
                      transition-transform
                      ${
                        hasDrawn || !isMyTurn
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-110 cursor-pointer"
                      }
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
                {isMyTurn &&
                  hasDrawn &&
                  selectedCardId &&
                  "✅ คลิกทิ้งไพ่เพื่อจบเทิร์น"}
                {isMyTurn &&
                  hasDrawn &&
                  !selectedCardId &&
                  "👆 เลือกไพ่ที่จะทิ้ง"}
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
                <span className="text-gray-600 dark:text-gray-400">
                  ไพ่ในมือ:
                </span>
                <span className="font-semibold">{myHand.length} ใบ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  ไพ่ในสำรับ:
                </span>
                <span className="font-semibold">
                  {currentSession.remainingDeckCards} ใบ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  รอบปัจจุบัน:
                </span>
                <span className="font-semibold">
                  {currentSession.roundNumber}
                </span>
              </div>
            </div>

            <button
              onClick={() => onRefresh()}
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
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
            <div className="flex flex-wrap items-center gap-2">
              {isSelectingMeld ? (
                <>
                  <button
                    onClick={onCancelMeldSelection}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    ยกเลิก
                  </button>
                  <button
                    onClick={onConfirmMeld}
                    disabled={!canConfirmMeld || isLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    เกิดไพ่ ({pendingMeldCardIds.length})
                  </button>
                </>
              ) : (
                <button
                  onClick={onStartMeldSelection}
                  className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-2"
                  disabled={!isMyTurn}
                >
                  <Sparkles className="h-4 w-4" />
                  โหมดเกิดไพ่
                </button>
              )}

              {isSelectingLayoff ? (
                <>
                  <button
                    onClick={onCancelLayoffSelection}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    ยกเลิกฝาก
                  </button>
                  <button
                    onClick={onConfirmLayoff}
                    disabled={!canConfirmLayoff || isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <HandCoins className="h-4 w-4" />
                    ฝากไพ่ ({pendingLayoffCardIds.length})
                  </button>
                </>
              ) : (
                <button
                  onClick={onStartLayoffSelection}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-2"
                  disabled={!isMyTurn || availableLayoffTargets === 0}
                >
                  <HandCoins className="h-4 w-4" />
                  โหมดฝากไพ่
                </button>
              )}

              <button
                onClick={onDiscard}
                disabled={
                  !isMyTurn || !hasDrawn || !selectedCardId || isLoading
                }
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
                    ? onToggleMeldCard(card.id)
                    : isSelectingLayoff
                    ? onToggleLayoffCard(card.id)
                    : onSelectCard(card.id)
                }
                selected={
                  isSelectingMeld
                    ? pendingMeldSet.has(card.id)
                    : isSelectingLayoff
                    ? pendingLayoffSet.has(card.id)
                    : card.id === selectedCardId
                }
                disabled={
                  !isMyTurn || (!isSelectingMeld && !isSelectingLayoff && !hasDrawn)
                }
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

        {/* Meld Sections */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                ไพ่ที่คุณเกิด / ฝาก
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {myMelds.length} กอง
              </span>
            </div>

            {myMelds.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ยังไม่มีไพ่ที่คุณเกิดในรอบนี้ ลองจัดชุดแล้วกด
                  &quot;เกิดไพ่&quot; เพื่อเริ่มทำคะแนน
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myMelds.map((meld) => {
                  const isTarget = selectedLayoffMeldId === meld.meldId;
                  return (
                    <button
                      key={meld.meldId}
                      type="button"
                      onClick={() => handleLayoffTargetClick(meld.meldId)}
                      disabled={!isSelectingLayoff || availableLayoffTargets === 0}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isTarget
                          ? "border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700"
                          : "border-gray-200 dark:border-gray-700"
                      } ${
                        isSelectingLayoff
                          ? "hover:border-indigo-400 focus:outline-none"
                          : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>กอง {meld.cards.length} ใบ</span>
                        {isTarget && isSelectingLayoff && (
                          <span className="text-indigo-500 dark:text-indigo-300 font-medium">
                            เลือกฝากไพ่ที่นี่
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {meld.cards.map((card) => (
                          <PlayingCard key={card.id} card={card} size="small" />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                กองไพ่บนโต๊ะ
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tableMelds.length} กอง (คู่แข่ง {opponentMeldCount})
              </span>
            </div>

            <div className="space-y-3">
              {tableMelds.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  ยังไม่มีไพ่กองกลาง
                </p>
              ) : (
                tableMelds.map((meld) => {
                  const isTarget = selectedLayoffMeldId === meld.meldId;
                  return (
                    <button
                      key={meld.meldId}
                      type="button"
                      onClick={() => handleLayoffTargetClick(meld.meldId)}
                      disabled={!isSelectingLayoff}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isTarget
                          ? "border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700"
                          : "border-gray-200 dark:border-gray-700"
                      } ${
                        isSelectingLayoff
                          ? "hover:border-indigo-400 focus:outline-none"
                          : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          กองของ {resolveMeldOwnerName(meld.ownerGamerId)} ({
                            meld.cards.length
                          } ใบ)
                        </span>
                        {isTarget && isSelectingLayoff && (
                          <span className="text-indigo-500 dark:text-indigo-300 font-medium">
                            เลือกฝากไพ่ที่นี่
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {meld.cards.map((card) => (
                          <PlayingCard key={card.id} card={card} size="small" />
                        ))}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
