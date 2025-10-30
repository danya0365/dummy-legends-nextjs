"use client";

import { create } from "zustand";
import type {
  LeaderboardState,
  LeaderboardFilters,
  PlayerRank,
  PlayerProfile,
} from "@/src/domain/types/leaderboard.types";

interface LeaderboardStore extends LeaderboardState {
  // Actions
  fetchRankings: (filters?: LeaderboardFilters) => Promise<void>;
  fetchPlayerProfile: (userId: string) => Promise<void>;
  fetchTopPlayers: () => Promise<void>;
  updateFilters: (filters: Partial<LeaderboardFilters>) => void;
  clearFilters: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Leaderboard Store using Zustand
 * Manages leaderboard rankings and player statistics
 */
export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  // Initial State
  rankings: [],
  currentPlayer: null,
  topPlayers: [],
  isLoading: false,
  error: null,
  filters: {
    period: "all-time",
    category: "elo",
  },

  /**
   * Fetch leaderboard rankings with filters
   */
  fetchRankings: async (filters?: LeaderboardFilters) => {
    set({ isLoading: true, error: null });

    try {
      if (filters) {
        set({ filters: { ...get().filters, ...filters } });
      }

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Rankings will be loaded from mock data
      set({
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดอันดับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch player profile by ID
   */
  fetchPlayerProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock: Find player in rankings
      const rankings = get().rankings;
      const player = rankings.find((p) => p.userId === userId);

      if (!player) {
        throw new Error("ไม่พบข้อมูลผู้เล่น");
      }

      // For now, use player rank data as profile
      // In real app, this would fetch extended profile data
      set({
        currentPlayer: player as unknown as PlayerProfile, // Will be proper PlayerProfile from API
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดข้อมูลผู้เล่นไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch top 10 players
   */
  fetchTopPlayers: async () => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const rankings = get().rankings;
      const topPlayers = rankings.slice(0, 10);

      set({
        topPlayers,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดข้อมูลไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update filters
   */
  updateFilters: (newFilters: Partial<LeaderboardFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  /**
   * Clear all filters
   */
  clearFilters: () => {
    set({
      filters: {
        period: "all-time",
        category: "elo",
      },
    });
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
