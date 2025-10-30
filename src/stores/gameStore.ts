"use client";

import { create } from "zustand";
import type {
  GameRoom,
  GameState,
  CreateRoomData,
  JoinRoomData,
  Player,
  RoomStatus,
} from "@/src/domain/types/game.types";
import { gameRepository } from "@/src/infrastructure/supabase/gameRepository";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface GameStore extends GameState {
  // Realtime subscription
  roomSubscription: RealtimeChannel | null;
  
  // Actions
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (data: JoinRoomData) => Promise<void>;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  updateRoomStatus: (status: RoomStatus) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
}

/**
 * Game Store using Zustand
 * Manages game rooms and gameplay state
 */
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  currentRoom: null,
  availableRooms: [],
  isInRoom: false,
  isLoading: false,
  error: null,
  roomSubscription: null,

  /**
   * Create a new game room
   */
  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      const newRoom = await gameRepository.createRoom(data);

      set({
        currentRoom: newRoom,
        isInRoom: true,
        isLoading: false,
        error: null,
      });

      // Subscribe to room updates
      get().subscribeToRoom(newRoom.id);

      return newRoom;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "สร้างห้องเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Join an existing room
   */
  joinRoom: async (data: JoinRoomData) => {
    set({ isLoading: true, error: null });

    try {
      await gameRepository.joinRoom(data);

      // Get room details after joining
      const roomId = data.roomId || "";
      if (roomId) {
        const room = await gameRepository.getRoomDetails(roomId);
        if (room) {
          set({
            currentRoom: room,
            isInRoom: true,
            isLoading: false,
            error: null,
          });

          // Subscribe to room updates
          get().subscribeToRoom(room.id);
        }
      } else if (data.roomCode) {
        // If joined by code, find the room in available rooms
        const rooms = await gameRepository.getAvailableRooms();
        const room = rooms.find((r) => r.code === data.roomCode);
        if (room) {
          set({
            currentRoom: room,
            isInRoom: true,
            isLoading: false,
            error: null,
          });

          // Subscribe to room updates
          get().subscribeToRoom(room.id);
        }
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "เข้าร่วมห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Leave current room
   */
  leaveRoom: async () => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      // Unsubscribe from room updates
      get().unsubscribeFromRoom();

      await gameRepository.leaveRoom(currentRoom.id);

      set({
        currentRoom: null,
        isInRoom: false,
        error: null,
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      // Still clear local state even if API call fails
      set({
        currentRoom: null,
        isInRoom: false,
        error: null,
      });
    }
  },

  /**
   * Toggle ready status
   */
  toggleReady: async () => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      await gameRepository.toggleReady(currentRoom.id);
      // Room will be updated via realtime subscription
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "เปลี่ยนสถานะพร้อมไม่สำเร็จ",
      });
    }
  },

  /**
   * Start game (host only)
   */
  startGame: async () => {
    set({ isLoading: true, error: null });

    try {
      const currentRoom = get().currentRoom;
      if (!currentRoom) {
        throw new Error("ไม่พบห้องเกม");
      }

      await gameRepository.startGame(currentRoom.id);
      // Room will be updated via realtime subscription

      set({ isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "เริ่มเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch available rooms
   */
  fetchAvailableRooms: async () => {
    set({ isLoading: true, error: null });

    try {
      const rooms = await gameRepository.getAvailableRooms();

      set({
        availableRooms: rooms,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "โหลดรายการห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update room status
   */
  updateRoomStatus: (status: RoomStatus) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    set({
      currentRoom: {
        ...currentRoom,
        status,
      },
    });
  },

  /**
   * Add player to current room
   */
  addPlayer: (player: Player) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    set({
      currentRoom: {
        ...currentRoom,
        players: [...currentRoom.players, player],
        currentPlayerCount: currentRoom.currentPlayerCount + 1,
      },
    });
  },

  /**
   * Remove player from current room
   */
  removePlayer: (playerId: string) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    set({
      currentRoom: {
        ...currentRoom,
        players: currentRoom.players.filter((p) => p.id !== playerId),
        currentPlayerCount: currentRoom.currentPlayerCount - 1,
      },
    });
  },

  /**
   * Update player info
   */
  updatePlayer: (playerId: string, updates: Partial<Player>) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    set({
      currentRoom: {
        ...currentRoom,
        players: currentRoom.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        ),
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

  /**
   * Subscribe to room updates
   */
  subscribeToRoom: (roomId: string) => {
    // Unsubscribe from previous subscription if exists
    get().unsubscribeFromRoom();

    const subscription = gameRepository.subscribeToRoom(
      roomId,
      (updatedRoom) => {
        set({ currentRoom: updatedRoom });
      },
      (players) => {
        const currentRoom = get().currentRoom;
        if (currentRoom) {
          set({
            currentRoom: {
              ...currentRoom,
              players,
              currentPlayerCount: players.length,
            },
          });
        }
      }
    );

    set({ roomSubscription: subscription });
  },

  /**
   * Unsubscribe from room updates
   */
  unsubscribeFromRoom: () => {
    const subscription = get().roomSubscription;
    if (subscription) {
      gameRepository.unsubscribeFromRoom(subscription);
      set({ roomSubscription: null });
    }
  },
}));
