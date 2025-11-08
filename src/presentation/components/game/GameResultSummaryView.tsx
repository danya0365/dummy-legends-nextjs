"use client";

import { useMemo } from "react";
import {
  GameResultPlayerSummary,
  GameResultMeld,
  GameScoreEventEntry,
} from "@/src/domain/types/gameplay.types";
import { useGameResultSummary } from "@/src/presentation/presenters/game/useGameResultSummary";
import { cn } from "@/src/utils/cn";

interface GameResultSummaryViewProps {
  sessionId?: string;
  roomId?: string;
  onClose?: () => void;
}

interface PlayerDisplayCardProps {
  player: GameResultPlayerSummary;
  isCurrentUser: boolean;
  melds: GameResultMeld[];
  scoreEvents: GameScoreEventEntry[];
}

const eventIconMap: Record<string, string> = {
  head_bonus: "🔥",
  spe_to_meld_bonus: "⭐",
  spe_to_deposit_bonus: "⭐",
  knock_bonus: "🏆",
  dark_knock_bonus: "🌙",
  color_knock_bonus: "🌈",
  dark_color_knock_bonus: "🌈",
  hand_penalty: "⚠️",
  dummy_penalty: "⚠️",
  head_penalty: "⚠️",
  full_penalty: "⚠️",
  spe_to_penalty: "⚠️",
  foolish_penalty: "⚠️",
};

function formatPoints(value: number): string {
  if (value === 0) return "0P";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}P`;
}

function PlayerDisplayCard({
  player,
  isCurrentUser,
  melds,
  scoreEvents,
}: PlayerDisplayCardProps) {
  const playerMelds = useMemo(
    () =>
      melds.filter((meld) =>
        player.displayedMeldIds.includes(meld.id)
      ),
    [melds, player.displayedMeldIds]
  );

  const playerEvents = useMemo(
    () => scoreEvents.filter((event) => event.gamerId === player.gamerId),
    [scoreEvents, player.gamerId]
  );

  const metadata = player.metadata ?? {};
  const displayName =
    typeof metadata.displayName === "string"
      ? metadata.displayName
      : undefined;
  const isCurrent =
    typeof metadata.isCurrentUser === "boolean" ? metadata.isCurrentUser : false;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/70",
        player.isWinner
          ? "border-yellow-400 shadow-[0_0_20px_1px_rgba(234,179,8,0.35)] dark:border-yellow-500"
          : "border-gray-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {player.isWinner && <span className="text-amber-500">🏆</span>}
            <span>
              {displayName ?? `ผู้เล่น ${player.position}`}
              {(isCurrentUser || isCurrent) && (
                <span className="ml-2 text-sm text-emerald-400">(คุณ)</span>
              )}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            อันดับที่ {player.position} • คะแนนรวม {formatPoints(player.totalPoints)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-medium text-white dark:bg-slate-200 dark:text-slate-900">
          รวม {formatPoints(player.totalPoints)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">เกิด / ฝาก</div>
          <div className="text-base font-medium text-slate-800 dark:text-slate-100">
            {formatPoints(player.meldPoints)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">โบนัสพิเศษ</div>
          <div className={cn(
            "text-base font-medium",
            player.bonusPoints >= 0 ? "text-emerald-600" : "text-rose-500"
          )}>
            {formatPoints(player.bonusPoints)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">แต้มติดมือ</div>
          <div className={cn(
            "text-base font-medium",
            player.handPoints <= 0 ? "text-emerald-600" : "text-rose-500"
          )}>
            {formatPoints(player.handPoints)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">แต้มตัด</div>
          <div className={cn(
            "text-base font-medium",
            player.penaltyPoints <= 0 ? "text-emerald-600" : "text-rose-500"
          )}>
            {formatPoints(player.penaltyPoints)}
          </div>
        </div>
      </div>

      {playerEvents.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {playerEvents.map((event) => (
            <span
              key={event.id}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300"
            >
              <span className="mr-1">
                {eventIconMap[event.eventType] ?? "⭐"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {event.eventType.replace(/_/g, " ")}
              </span>
            </span>
          ))}
        </div>
      )}

      {playerMelds.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">ชุดไพ่ที่เกิด</div>
          <div className="space-y-2">
            {playerMelds.map((meld) => (
              <div
                key={meld.id}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {meld.meldType === "run" ? "เรียง" : "ตอง"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {meld.cards.map((card) => `${card.rank}${card.suit[0].toUpperCase()}`).join(" • ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {player.remainingCards.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">ไพ่ที่ค้างอยู่ในมือ</div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
            {player.remainingCards.map((card) => (
              <span
                key={card.id}
                className="rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
              >
                {card.rank}
                {card.suit[0].toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GameResultSummaryView({
  sessionId,
  roomId,
  onClose,
}: GameResultSummaryViewProps) {
  const [state] = useGameResultSummary(sessionId, roomId);

  const hasRoom = !!roomId;
  const hasSession = !!sessionId;
  const isEmpty = !state.summary && !state.loading && !state.error;

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            สรุปผลเกม
          </h2>
          {state.summary && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              รอบที่ {state.summary.totalRounds} • ใช้เวลาทั้งหมด {Math.round(state.summary.durationSeconds / 60)} นาที • รวมทั้งหมด {state.summary.totalMoves} จังหวะ
            </p>
          )}
          {!state.summary && !state.loading && hasRoom && !hasSession && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              กำลังค้นหาผลล่าสุดของห้อง #{roomId?.slice(0, 8)}...
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            ปิด
          </button>
        )}
      </header>

      {state.loading && (
        <div className="flex flex-1 items-center justify-center text-slate-500 dark:text-slate-400">
          กำลังโหลดข้อมูลสรุปเกม...
        </div>
      )}

      {state.error && !state.loading && (
        <div className="flex flex-1 items-center justify-center text-rose-500 dark:text-rose-400">
          {state.error}
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white/70 px-8 py-12 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <div className="text-4xl">🂠</div>
            <p className="mt-4 text-base font-semibold text-slate-600 dark:text-slate-200">
              ยังไม่มีข้อมูลสรุปเกม
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              เมื่อรอบเกมจบลงและระบบบันทึกผล คุณจะเห็นคะแนนรวม รายละเอียดการเกิดไพ่ และเหตุการณ์พิเศษของผู้เล่นที่นี่
            </p>
          </div>
        </div>
      )}

      {!state.loading && !state.error && state.summary && (
        <div className="grid gap-4">
          {state.players
            .sort((a, b) => a.position - b.position)
            .map((player) => (
              <PlayerDisplayCard
                key={player.gamerId}
                player={player}
                isCurrentUser={player.metadata?.isCurrentUser === true}
                melds={state.melds}
                scoreEvents={state.scoreEvents}
              />
            ))}
        </div>
      )}
    </div>
  );
}
