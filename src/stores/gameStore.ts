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

interface GameStore extends GameState {
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

  /**
   * Create a new game room
   */
  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      // TODO: Replace with actual API call to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate room code (6 digits)
      const roomCode = Math.random().toString().substring(2, 8);

      // Mock room creation
      const newRoom: GameRoom = {
        id: `room-${Date.now()}`,
        code: roomCode,
        hostId: "user-001", // TODO: Get from auth store
        name: data.name,
        status: "waiting",
        mode: data.mode,
        settings: {
          maxPlayers: data.maxPlayers,
          betAmount: data.betAmount,
          timeLimit: data.timeLimit,
          isPrivate: data.isPrivate,
          password: data.password,
          allowSpectators: data.allowSpectators,
        },
        players: [
          {
            id: `player-${Date.now()}`,
            userId: "user-001",
            username: "testuser",
            displayName: "Test User",
            avatar: null,
            level: 1,
            elo: 1000,
            status: "waiting",
            isHost: true,
            isReady: false,
            position: 0,
            joinedAt: new Date().toISOString(),
          },
        ],
        spectators: [],
        currentPlayerCount: 1,
        maxPlayerCount: data.maxPlayers,
        createdAt: new Date().toISOString(),
      };

      set({
        currentRoom: newRoom,
        isInRoom: true,
        isLoading: false,
        error: null,
      });

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
      // TODO: Replace with actual API call to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock finding room
      const availableRooms = get().availableRooms;
      const room = availableRooms.find(
        (r) => r.id === data.roomId || r.code === data.roomCode
      );

      if (!room) {
        throw new Error("ไม่พบห้องเกม");
      }

      if (room.currentPlayerCount >= room.maxPlayerCount) {
        throw new Error("ห้องเต็ม");
      }

      if (room.settings.isPrivate && room.settings.password !== data.password) {
        throw new Error("รหัสผ่านไม่ถูกต้อง");
      }

      // Add player to room
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        userId: "user-001",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
        level: 1,
        elo: 1000,
        status: "waiting",
        isHost: false,
        isReady: false,
        position: room.players.length,
        joinedAt: new Date().toISOString(),
      };

      const updatedRoom: GameRoom = {
        ...room,
        players: [...room.players, newPlayer],
        currentPlayerCount: room.currentPlayerCount + 1,
      };

      set({
        currentRoom: updatedRoom,
        isInRoom: true,
        isLoading: false,
        error: null,
      });
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
  leaveRoom: () => {
    set({
      currentRoom: null,
      isInRoom: false,
      error: null,
    });
  },

  /**
   * Toggle ready status
   */
  toggleReady: () => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    const userId = "user-001"; // TODO: Get from auth store
    const updatedPlayers = currentRoom.players.map((player) =>
      player.userId === userId
        ? { ...player, isReady: !player.isReady }
        : player
    );

    set({
      currentRoom: {
        ...currentRoom,
        players: updatedPlayers,
      },
    });
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

      const userId = "user-001"; // TODO: Get from auth store
      const isHost = currentRoom.players.find((p) => p.userId === userId)?.isHost;

      if (!isHost) {
        throw new Error("เฉพาะเจ้าของห้องเท่านั้นที่สามารถเริ่มเกมได้");
      }

      const allReady = currentRoom.players.every(
        (p) => p.isReady || p.isHost
      );

      if (!allReady) {
        throw new Error("ผู้เล่นบางคนยังไม่พร้อม");
      }

      if (currentRoom.currentPlayerCount < 2) {
        throw new Error("ต้องมีผู้เล่นอย่างน้อย 2 คน");
      }

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set({
        currentRoom: {
          ...currentRoom,
          status: "playing",
          startedAt: new Date().toISOString(),
        },
        isLoading: false,
      });
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
      // TODO: Replace with actual API call to Supabase
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock available rooms
      const mockRooms: GameRoom[] = [
        {
          id: "room-001",
          code: "123456",
          hostId: "user-002",
          name: "ห้องมือใหม่",
          status: "waiting",
          mode: "casual",
          settings: {
            maxPlayers: 4,
            betAmount: 100,
            timeLimit: 60,
            isPrivate: false,
            allowSpectators: true,
          },
          players: [
            {
              id: "player-001",
              userId: "user-002",
              username: "pro_player",
              displayName: "มือโปร",
              avatar: null,
              level: 25,
              elo: 1500,
              status: "waiting",
              isHost: true,
              isReady: true,
              position: 0,
              joinedAt: new Date().toISOString(),
            },
          ],
          spectators: [],
          currentPlayerCount: 1,
          maxPlayerCount: 4,
          createdAt: new Date().toISOString(),
        },
        {
          id: "room-002",
          code: "789012",
          hostId: "user-003",
          name: "ห้องสูง 🔥",
          status: "waiting",
          mode: "ranked",
          settings: {
            maxPlayers: 4,
            betAmount: 500,
            timeLimit: 45,
            isPrivate: false,
            allowSpectators: true,
          },
          players: [
            {
              id: "player-002",
              userId: "user-003",
              username: "card_master",
              displayName: "เซียนไพ่",
              avatar: null,
              level: 50,
              elo: 2000,
              status: "waiting",
              isHost: true,
              isReady: true,
              position: 0,
              joinedAt: new Date().toISOString(),
            },
            {
              id: "player-003",
              userId: "user-004",
              username: "lucky_ace",
              displayName: "โชคดี",
              avatar: null,
              level: 35,
              elo: 1800,
              status: "waiting",
              isHost: false,
              isReady: false,
              position: 1,
              joinedAt: new Date().toISOString(),
            },
          ],
          spectators: [],
          currentPlayerCount: 2,
          maxPlayerCount: 4,
          createdAt: new Date().toISOString(),
        },
      ];

      set({
        availableRooms: mockRooms,
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
}));
