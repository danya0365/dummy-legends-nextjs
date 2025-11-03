"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  HandCoins,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  XCircle,
  Menu,
  Info,
  LayoutList,
  ListOrdered,
  Flower,
} from "lucide-react";
import { PlayingCard, CardBack } from "../PlayingCard";
import { DiscardStack } from "./DiscardStack";
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
  discardStack,
  isMyTurn,
  hasDrawn: _hasDrawn,
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
  turnActionMode,
  actionAvailability,
  onBack,
  onDrawFromDeck,
  onDrawFromDiscard,
  onSelectDiscardCard,
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
  onSortHandByRank,
  onSortHandBySuit,
}: GamePlayLayoutProps) {
  void _hasDrawn;
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaSize, setArenaSize] = useState({ width: 1600, height: 900 });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const availableLayoffTargets = myMelds.length + tableMelds.length;
  const [activePanel, setActivePanel] = useState<
    "myMelds" | "tableMelds" | "stats" | null
  >(null);

  const isLayoffDisabled = availableLayoffTargets === 0;
  const opponentMeldCount = communityMelds.length;

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

  const resolveMeldOwnerName = useCallback(
    (ownerId: string | null) => {
      if (!ownerId) return "ผู้เล่น";
      if (ownerId === gamerId) return "คุณ";

      const roomPlayer = currentRoom?.players.find(
        (player) => player.userId === ownerId
      );
      if (roomPlayer) {
        return roomPlayer.displayName || roomPlayer.username || "ผู้เล่น";
      }

      const otherPlayer = otherPlayers.find(
        (player) => player.gamerId === ownerId
      );
      return otherPlayer?.displayName || "ผู้เล่น";
    },
    [currentRoom, gamerId, otherPlayers]
  );

  const layoffTargets = useMemo(
    () => [
      ...myMelds.map((meld) => ({
        id: meld.meldId,
        label: `กองของคุณ (${meld.cards.length} ใบ)`,
        cards: meld.cards,
      })),
      ...tableMelds.map((meld) => ({
        id: meld.meldId,
        label: `กองของ ${resolveMeldOwnerName(meld.ownerGamerId)} (${
          meld.cards.length
        } ใบ)`,
        cards: meld.cards,
      })),
    ],
    [myMelds, tableMelds, resolveMeldOwnerName]
  );

  const handleLayoffTargetClick = useCallback(
    (meldId: string) => {
      const nextTarget = selectedLayoffMeldId === meldId ? null : meldId;
      onSelectLayoffTarget(nextTarget);
    },
    [selectedLayoffMeldId, onSelectLayoffTarget]
  );

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
            {totalPlayers} ผู้เล่น (กองคู่แข่ง {opponentMeldCount})
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

                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1 text-xs text-gray-700 shadow dark:bg-slate-800/80 dark:text-gray-200">
                    <div className="flex items-center">
                      {Array.from({ length: maxPreviewCards }).map(
                        (_, previewIndex) => (
                          <div
                            key={previewIndex}
                            className={
                              previewIndex === 0
                                ? "relative"
                                : "relative -ml-5"
                            }
                          >
                            <CardBack size="small" />
                          </div>
                        )
                      )}
                      {remainingCards > 0 && (
                        <span className="ml-2 text-[10px] font-semibold text-gray-500 dark:text-gray-300">
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
                  disabled={!actionAvailability.canDrawFromDeck || isLoading}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold shadow transition ${
                    actionAvailability.canDrawFromDeck && !isLoading
                      ? "border-white/70 bg-white/80 text-blue-600 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-300"
                      : "border-white/40 bg-white/60 text-blue-300/70 cursor-not-allowed dark:border-slate-700/40 dark:bg-slate-800/60"
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

                <DiscardStack
                  stack={discardStack}
                  selectedCardId={selectedDiscardCardId}
                  onSelectCard={onSelectDiscardCard}
                  onDrawFromDiscard={onDrawFromDiscard}
                  drawButtonLabel="เก็บกองทิ้ง"
                  drawButtonDisabled={
                    !actionAvailability.canDrawFromDiscard ||
                    isLoading ||
                    !selectedDiscardCardId
                  }
                  disableSelection={!actionAvailability.canSelectDiscardCard || isLoading}
                  cardSize="large"
                />
              </div>

              <div className="min-h-[32px] text-center text-sm text-blue-900 dark:text-blue-200">
                {guidanceMessage ||
                  (isMyTurn
                    ? (() => {
                        switch (turnActionMode) {
                          case "awaiting_draw":
                            return "เลือกการกระทำในเทิร์นของคุณ - จั่วหรือเก็บกองทิ้ง";
                          case "selecting_discard":
                            return "รวมไพ่จากกองทิ้งกับไพ่ในมือให้ครบ";
                          case "selecting_meld":
                            return "เลือกไพ่เพื่อเตรียมเกิด";
                          case "selecting_layoff":
                            return "เลือกกองเกิดและไพ่ที่จะฝาก";
                          case "awaiting_discard":
                            return selectedCardId
                              ? "กดทิ้งไพ่เพื่อจบเทิร์น"
                              : actionAvailability.canDiscardCard
                              ? "เลือกไพ่ที่จะทิ้ง"
                              : "รอคำสั่งที่อนุญาตให้ทิ้งไพ่";
                          default:
                            return "เลือกการกระทำในเทิร์นของคุณ";
                        }
                      })()
                    : "รอผู้เล่นคนอื่นจัดการเทิร์น")}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
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
                    disabled={!actionAvailability.canStartMeldSelection || isLoading}
                    className="flex items-center gap-2 rounded-full bg-emerald-100 px-6 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
                  >
                    <Sparkles className="h-4 w-4" />
                    โหมดเกิดไพ่
                  </button>
                )}

                {isSelectingLayoff ? (
                  <>
                    <button
                      type="button"
                      onClick={onCancelLayoffSelection}
                      className="flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
                    >
                      <XCircle className="h-4 w-4" />
                      ยกเลิกฝาก
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmLayoff}
                      disabled={!canConfirmLayoff || isLoading}
                      className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HandCoins className="h-4 w-4" />
                      ฝากไพ่ ({pendingLayoffCardIds.length})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onStartLayoffSelection}
                    disabled={
                      !actionAvailability.canStartLayoffSelection ||
                      availableLayoffTargets === 0 ||
                      isLoading
                    }
                    className="flex items-center gap-2 rounded-full bg-indigo-100 px-6 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-200 disabled:opacity-50 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30"
                  >
                    <HandCoins className="h-4 w-4" />
                    โหมดฝากไพ่
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSortHandByRank}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <ListOrdered className="h-4 w-4" />
                    เรียงตามแต้ม
                  </button>
                  <button
                    type="button"
                    onClick={onSortHandBySuit}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-full bg-purple-100 px-5 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-purple-500/20 dark:text-purple-200 dark:hover:bg-purple-500/30"
                  >
                    <Flower className="h-4 w-4" />
                    เรียงตามดอก
                  </button>
                  <button
                    type="button"
                    onClick={onDiscard}
                    disabled={!actionAvailability.canDiscardCard || !selectedCardId || isLoading}
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
                      (!actionAvailability.canSelectHandCard &&
                        !isSelectingMeld &&
                        !isSelectingLayoff)
                    }
                  />
                ))}
              </div>

              {isSelectingLayoff && layoffTargets.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {layoffTargets.map((target) => {
                    const isSelected = selectedLayoffMeldId === target.id;
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => handleLayoffTargetClick(target.id)}
                        disabled={isLayoffDisabled}
                        className={`rounded-2xl border px-4 py-2 text-sm transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-200"
                            : "border-gray-200 bg-white/80 text-gray-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-gray-200 dark:hover:border-indigo-400"
                        } ${isLayoffDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {target.label}
                      </button>
                    );
                  })}
                </div>
              )}
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
                    communityMelds.map((meld) => {
                      const isTarget = selectedLayoffMeldId === meld.meldId;
                      return (
                        <button
                          key={meld.meldId}
                          type="button"
                          onClick={() => handleLayoffTargetClick(meld.meldId)}
                          disabled={isLayoffDisabled}
                          className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                            isTarget
                              ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/20"
                              : "border-gray-200 bg-white/80 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-indigo-400"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                            <span>{resolveMeldOwnerName(meld.ownerGamerId)}</span>
                            <span>{meld.cards.length} ใบ</span>
                          </div>
                          {renderMeldCards(meld.cards)}
                        </button>
                      );
                    })
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
