/**
 * Game Repository
 * Handles all game-related database operations using Supabase
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseClient } from "./client";
import type {
  GameRoom,
  CreateRoomData,
  JoinRoomData,
  Player,
  RoomStatus,
  GameMode,
  PlayerStatus,
} from "@/src/domain/types/game.types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export class GameRepository {
  /**
   * Create a new game room
   */
  async createRoom(data: CreateRoomData): Promise<GameRoom> {
    const { data: result, error } = await supabaseClient.rpc(
      "create_game_room",
      {
        p_name: data.name,
        p_mode: data.mode,
        p_max_players: data.maxPlayers,
        p_bet_amount: data.betAmount,
        p_time_limit: data.timeLimit,
        p_is_private: data.isPrivate,
        p_password: data.password || undefined,
        p_allow_spectators: data.allowSpectators,
      }
    );

    if (error) {
      console.error("Error creating room:", error);
      throw new Error(error.message);
    }

    return this.mapToGameRoom(result as any);
  }

  /**
   * Join an existing room
   */
  async joinRoom(data: JoinRoomData): Promise<void> {
    const { error } = await supabaseClient.rpc("join_game_room", {
      p_room_id: data.roomId || undefined,
      p_room_code: data.roomCode || undefined,
      p_password: data.password || undefined,
    });

    if (error) {
      console.error("Error joining room:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    const { error } = await supabaseClient.rpc("leave_game_room", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error leaving room:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Toggle ready status
   */
  async toggleReady(roomId: string): Promise<boolean> {
    const { data, error } = await supabaseClient.rpc("toggle_ready_status", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error toggling ready:", error);
      throw new Error(error.message);
    }

    return (data as { isReady: boolean }).isReady;
  }

  /**
   * Start game (host only)
   */
  async startGame(roomId: string): Promise<void> {
    const { error } = await supabaseClient.rpc("start_game", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error starting game:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Get available rooms
   */
  async getAvailableRooms(
    mode?: "casual" | "ranked" | "tournament" | "private"
  ): Promise<GameRoom[]> {
    const { data, error } = await supabaseClient.rpc("get_available_rooms", {
      p_mode: mode || undefined,
      p_limit: 20,
    });

    if (error) {
      console.error("Error fetching rooms:", error);
      throw new Error(error.message);
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((room) => this.mapToGameRoom(room as any));
  }

  /**
   * Get room details
   */
  async getRoomDetails(roomId: string): Promise<GameRoom | null> {
    const { data, error } = await supabaseClient.rpc("get_room_details", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error fetching room details:", error);
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return this.mapToGameRoom(data as any);
  }

  /**
   * Subscribe to room changes
   */
  subscribeToRoom(
    roomId: string,
    onRoomUpdate: (room: GameRoom) => void,
    onPlayerUpdate: (players: Player[]) => void
  ): RealtimeChannel {
    // Subscribe to room changes
    const roomChannel = supabaseClient
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        async () => {
          // Fetch updated room details
          const room = await this.getRoomDetails(roomId);
          if (room) {
            onRoomUpdate(room);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          // Fetch updated room details
          const room = await this.getRoomDetails(roomId);
          if (room && room.players) {
            onPlayerUpdate(room.players);
          }
        }
      )
      .subscribe();

    return roomChannel;
  }

  /**
   * Unsubscribe from room
   */
  unsubscribeFromRoom(channel: RealtimeChannel): void {
    supabaseClient.removeChannel(channel);
  }

  /**
   * Map API response to GameRoom type
   */
  private mapToGameRoom(data: {
    id: string;
    code: string;
    hostId: string;
    name: string;
    status: string;
    mode: string;
    settings: Record<string, any>;
    players?: Array<Record<string, any>>;
    spectators?: string[];
    currentPlayerCount: number;
    maxPlayerCount: number;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
  }): GameRoom {
    return {
      id: data.id,
      code: data.code,
      hostId: data.hostId,
      name: data.name,
      status: data.status as RoomStatus,
      mode: data.mode as GameMode,
      settings: {
        maxPlayers: data.settings.maxPlayers,
        betAmount: data.settings.betAmount,
        timeLimit: data.settings.timeLimit,
        isPrivate: data.settings.isPrivate,
        password: data.settings.password,
        allowSpectators: data.settings.allowSpectators,
      },
      players: data.players
        ? data.players.map((p) => this.mapToPlayer(p as any))
        : [],
      spectators: data.spectators || [],
      currentPlayerCount: data.currentPlayerCount,
      maxPlayerCount: data.maxPlayerCount,
      createdAt: data.createdAt,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
    };
  }

  /**
   * Map player data
   */
  private mapToPlayer(data: {
    id: string;
    userId: string;
    username?: string;
    displayName?: string;
    avatar?: string | null;
    level?: number;
    elo?: number;
    status: string;
    isHost: boolean;
    isReady: boolean;
    position: number;
    joinedAt: string;
  }): Player {
    return {
      id: data.id,
      userId: data.userId,
      username: data.username || "Guest",
      displayName: data.displayName || "Guest",
      avatar: data.avatar || null,
      level: data.level || 1,
      elo: data.elo || 1000,
      status: data.status as PlayerStatus,
      isHost: data.isHost,
      isReady: data.isReady,
      position: data.position,
      joinedAt: data.joinedAt,
    };
  }
}

// Export singleton instance
export const gameRepository = new GameRepository();
