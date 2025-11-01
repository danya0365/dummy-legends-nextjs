"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { PlayingCard, CardBack } from "../PlayingCard";
import type { GameCard } from "@/src/domain/types/gameplay.types";
import type { GamePlayLayoutProps } from "./types";
import { computeCircularPositions } from "./utils";

const CARD_RADIUS_FACTOR = 0.38;

const renderMeldCards = (cards: GameCard[]) => (
  <div className="flex flex-wrap justify-center gap-2">
    {cards.map((card) => (
      <PlayingCard key={card.id} card={card} size="small" />
    ))}
  </div>
);

export function GamePlayPortrait({
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
  isSelectingMeld,
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
  onDiscard,
  onRefresh,
}: GamePlayLayoutProps) {
  const [activePanel, setActivePanel] = useState<
    "myMelds" | "tableMelds" | "stats" | null
  >(null);

  const opponentPositions = useMemo(
    () =>
      computeCircularPositions(
        otherPlayers.length,
        { width: 1000, height: 1000 },
        CARD_RADIUS_FACTOR
      ),
    [otherPlayers.length]
  );

  const totalPlayers = (currentRoom?.players.length ?? 0) || otherPlayers.length + 1;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-green-200 via-blue-100 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white dark:bg-slate-800/70 dark:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          ออกจากเกม
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            รอบที่ {currentSession.roundNumber}
          </p>
          <p className="text-lg font-semibold">
            {isMyTurn ? "🎯 ถึงเทิร์นของคุณ" : `รอ ${currentTurnPlayerName}`}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${
                remainingSeconds <= 10 ? "bg-red-500/20 text-red-600" : "bg-emerald-500/20 text-emerald-700"
              }`}
            >
              <span className="text-base font-bold">{formattedRemaining}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                / {turnTimeLimit}s
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs text-gray-600 shadow dark:bg-slate-800/70 dark:text-gray-300">
              <Users className="h-3.5 w-3.5" />
              {totalPlayers} ผู้เล่น
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-white dark:bg-slate-800/70 dark:text-blue-300"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </header>

      {/* Status banners */}
      {isGameFinished && (
        <div className="absolute left-1/2 top-24 z-30 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-center shadow-lg dark:border-emerald-700 dark:bg-emerald-900/40">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                เกมจบแล้ว! {didIWin ? "คุณเป็นผู้ชนะ" : `${winnerName} ชนะเกมนี้`}
              </p>
              {winningTypeLabel && (
                <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                  วิธีชนะ: {winningTypeLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-1/2 top-32 z-30 w-[90%] max-w-sm -translate-x-1/2 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-800 dark:bg-red-900/70 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Arena */}
      <main className="relative flex flex-1 flex-col items-center justify-center">
        {/* Opponents */}
        <div className="pointer-events-none absolute inset-0">
          {otherPlayers.map((player, index) => {
            const position = opponentPositions[index];
            if (!position) return null;

            const maxPreviewCards = Math.min(player.cardCount, 4);
            const remainingCards = player.cardCount - maxPreviewCards;

            return (
              <div
                key={player.gamerId}
                style={{
                  left: `${position.left}%`,
                  top: `${position.top}%`,
                }}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
              >
                <div
                  className={`flex items-center gap-1 rounded-full border-2 px-2 py-1 text-xs font-semibold shadow ${
                    player.isCurrentTurn
                      ? "border-yellow-400 bg-yellow-100/90 text-yellow-700"
                      : "border-white/60 bg-white/70 text-gray-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-gray-200"
                  }`}
                >
                  {player.isHost && <span>👑</span>}
                  <span className="truncate max-w-[90px]">{player.displayName || "ผู้เล่น"}</span>
                </div>

                <div className="mt-2 flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1 text-xs text-gray-700 shadow dark:bg-slate-800/80 dark:text-gray-200">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: maxPreviewCards }).map((_, previewIndex) => (
                      <CardBack key={previewIndex} size="small" />
                    ))}
                    {remainingCards > 0 && (
                      <span className="ml-1 text-[10px] font-semibold text-gray-500 dark:text-gray-300">
                        +{remainingCards}
                      </span>
                    )}
                  </div>
                  <span>{player.cardCount} ใบ</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center board */}
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/60 bg-white/60 px-6 py-8 backdrop-blur-md shadow-2xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="relative h-32 w-32">
            <div className="absolute inset-0 rounded-full border-[10px] border-white/40" />
            <div
              className="absolute inset-1.5 rounded-full border-[10px] border-emerald-500/60"
              style={{
                background: `conic-gradient(#10b981 ${timerPercentage}%, rgba(16,185,129,0.15) ${timerPercentage}% 100%)`,
              }}
            />
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-inner dark:bg-slate-900/80 dark:text-emerald-300">
              <span className="text-xl font-bold">{formattedRemaining}</span>
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                เทิร์น
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={onDrawFromDeck}
              disabled={hasDrawn || !isMyTurn || isLoading}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-blue-600 shadow transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-300 ${
                hasDrawn || !isMyTurn ? "opacity-50" : ""
              }`}
            >
              <CardBack size="large" />
              <span>จั่ว ({currentSession.remainingDeckCards})</span>
            </button>

            <button
              type="button"
              onClick={onDrawFromDiscard}
              disabled={hasDrawn || !isMyTurn || isLoading || !discardTop}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-purple-600 shadow transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-purple-300 ${
                hasDrawn || !isMyTurn || !discardTop ? "opacity-50" : ""
              }`}
            >
              {discardTop ? <PlayingCard card={discardTop} size="large" /> : <CardBack size="large" />}
              <span>เก็บกองทิ้ง</span>
            </button>
          </div>

          <div className="min-h-[32px] text-center text-sm text-blue-900 dark:text-blue-200">
            {guidanceMessage || (isMyTurn ? "เลือกรูปแบบการเล่นในเทิร์นของคุณ" : "รอผู้เล่นอื่นจัดการเทิร์นของเขา")}
          </div>
        </div>
      </main>

      {/* Footer - player controls */}
      <footer className="relative z-20 mt-auto w-full bg-white/90 px-5 pb-6 pt-4 text-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] backdrop-blur-md dark:bg-slate-900/80 dark:text-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isSelectingMeld ? (
              <>
                <button
                  type="button"
                  onClick={onCancelMeldSelection}
                  className="flex items-center gap-1 rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
                >
                  <XCircle className="h-4 w-4" />
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={onConfirmMeld}
                  disabled={!canConfirmMeld || isLoading}
                  className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  เกิดไพ่ ({pendingMeldCardIds.length})
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartMeldSelection}
                disabled={!isMyTurn}
                className="flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
              >
                <Sparkles className="h-4 w-4" />
                โหมดเกิดไพ่
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onDiscard}
            disabled={!isMyTurn || !hasDrawn || !selectedCardId || isLoading}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedCardId ? "ทิ้งไพ่ใบนี้" : "เลือกไพ่เพื่อทิ้ง"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {myHand.map((card) => (
            <PlayingCard
              key={card.id}
              card={card}
              size="medium"
              onClick={() =>
                isSelectingMeld ? onToggleMeldCard(card.id) : onSelectCard(card.id)
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
          <p className="mt-3 text-center text-xs text-amber-700 dark:text-amber-300">
            {guidanceMessage}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActivePanel("myMelds")}
            className="rounded-2xl bg-emerald-100/80 px-4 py-3 text-emerald-700 shadow-sm transition hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200"
          >
            ไพ่ที่คุณเกิด ({myMelds.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("tableMelds")}
            className="rounded-2xl bg-purple-100/80 px-4 py-3 text-purple-700 shadow-sm transition hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-200"
          >
            ไพ่บนโต๊ะ ({communityMelds.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("stats")}
            className="rounded-2xl bg-blue-100/80 px-4 py-3 text-blue-700 shadow-sm transition hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-200"
          >
            ข้อมูลเกม
          </button>
        </div>
      </footer>

      {/* Bottom sheets */}
      {activePanel && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/50 backdrop-blur-sm">
          <div className="max-h-[75vh] w-full rounded-t-3xl bg-white p-6 text-gray-800 shadow-2xl dark:bg-slate-900 dark:text-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {activePanel === "myMelds" && "ไพ่ที่คุณเกิด / ฝาก"}
                {activePanel === "tableMelds" && "ไพ่ที่เกิดบนโต๊ะ"}
                {activePanel === "stats" && "ข้อมูลเกม"}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {activePanel === "myMelds" && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {myMelds.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ยังไม่มีไพ่ที่คุณเกิดในรอบนี้
                  </p>
                ) : (
                  myMelds.map((meld, index) => (
                    <div
                      key={meld.meldId}
                      className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                        <span>ชุดที่ {index + 1}</span>
                        <span>{meld.cards.length} ใบ</span>
                      </div>
                      {renderMeldCards(meld.cards)}
                    </div>
                  ))
                )}
              </div>
            )}

            {activePanel === "tableMelds" && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {communityMelds.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ยังไม่มีผู้เล่นอื่นเกิดไพ่บนโต๊ะ
                  </p>
                ) : (
                  communityMelds.map((meld) => (
                    <div
                      key={meld.meldId}
                      className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                        <span>
                          เจ้าของกอง: {
                            currentRoom?.players.find((player) => player.userId === meld.ownerGamerId)
                              ?.displayName ||
                            (meld.ownerGamerId === gamerId ? "คุณ" : "คู่แข่ง")
                          }
                        </span>
                        <span>{meld.cards.length} ใบ</span>
                      </div>
                      {renderMeldCards(meld.cards)}
                    </div>
                  ))
                )}
              </div>
            )}

            {activePanel === "stats" && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    สถานะเกม
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>รอบปัจจุบัน</span>
                      <span>{currentSession.roundNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ไพ่ในสำรับ</span>
                      <span>{currentSession.remainingDeckCards} ใบ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>กองบนโต๊ะทั้งหมด</span>
                      <span>{tableMelds.length} กอง</span>
                    </div>
                    <div className="flex justify-between">
                      <span>เวลาต่อเทิร์น</span>
                      <span>{turnTimeLimit} วินาที</span>
                    </div>
                    <div className="flex justify-between">
                      <span>คนที่ถึงเทิร์น</span>
                      <span>{isMyTurn ? "คุณ" : currentTurnPlayerName}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    ผู้เล่นในห้อง
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {(currentRoom?.players ?? []).map((player) => (
                      <div key={player.userId} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {player.isHost && <span>👑</span>}
                          {player.displayName || player.username}
                          {player.userId === gamerId && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                              คุณ
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {player.isReady ? "พร้อม" : "ยังไม่พร้อม"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
