"use client";

import { useCallback, useEffect } from "react";
import {
  GameResultSummary,
  GameResultPlayerSummary,
  GameResultMeld,
  GameScoreEventEntry,
} from "@/src/domain/types/gameplay.types";
import { useGameStore } from "@/src/stores/gameStore";

export interface GameResultPresenterState {
  summary: GameResultSummary | null;
  players: GameResultPlayerSummary[];
  melds: GameResultMeld[];
  scoreEvents: GameScoreEventEntry[];
  loading: boolean;
  error: string | null;
}

export interface GameResultPresenterActions {
  loadSummary: (sessionId: string) => Promise<void>;
  loadSummaryByRoom: (roomId: string) => Promise<void>;
  reset: () => void;
}

export function useGameResultSummary(
  sessionId?: string,
  roomId?: string
): [GameResultPresenterState, GameResultPresenterActions] {
  const gameResultSummary = useGameStore((state) => state.gameResultSummary);
  const gameResultPlayers = useGameStore((state) => state.gameResultPlayers);
  const gameResultMelds = useGameStore((state) => state.gameResultMelds);
  const gameScoreEvents = useGameStore((state) => state.gameScoreEvents);
  const isLoadingResultSummary = useGameStore(
    (state) => state.isLoadingResultSummary
  );
  const resultSummaryError = useGameStore((state) => state.resultSummaryError);
  const loadGameResultSummary = useGameStore(
    (state) => state.loadGameResultSummary
  );
  const loadGameResultSummaryForRoom = useGameStore(
    (state) => state.loadGameResultSummaryForRoom
  );
  const resetGameResultSummary = useGameStore(
    (state) => state.resetGameResultSummary
  );

  const loadSummary = useCallback(
    async (id: string) => {
      await loadGameResultSummary(id);
    },
    [loadGameResultSummary]
  );

  const loadSummaryByRoom = useCallback(
    async (id: string) => {
      await loadGameResultSummaryForRoom(id);
    },
    [loadGameResultSummaryForRoom]
  );

  const reset = useCallback(() => {
    resetGameResultSummary();
  }, [resetGameResultSummary]);

  useEffect(() => {
    if (sessionId) {
      loadSummary(sessionId).catch((error) => {
        console.error("Failed to load game result summary:", error);
      });
    } else if (roomId) {
      loadSummaryByRoom(roomId).catch((error) => {
        console.error("Failed to load room result summary:", error);
      });
    }

    return () => {
      resetGameResultSummary();
    };
  }, [sessionId, roomId, loadSummary, loadSummaryByRoom, resetGameResultSummary]);

  return [
    {
      summary: gameResultSummary,
      players: gameResultPlayers,
      melds: gameResultMelds,
      scoreEvents: gameScoreEvents,
      loading: isLoadingResultSummary,
      error: resultSummaryError,
    },
    {
      loadSummary,
      loadSummaryByRoom,
      reset,
    },
  ];
}
