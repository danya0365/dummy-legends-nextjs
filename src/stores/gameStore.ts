"use client";

import { create } from "zustand";
import { supabaseClient as supabase } from "@/src/infrastructure/supabase/client";
import { guestIdentifier } from "@/src/utils/guestIdentifier";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  GameRoom,
  GameState,
  CreateRoomData,
  JoinRoomData,
  Player,
  RoomStatus,
} from "@/src/domain/types/game.types";

interface GameStore extends GameState {
  gamerId: string | null;
  guestId: string | null;
  roomChannel: RealtimeChannel | null;
  
  // Actions
  initializeGamer: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (data: JoinRoomData) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => void;
  startGame: () => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  subscribeToRoom: (roomId: string) => Promise<void>;
  unsubscribeFromRoom: () => void;
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
  gamerId: null,
  guestId: null,
  roomChannel: null,

  /**
   * Initialize gamer (guest or authenticated)
   */
  initializeGamer: async () => {
    try {
      // Check if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      let gamerId: string;
      let guestId: string | null = null;

      if (user?.user_metadata?.profile_id) {
        // Authenticated user
        const { data, error } = await supabase.rpc("create_or_get_gamer", {
          p_profile_id: user.user_metadata.profile_id,
        });
        
        if (error) throw error;
        gamerId = data[0].gamer_id;
      } else {
        // Guest user
        guestId = guestIdentifier.getOrCreate();
        const storedGamerId = guestIdentifier.getGamerId();

        if (storedGamerId) {
          gamerId = storedGamerId;
        } else {
          const displayName = "Guest_" + Math.random().toString(36).substr(2, 6);
          const { data, error } = await supabase.rpc("create_or_get_gamer", {
            p_guest_identifier: guestId,
            p_guest_display_name: displayName,
          });
          
          if (error) throw error;
          gamerId = data[0].gamer_id;
          guestIdentifier.setGamerId(gamerId);
        }
      }

      set({ gamerId, guestId });
    } catch (error) {
      console.error("Failed to initialize gamer:", error);
      set({ error: "ไม่สามารถสร้างผู้เล่นได้" });
    }
  },

