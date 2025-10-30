"use client";

import { create } from "zustand";
import type {
  GameRoom,
  GameState,
  CreateRoomData,
  JoinRoomData,
  Player,
  RoomStatus,
  Card,
  GamePlayState,
} from "@/src/domain/types/game.types";
import { gameRepository } from "@/src/infrastructure/supabase/gameRepository";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  generateDeck,
  dealCards,
  sortCards,
} from "@/src/utils/cardUtils";
import { useGuestStore } from "./guestStore";

interface GameStore extends GameState {
  // Realtime subscription
  roomSubscription: RealtimeChannel | null;
  
  // Gameplay state
  gamePlayState: GamePlayState | null;
  myHand: Card[];
  selectedCards: Card[];
  
  // Room Actions
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
  
  // Gameplay Actions
  initializeGame: () => Promise<void>;
  drawCard: (fromDiscard?: boolean) => Promise<void>;
  discardCard: (card: Card) => Promise<void>;
  selectCard: (card: Card) => void;
  deselectCard: (card: Card) => void;
  clearSelection: () => void;
  meldCards: (cards: Card[]) => Promise<void>;
  knock: (deadwoodValue: number) => Promise<void>;
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
  
  // Gameplay State
  gamePlayState: null,
  myHand: [],
  selectedCards: [],

  /**
   * Create a new game room
   */
  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      // Check if guest mode
      const guestState = useGuestStore.getState();
      const { guest, isGuestMode } = guestState;

      let newRoom: GameRoom;
      
      if (isGuestMode && guest) {
        // Create as guest
        newRoom = await gameRepository.createRoom(
          data,
          guest.id,
          guest.displayName
        );
      } else {
        // Create as authenticated user
        newRoom = await gameRepository.createRoom(data);
      }

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
      // Check if guest mode
      const guestState = useGuestStore.getState();
      const { guest, isGuestMode } = guestState;

      if (isGuestMode && guest) {
        // Join as guest
        await gameRepository.joinRoom(data, guest.id, guest.displayName);
      } else {
        // Join as authenticated user
        await gameRepository.joinRoom(data);
      }

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

      // Check if guest mode
      const guestState = useGuestStore.getState();
      const { guest, isGuestMode } = guestState;

      if (isGuestMode && guest) {
        await gameRepository.leaveRoom(currentRoom.id, guest.id);
      } else {
        await gameRepository.leaveRoom(currentRoom.id);
      }

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
      // Check if guest mode
      const guestState = useGuestStore.getState();
      const { guest, isGuestMode } = guestState;

      if (isGuestMode && guest) {
        await gameRepository.toggleReady(currentRoom.id, guest.id);
      } else {
        await gameRepository.toggleReady(currentRoom.id);
      }
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

      // Check if guest mode
      const guestState = useGuestStore.getState();
      const { guest, isGuestMode } = guestState;

      if (isGuestMode && guest) {
        await gameRepository.startGame(currentRoom.id, guest.id);
      } else {
        await gameRepository.startGame(currentRoom.id);
      }
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

  /**
   * Initialize game - deal cards and set up game state
   */
  initializeGame: async () => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) {
      throw new Error("ไม่พบห้องเกม");
    }

    set({ isLoading: true, error: null });

    try {
      // Generate and shuffle deck
      const deck = generateDeck();
      const { playerHands, remainingDeck } = dealCards(
        deck,
        currentRoom.currentPlayerCount
      );

      // Build player hands object
      const playerHandsObj: Record<string, Card[]> = {};
      currentRoom.players.forEach((player, index) => {
        playerHandsObj[player.userId] = sortCards(playerHands[index]);
      });

      // Initialize game state
      await gameRepository.initializeGameState(currentRoom.id);

      // Update with card data
      await gameRepository.updateGameState({
        roomId: currentRoom.id,
        deck: remainingDeck,
        discardPile: [],
        playerHands: playerHandsObj,
        playerMelds: {},
        scores: {},
      });

      // Set local game state
      const firstPlayer = currentRoom.players[0];
      const gamePlayState: GamePlayState = {
        roomId: currentRoom.id,
        deck: remainingDeck,
        discardPile: [],
        playerHands: currentRoom.players.map((player, index) => ({
          playerId: player.userId,
          cards: playerHands[index],
          melds: [],
        })),
        currentTurn: firstPlayer.userId,
        turnStartTime: new Date().toISOString(),
        round: 1,
        scores: {},
      };

      // Get my hand (if authenticated user is in the game)
      // TODO: Get from auth store
      const myUserId = firstPlayer.userId; // Temporary
      const myHand = playerHandsObj[myUserId] || [];

      set({
        gamePlayState,
        myHand: sortCards(myHand),
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
   * Draw a card from deck or discard pile
   */
  drawCard: async (fromDiscard: boolean = false) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      const result = await gameRepository.drawCard(currentRoom.id, fromDiscard);
      
      // Add drawn card to my hand
      const drawnCard = result.card;
      const myHand = get().myHand;
      
      set({
        myHand: sortCards([...myHand, drawnCard]),
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "จั่วไพ่ไม่สำเร็จ",
      });
    }
  },

  /**
   * Discard a card
   */
  discardCard: async (card: Card) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      await gameRepository.discardCard(currentRoom.id, card);
      
      // Remove card from my hand
      const myHand = get().myHand;
      set({
        myHand: myHand.filter((c) => c.id !== card.id),
        selectedCards: [],
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "ทิ้งไพ่ไม่สำเร็จ",
      });
    }
  },

  /**
   * Select a card
   */
  selectCard: (card: Card) => {
    const selectedCards = get().selectedCards;
    set({
      selectedCards: [...selectedCards, card],
    });
  },

  /**
   * Deselect a card
   */
  deselectCard: (card: Card) => {
    const selectedCards = get().selectedCards;
    set({
      selectedCards: selectedCards.filter((c) => c.id !== card.id),
    });
  },

  /**
   * Clear selection
   */
  clearSelection: () => {
    set({ selectedCards: [] });
  },

  /**
   * Meld cards (lay down a set or run)
   */
  meldCards: async (cards: Card[]) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      await gameRepository.meldCards(currentRoom.id, cards);
      
      // Remove melded cards from hand
      const myHand = get().myHand;
      const meldedCardIds = new Set(cards.map((c) => c.id));
      
      set({
        myHand: myHand.filter((c) => !meldedCardIds.has(c.id)),
        selectedCards: [],
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "วางไพ่ไม่สำเร็จ",
      });
    }
  },

  /**
   * Knock (end round)
   */
  knock: async (deadwoodValue: number) => {
    const currentRoom = get().currentRoom;
    if (!currentRoom) return;

    try {
      await gameRepository.knock(currentRoom.id, deadwoodValue);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Knock ไม่สำเร็จ",
      });
    }
  },
}));
