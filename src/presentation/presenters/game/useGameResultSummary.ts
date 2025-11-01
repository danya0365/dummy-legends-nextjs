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
  const {
    gameResultSummary,
    gameResultPlayers,
    gameResultMelds,
    gameScoreEvents,
    isLoadingResultSummary,
    resultSummaryError,
    loadGameResultSummary,
    loadGameResultSummaryForRoom,
    resetGameResultSummary,
  } = useGameStore((state) => ({
    gameResultSummary: state.gameResultSummary,
    gameResultPlayers: state.gameResultPlayers,
    gameResultMelds: state.gameResultMelds,
    gameScoreEvents: state.gameScoreEvents,
    isLoadingResultSummary: state.isLoadingResultSummary,
    resultSummaryError: state.resultSummaryError,
    loadGameResultSummary: state.loadGameResultSummary,
    loadGameResultSummaryForRoom: state.loadGameResultSummaryForRoom,
    resetGameResultSummary: state.resetGameResultSummary,
  }));

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
