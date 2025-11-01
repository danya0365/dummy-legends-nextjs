"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  XCircle,
  Menu,
  Info,
  LayoutList,
} from "lucide-react";
import { PlayingCard, CardBack } from "../PlayingCard";
import type { GameCard } from "@/src/domain/types/gameplay.types";
import type { GamePlayLayoutProps } from "./types";
import { computeCircularPositions } from "./utils";

const renderMeldCards = (cards: GameCard[]) => (
  <div className="flex flex-wrap justify-center gap-2">
    {cards.map((card) => (
      <PlayingCard key={card.id} card={card} size="small" />
    ))}
  </div>
);

export function GamePlayLandscape({
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
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaSize, setArenaSize] = useState({ width: 1600, height: 900 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "myMelds" | "tableMelds" | "stats" | null
  >(null);

  useEffect(() => {
    const updateSize = () => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      setArenaSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, []);

  const opponentPositions = useMemo(
    () =>
      computeCircularPositions(
        otherPlayers.length,
        arenaSize,
        0.42,
        -Math.PI / 2
      ),
    [arenaSize, otherPlayers.length]
  );

  const totalPlayers =
    (currentRoom?.players.length ?? 0) || otherPlayers.length + 1;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-green-200 via-blue-100 to-teal-100 text-gray-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-gray-100">
      <header className="flex items-center justify-between px-10 py-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full bg-white/80 px-6 py-3 text-sm font-semibold text-gray-700 shadow transition hover:bg-white dark:bg-slate-800/70 dark:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          ออกจากเกม
        </button>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              รอบที่ {currentSession.roundNumber}
            </p>
            <p className="text-xl font-semibold">
              {isMyTurn ? "🎯 ถึงเทิร์นของคุณ" : `รอ ${currentTurnPlayerName}`}
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <path
                className="text-gray-300 dark:text-slate-700"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeLinecap="round"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  remainingSeconds <= 10 ? "text-red-500" : "text-emerald-500"
                }
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${timerPercentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-lg font-bold ${
                  remainingSeconds <= 10 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {formattedRemaining}
              </span>
              <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400">
                / {turnTimeLimit}s
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-gray-700 shadow dark:bg-slate-800/70 dark:text-gray-200">
            <Users className="h-4 w-4" />
            {totalPlayers} ผู้เล่น
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            รีเฟรช
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 shadow transition hover:bg-white dark:bg-slate-800/70 dark:text-gray-200"
          >
            <Menu className="h-4 w-4" />
            เมนู
          </button>
        </div>
      </header>

      {isGameFinished && (
        <div className="absolute left-1/2 top-24 z-30 flex w-[520px] -translate-x-1/2 items-center gap-4 rounded-3xl border border-emerald-300 bg-emerald-50/90 px-6 py-4 shadow-xl dark:border-emerald-700 dark:bg-emerald-900/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              เกมจบแล้ว! {didIWin ? "คุณเป็นผู้ชนะ" : `${winnerName} ชนะเกมนี้`}
            </p>
            {winningTypeLabel && (
              <p className="text-sm text-emerald-600/80 dark:text-emerald-200/80">
                วิธีชนะ: {winningTypeLabel}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-1/2 top-36 z-30 flex w-[520px] -translate-x-1/2 items-center gap-2 rounded-3xl border border-red-300 bg-red-50/90 px-6 py-3 text-sm text-red-700 shadow-xl dark:border-red-700 dark:bg-red-900/40 dark:text-red-200">
          <Info className="h-4 w-4" />
          {error}
        </div>
      )}

      <main className="relative flex flex-1 items-center justify-center px-8 pb-6">
        <div
          ref={arenaRef}
          className="relative flex aspect-[16/9] w-full max-w-[1400px] flex-col items-center justify-center overflow-hidden rounded-[40px] border border-white/60 bg-white/55 backdrop-blur-lg shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/70"
        >
          <div className="pointer-events-none absolute inset-0">
            {otherPlayers.map((player, index) => {
              const position = opponentPositions[index];
              if (!position) return null;

              const maxPreviewCards = Math.min(player.cardCount, 5);
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
                    className={`flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-semibold shadow ${
                      player.isCurrentTurn
                        ? "border-yellow-400 bg-yellow-100/90 text-yellow-700"
                        : "border-white/70 bg-white/80 text-gray-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-gray-200"
                    }`}
                  >
                    {player.isHost && <span>👑</span>}
                    <span className="max-w-[120px] truncate">
                      {player.displayName || "ผู้เล่น"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1 text-xs text-gray-700 shadow dark:bg-slate-800/80 dark:text-gray-200">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: maxPreviewCards }).map(
                        (_, previewIndex) => (
                          <CardBack key={previewIndex} size="small" />
                        )
                      )}
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

          <div className="relative flex h-full w-full flex-col items-center justify-center">
            <div className="relative flex w-[520px] flex-col items-center gap-6 rounded-3xl border border-white/70 bg-white/80 px-8 py-6 text-gray-800 shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:text-gray-200">
              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={onDrawFromDeck}
                  disabled={hasDrawn || !isMyTurn || isLoading}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-blue-600 shadow transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-300 ${
                    hasDrawn || !isMyTurn ? "opacity-50" : ""
                  }`}
                >
                  <CardBack size="large" />
                  <span>จั่ว ({currentSession.remainingDeckCards})</span>
                </button>

                <div className="flex flex-col items-center">
                  <div
                    className={`text-3xl font-bold ${
                      remainingSeconds <= 10
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formattedRemaining}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    เวลาต่อเทิร์น
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {turnTimeLimit} วินาที
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onDrawFromDiscard}
                  disabled={hasDrawn || !isMyTurn || isLoading || !discardTop}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-purple-600 shadow transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-purple-300 ${
                    hasDrawn || !isMyTurn || !discardTop ? "opacity-50" : ""
                  }`}
                >
                  {discardTop ? (
                    <PlayingCard card={discardTop} size="large" />
                  ) : (
                    <CardBack size="large" />
                  )}
                  <span>เก็บกองทิ้ง</span>
                </button>
              </div>

              <div className="min-h-[32px] text-center text-sm text-blue-900 dark:text-blue-200">
                {guidanceMessage ||
                  (isMyTurn
                    ? "เลือกการกระทำในเทิร์นของคุณ"
                    : "รอผู้เล่นคนอื่นจัดการเทิร์น")}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                {isSelectingMeld ? (
                  <>
                    <button
                      type="button"
                      onClick={onCancelMeldSelection}
                      className="flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
                    >
                      <XCircle className="h-4 w-4" />
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmMeld}
                      disabled={!canConfirmMeld || isLoading}
                      className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex items-center gap-2 rounded-full bg-emerald-100 px-6 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                  >
                    <Sparkles className="h-4 w-4" />
                    โหมดเกิดไพ่
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDiscard}
                  disabled={
                    !isMyTurn || !hasDrawn || !selectedCardId || isLoading
                  }
                  className="rounded-full bg-blue-600 px-7 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedCardId ? "ทิ้งไพ่ใบนี้" : "เลือกไพ่เพื่อทิ้ง"}
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {myHand.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    size="medium"
                    onClick={() =>
                      isSelectingMeld
                        ? onToggleMeldCard(card.id)
                        : onSelectCard(card.id)
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
            </div>
          </div>
        </div>

        <aside
          className={`absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-3 transition-transform ${
            isSidebarOpen ? "translate-x-0" : "translate-x-[220px]"
          }`}
        >
          <button
            type="button"
            onClick={() => setActivePanel("myMelds")}
            className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200"
          >
            <LayoutList className="h-4 w-4" />
            ไพ่ที่คุณเกิด ({myMelds.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("tableMelds")}
            className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 shadow hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-200"
          >
            <LayoutList className="h-4 w-4" />
            ไพ่บนโต๊ะ ({communityMelds.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("stats")}
            className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 shadow hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-200"
          >
            <Info className="h-4 w-4" />
            ข้อมูลเกม
          </button>
        </aside>
      </main>

      {activePanel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="h-[80vh] w-[680px] rounded-3xl bg-white p-8 text-gray-800 shadow-2xl dark:bg-slate-900 dark:text-gray-100">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
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

            <div className="h-[calc(80vh-120px)] overflow-y-auto pr-2">
              {activePanel === "myMelds" && (
                <div className="space-y-4">
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
                <div className="space-y-4">
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
                            เจ้าของกอง:{" "}
                            {currentRoom?.players.find(
                              (player) => player.userId === meld.ownerGamerId
                            )?.displayName ||
                              (meld.ownerGamerId === gamerId
                                ? "คุณ"
                                : "คู่แข่ง")}
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
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      สถานะเกม
                    </h4>
                    <div className="mt-3 space-y-2">
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
                    <h4 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                      ผู้เล่นในห้อง
                    </h4>
                    <div className="mt-3 space-y-2">
                      {(currentRoom?.players ?? []).map((player) => (
                        <div
                          key={player.userId}
                          className="flex items-center justify-between"
                        >
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
        </div>
      )}
    </div>
  );
}
