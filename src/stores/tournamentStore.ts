"use client";

import { create } from "zustand";
import type {
  Tournament,
  TournamentState,
  RegisterTournamentData,
  CheckInData,
  Bracket,
  TournamentFilters,
} from "@/src/domain/types/tournament.types";

interface TournamentStore extends TournamentState {
  // Actions
  fetchTournaments: (filters?: TournamentFilters) => Promise<void>;
  fetchTournamentById: (id: string) => Promise<void>;
  fetchMyTournaments: () => Promise<void>;
  registerTournament: (data: RegisterTournamentData) => Promise<void>;
  unregisterTournament: (tournamentId: string) => Promise<void>;
  checkInTournament: (data: CheckInData) => Promise<void>;
  fetchBracket: (tournamentId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Tournament Store using Zustand
 * Manages tournaments, registration, and brackets
 */
export const useTournamentStore = create<TournamentStore>((set, get) => ({
  // Initial State
  tournaments: [],
  currentTournament: null,
  currentBracket: null,
  myTournaments: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all tournaments with optional filters
   */
  fetchTournaments: async (filters?: TournamentFilters) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // This will be replaced with actual data from mock/API
      // For now, tournaments will be loaded from mock data
      set({
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดรายการทัวร์นาเมนต์ไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch tournament by ID
   */
  fetchTournamentById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const tournaments = get().tournaments;
      const tournament = tournaments.find((t) => t.id === id);

      if (!tournament) {
        throw new Error("ไม่พบทัวร์นาเมนต์");
      }

      set({
        currentTournament: tournament,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดข้อมูลทัวร์นาเมนต์ไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch tournaments user is registered for
   */
  fetchMyTournaments: async () => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock: Filter tournaments where user is registered
      const myTournaments = get().tournaments.filter(
        (t) => t.participants.some((p) => p.userId === "user-001")
      );

      set({
        myTournaments,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดทัวร์นาเมนต์ของคุณไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Register for a tournament
   */
  registerTournament: async (data: RegisterTournamentData) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tournament = get().tournaments.find((t) => t.id === data.tournamentId);

      if (!tournament) {
        throw new Error("ไม่พบทัวร์นาเมนต์");
      }

      if (tournament.status !== "registration") {
        throw new Error("ทัวร์นาเมนต์ไม่เปิดรับสมัคร");
      }

      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new Error("ทัวร์นาเมนต์เต็มแล้ว");
      }

      // Mock: Add user to participants
      const newParticipant = {
        id: `participant-${Date.now()}`,
        userId: "user-001",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
        level: 1,
        elo: 1000,
        seed: tournament.currentParticipants + 1,
        registeredAt: new Date().toISOString(),
        status: "registered" as const,
      };

      const updatedTournaments = get().tournaments.map((t) =>
        t.id === data.tournamentId
          ? {
              ...t,
              participants: [...t.participants, newParticipant],
              currentParticipants: t.currentParticipants + 1,
            }
          : t
      );

      set({
        tournaments: updatedTournaments,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Unregister from a tournament
   */
  unregisterTournament: async (tournamentId: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedTournaments = get().tournaments.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              participants: t.participants.filter((p) => p.userId !== "user-001"),
              currentParticipants: t.currentParticipants - 1,
            }
          : t
      );

      set({
        tournaments: updatedTournaments,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "ยกเลิกการลงทะเบียนไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Check in for a tournament
   */
  checkInTournament: async (data: CheckInData) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedTournaments = get().tournaments.map((t) =>
        t.id === data.tournamentId
          ? {
              ...t,
              participants: t.participants.map((p) =>
                p.userId === "user-001"
                  ? { ...p, status: "checked-in" as const }
                  : p
              ),
            }
          : t
      );

      set({
        tournaments: updatedTournaments,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "เช็คอินไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch tournament bracket
   */
  fetchBracket: async (tournamentId: string) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock bracket data
      const mockBracket: Bracket = {
        id: `bracket-${tournamentId}`,
        tournamentId,
        format: "single-elimination",
        status: "active",
        rounds: 3,
        matches: [],
        createdAt: new Date().toISOString(),
      };

      set({
        currentBracket: mockBracket,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดตารางแข่งขันไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
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
