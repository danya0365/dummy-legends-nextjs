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
  async createRoom(
    data: CreateRoomData,
    guestId?: string,
    guestName?: string
  ): Promise<GameRoom> {
    // Use guest function if guest ID provided
    const functionName = guestId ? "create_game_room_guest" : "create_game_room";
    
    const params: any = {
      p_name: data.name,
      p_mode: data.mode,
      p_max_players: data.maxPlayers,
      p_bet_amount: data.betAmount,
      p_time_limit: data.timeLimit,
      p_is_private: data.isPrivate,
      p_password: data.password || undefined,
      p_allow_spectators: data.allowSpectators,
    };

    if (guestId) {
      params.p_guest_id = guestId;
      params.p_guest_name = guestName;
    }

    const { data: result, error } = await supabaseClient.rpc(
      functionName as any,
      params
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
  async joinRoom(
    data: JoinRoomData,
    guestId?: string,
    guestName?: string
  ): Promise<void> {
    // Use guest function if guest ID provided
    const functionName = guestId ? "join_game_room_guest" : "join_game_room";
    
    const params: any = {
      p_room_id: data.roomId || undefined,
      p_room_code: data.roomCode || undefined,
      p_password: data.password || undefined,
    };

    if (guestId) {
      params.p_guest_id = guestId;
      params.p_guest_name = guestName;
    }

    const { error } = await supabaseClient.rpc(functionName as any, params);

    if (error) {
      console.error("Error joining room:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(
    roomId: string,
    guestId?: string
  ): Promise<void> {
    const functionName = guestId ? "leave_game_room_guest" : "leave_game_room";
    
    const params: any = {
      p_room_id: roomId,
    };

    if (guestId) {
      params.p_guest_id = guestId;
    }

    const { error } = await supabaseClient.rpc(functionName as any, params);

    if (error) {
      console.error("Error leaving room:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Toggle ready status
   */
  async toggleReady(
    roomId: string,
    guestId?: string
  ): Promise<void> {
    const functionName = guestId ? "toggle_ready_status_guest" : "toggle_ready_status";
    
    const params: any = {
      p_room_id: roomId,
    };

    if (guestId) {
      params.p_guest_id = guestId;
    }

    const { error } = await supabaseClient.rpc(functionName as any, params);

    if (error) {
      console.error("Error toggling ready status:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Start game (host only)
   */
  async startGame(
    roomId: string,
    guestId?: string
  ): Promise<void> {
    const functionName = guestId ? "start_game_guest" : "start_game";
    
    const params: any = {
      p_room_id: roomId,
    };

    if (guestId) {
      params.p_guest_id = guestId;
    }

    const { error } = await supabaseClient.rpc(functionName as any, params);

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
   * Initialize game state (deal cards)
   */
  async initializeGameState(roomId: string): Promise<any> {
    const { data, error } = await supabaseClient.rpc("initialize_game_state", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error initializing game:", error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update game state with cards
   */
  async updateGameState(params: {
    roomId: string;
    deck?: any[];
    discardPile?: any[];
    playerHands?: any;
    playerMelds?: any;
    scores?: any;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc("update_game_state", {
      p_room_id: params.roomId,
      p_deck: params.deck ? JSON.stringify(params.deck) : undefined,
      p_discard_pile: params.discardPile ? JSON.stringify(params.discardPile) : undefined,
      p_player_hands: params.playerHands ? JSON.stringify(params.playerHands) : undefined,
      p_player_melds: params.playerMelds ? JSON.stringify(params.playerMelds) : undefined,
      p_scores: params.scores ? JSON.stringify(params.scores) : undefined,
    });

    if (error) {
      console.error("Error updating game state:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Draw a card
   */
  async drawCard(roomId: string, fromDiscard: boolean = false): Promise<any> {
    const { data, error } = await supabaseClient.rpc("draw_card", {
      p_room_id: roomId,
      p_from_discard: fromDiscard,
    });

    if (error) {
      console.error("Error drawing card:", error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Discard a card
   */
  async discardCard(roomId: string, card: any): Promise<any> {
    const { data, error } = await supabaseClient.rpc("discard_card", {
      p_room_id: roomId,
      p_card: card,
    });

    if (error) {
      console.error("Error discarding card:", error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Meld cards (lay down)
   */
  async meldCards(roomId: string, cards: any[]): Promise<void> {
    const { error } = await supabaseClient.rpc("meld_cards", {
      p_room_id: roomId,
      p_cards: JSON.stringify(cards),
    });

    if (error) {
      console.error("Error melding cards:", error);
      throw new Error(error.message);
    }
  }

  /**
   * Knock (end round)
   */
  async knock(roomId: string, deadwoodValue: number): Promise<any> {
    const { data, error } = await supabaseClient.rpc("knock", {
      p_room_id: roomId,
      p_deadwood_value: deadwoodValue,
    });

    if (error) {
      console.error("Error knocking:", error);
      throw new Error(error.message);
    }

    return data;
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