  /**
   * Create a new game room
   */
  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      const { gamerId, guestId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const { data: roomData, error } = await supabase.rpc("create_game_room", {
        p_gamer_id: get().gamerId!,
        p_room_name: data.name,
        p_guest_identifier: get().guestId || undefined,
        p_mode: data.mode,
        p_max_players: data.maxPlayers,
        p_bet_amount: data.betAmount,
        p_time_limit_seconds: data.timeLimit,
        p_is_private: data.isPrivate,
        p_room_password: data.password || undefined,
      });

      if (error) throw error;
      if (!roomData || !roomData[0]) throw new Error("Failed to create room");

      const roomId = roomData[0].room_id;
      const roomCode = roomData[0].room_code;

      // Fetch full room details
      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: roomId }
      );

      if (detailsError) throw detailsError;
      if (!roomDetails) throw new Error("Failed to fetch room details");

      const details = roomDetails as Record<string, any>;
      const newRoom: GameRoom = {
        id: roomId,
        code: roomCode,
        hostId: get().gamerId!,
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
        players: details.players || [],
        spectators: [],
        currentPlayerCount: 1,
        maxPlayerCount: data.maxPlayers,
        createdAt: new Date().toISOString(),
      };

      set({
        currentRoom: newRoom,
        isInRoom: true,
        isLoading: false,
      });

      // Subscribe to room updates
      await get().subscribeToRoom(roomId);

      return newRoom;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "สร้างห้องไม่สำเร็จ",
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
      const { gamerId, guestId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const { data: roomId, error } = await supabase.rpc("join_game_room", {
        p_gamer_id: get().gamerId!,
        p_guest_identifier: get().guestId || undefined,
        p_room_code: data.roomCode || undefined,
        p_room_id: data.roomId || undefined,
        p_room_password: data.password || undefined,
      });

      if (error) throw error;
      if (!roomId) throw new Error("Failed to join room");

      // Fetch room details
      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: roomId }
      );

      if (detailsError) throw detailsError;
      if (!roomDetails) throw new Error("Failed to fetch room details");

      const details = roomDetails as Record<string, any>;
      const room: GameRoom = {
        id: details.room.id,
        code: details.room.room_code,
        hostId: details.room.host_gamer_id,
        name: details.room.room_name,
        status: details.room.status,
        mode: details.room.mode,
        settings: {
          maxPlayers: details.room.max_players,
          betAmount: details.room.bet_amount,
          timeLimit: details.room.time_limit_seconds,
          isPrivate: details.room.is_private,
          allowSpectators: details.room.allow_spectators,
        },
        players: details.players || [],
        spectators: [],
        currentPlayerCount: details.room.current_player_count,
        maxPlayerCount: details.room.max_players,
        createdAt: details.room.created_at,
      };

      set({
        currentRoom: room,
        isInRoom: true,
        isLoading: false,
      });

      // Subscribe to room updates
      await get().subscribeToRoom(roomId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "เข้าร่วมห้องไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Leave current room
   */
  leaveRoom: async () => {
    try {
      const { currentRoom, gamerId, guestId } = get();
      if (!currentRoom || !gamerId) return;

      const { error } = await supabase.rpc("leave_game_room", {
        p_gamer_id: gamerId,
        p_room_id: currentRoom.id,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      // Unsubscribe from realtime
      get().unsubscribeFromRoom();

      set({
        currentRoom: null,
        isInRoom: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
      set({ error: "ออกจากห้องไม่สำเร็จ" });
    }
  },

  /**
   * Toggle ready status
   */
  toggleReady: async () => {
    try {
      const { currentRoom, gamerId, guestId } = get();
      if (!currentRoom || !gamerId) return;

      const { data: isReady, error } = await supabase.rpc(
        "toggle_ready_status",
        {
          p_gamer_id: gamerId,
          p_room_id: currentRoom.id,
          p_guest_identifier: guestId || undefined,
        }
      );

      if (error) throw error;

      // Update local state (realtime will sync)
      const updatedPlayers = currentRoom.players.map((player) =>
        player.userId === gamerId ? { ...player, isReady } : player
      );

      set({
        currentRoom: {
          ...currentRoom,
          players: updatedPlayers,
        },
      });
    } catch (error) {
      console.error("Failed to toggle ready:", error);
      set({ error: "เปลี่ยนสถานะไม่สำเร็จ" });
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
      const { data: rooms, error } = await supabase.rpc("get_available_rooms", {
        p_limit: 20,
        p_offset: 0,
      });

      if (error) throw error;

      const mappedRooms: GameRoom[] = (rooms || []).map((room: any) => ({
        id: room.id,
        code: room.room_code,
        hostId: room.host_gamer_id,
        name: room.room_name,
        status: room.status,
        mode: room.mode,
        settings: {
          maxPlayers: room.max_players,
          betAmount: room.bet_amount,
          timeLimit: 60,
          isPrivate: false,
          allowSpectators: true,
        },
        players: [],
        spectators: [],
        currentPlayerCount: room.current_player_count,
        maxPlayerCount: room.max_players,
        createdAt: room.created_at,
      }));

      set({
        availableRooms: mappedRooms,
        isLoading: false,
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
   * Subscribe to room updates via Realtime
   */
  subscribeToRoom: async (roomId: string) => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Room player update:", payload);
          // TODO: Update currentRoom.players based on payload
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Room update:", payload);
          // TODO: Update currentRoom status, etc.
        }
      )
      .subscribe();

    set({ roomChannel: channel });
  },

  /**
   * Unsubscribe from room updates
   */
  unsubscribeFromRoom: () => {
    const { roomChannel } = get();
    if (roomChannel) {
      supabase.removeChannel(roomChannel);
      set({ roomChannel: null });
    }
  },
}));
