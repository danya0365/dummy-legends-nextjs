"use client";

import type {
  CreateRoomData,
  GameRoom,
  JoinRoomData,
  Player,
  RoomDetailsContent,
  RoomPlayerDetails,
  GameState as RoomState,
  RoomStatus,
} from "@/src/domain/types/game.types";
import type {
  GameCard,
  GameCardRow,
  GameSession,
  GameSessionRow,
  GameStateOtherPlayerSummary,
  GameStatePayload,
  OtherPlayer,
} from "@/src/domain/types/gameplay.types";
import type { Json } from "@/src/domain/types/supabase";
import { supabaseClient as supabase } from "@/src/infrastructure/supabase/client";
import { guestIdentifier } from "@/src/utils/guestIdentifier";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

const isRoomDetailsContent = (value: unknown): value is RoomDetailsContent => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const room = record.room as Record<string, unknown> | undefined;

  return (
    !!room &&
    typeof room.id === "string" &&
    typeof room.room_code === "string" &&
    typeof room.host_gamer_id === "string"
  );
};

const mapGameSessionRow = (session: GameSessionRow): GameSession => ({
  id: session.id,
  roomId: session.room_id,
  roundNumber: session.round_number,
  currentTurnGamerId: session.current_turn_gamer_id,
  currentTurnStartedAt: session.current_turn_started_at,
  remainingDeckCards: session.remaining_deck_cards,
  discardPileTopCardId: session.discard_pile_top_card_id,
  isActive: session.is_active,
  winnerId: session.winner_gamer_id,
  winningType: session.winning_type,
  startedAt: session.started_at ?? new Date().toISOString(),
  finishedAt: session.finished_at,
});

const mapGameCardRow = (card: GameCardRow): GameCard => ({
  id: card.id,
  suit: card.suit,
  rank: card.rank,
  value: card.card_value,
  location: card.location as GameCard["location"],
  ownerId: card.owner_gamer_id,
  position: card.position_in_location ?? 0,
});

const mapOtherPlayerSummary = (
  summary: GameStateOtherPlayerSummary
): OtherPlayer => ({
  gamerId: summary.gamer_id,
  cardCount: summary.card_count,
  isCurrentTurn: summary.is_current_turn,
});

const parseRoomDetails = (payload: unknown): RoomDetailsContent => {
  if (!isRoomDetailsContent(payload)) {
    throw new Error("Invalid room details response");
  }

  return payload;
};

const parseGamerPreferences = (preferences: unknown): Record<string, unknown> => {
  if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
    return preferences as Record<string, unknown>;
  }

  return {};
};

const getPreferenceString = (
  preferences: Record<string, unknown>,
  key: string
): string | null => {
  const value = preferences[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

const pickFirstNonEmptyString = (
  ...values: Array<string | null | undefined>
): string | null => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

const getRecordString = (
  record: Record<string, unknown> | null | undefined,
  key: string
): string | null => {
  if (!record) return null;
  const value = record[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

interface GamerProfileData {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isComplete: boolean;
}

interface GamerProfileFormState {
  displayName: string;
  avatarUrl: string;
  bio: string;
}

const mapRoomPlayer = (player: RoomPlayerDetails): Player => {
  const gamer = player.gamer;
  const preferences = parseGamerPreferences(gamer.preferences);
  const preferenceDisplayName = getPreferenceString(preferences, "display_name");
  const preferenceAvatarUrl = getPreferenceString(preferences, "avatar_url");

  const fallbackUsername =
    pickFirstNonEmptyString(
      gamer.profile_id,
      gamer.guest_identifier,
      gamer.id
    ) ?? "unknown";

  const displayName =
    pickFirstNonEmptyString(
      preferenceDisplayName,
      gamer.guest_display_name,
      fallbackUsername
    ) ?? fallbackUsername;

  const avatarUrl = pickFirstNonEmptyString(preferenceAvatarUrl);

  return {
    id: player.id,
    userId: player.gamer_id,
    username: fallbackUsername,
    displayName,
    avatar: avatarUrl,
    level: gamer.level ?? 1,
    elo: gamer.elo_rating ?? 0,
    status: player.status,
    isHost: player.is_host,
    isReady: player.is_ready,
    position: player.position,
    joinedAt: player.joined_at ?? new Date().toISOString(),
  };
};

const mapRoomDetailsToGameRoom = (details: RoomDetailsContent): GameRoom => {
  const room = details.room;
  const players = (details.players ?? []).map(mapRoomPlayer);
  const createdAt = room.created_at ?? new Date().toISOString();

  return {
    id: room.id,
    code: room.room_code,
    hostId: room.host_gamer_id,
    name: room.room_name,
    status: room.status,
    mode: room.mode,
    settings: {
      maxPlayers: room.max_players,
      betAmount: room.bet_amount,
      timeLimit: room.time_limit_seconds,
      isPrivate: room.is_private,
      password: room.room_password ?? undefined,
      allowSpectators: room.allow_spectators,
    },
    players,
    spectators: [],
    currentPlayerCount: room.current_player_count ?? players.length,
    maxPlayerCount: room.max_players,
    createdAt,
    startedAt: room.started_at ?? undefined,
    finishedAt: room.finished_at ?? undefined,
  };
};

interface GameStore extends RoomState {
  gamerId: string | null;
  guestId: string | null;
  roomChannel: RealtimeChannel | null;
  gamerProfile: GamerProfileData | null;
  gamerProfileForm: GamerProfileFormState;
  isGamerProfileModalOpen: boolean;
  isSavingGamerProfile: boolean;

  // Game Play State
  currentSession: GameSession | null;
  myHand: GameCard[];
  discardTop: GameCard | null;
  otherPlayers: OtherPlayer[];
  gameChannel: RealtimeChannel | null;

  // Actions - Room
  initializeGamer: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (data: JoinRoomData) => Promise<string>;
  leaveRoom: () => Promise<void>;
  loadLatestRoomContext: () => Promise<GameRoom | null>;
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
  openGamerProfileModal: () => void;
  closeGamerProfileModal: () => void;
  updateGamerProfileForm: (field: keyof GamerProfileFormState, value: string) => void;
  saveGamerProfile: () => Promise<void>;

  // Actions - Gameplay
  fetchActiveSessionForRoom: (roomId: string) => Promise<string | null>;
  startGameSession: () => Promise<string>;
  loadGameState: (sessionId: string) => Promise<void>;
  drawCard: (fromDeck: boolean) => Promise<void>;
  discardCard: (cardId: string) => Promise<void>;
  subscribeToGameSession: (sessionId: string) => Promise<void>;
  unsubscribeFromGame: () => void;
  getActiveSessionForRoom: (roomId: string) => Promise<string | null>;
}

/**
 * Game Store using Zustand
 * Manages game rooms and gameplay state
 */
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State - Room
  currentRoom: null,
  availableRooms: [],
  isInRoom: false,
  isLoading: false,
  error: null,
  gamerId: null,
  guestId: null,
  roomChannel: null,
  gamerProfile: null,
  gamerProfileForm: {
    displayName: "",
    avatarUrl: "",
    bio: "",
  },
  isGamerProfileModalOpen: false,
  isSavingGamerProfile: false,

  // Initial State - Gameplay
  currentSession: null,
  myHand: [],
  discardTop: null,
  otherPlayers: [],
  gameChannel: null,

  /**
   * Initialize gamer (guest or authenticated)
   */
  initializeGamer: async () => {
    try {
      // Check if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          const displayName =
            "Guest_" + Math.random().toString(36).substr(2, 6);
          const { data, error } = await supabase.rpc("create_or_get_gamer", {
            p_guest_identifier: guestId,
            p_guest_display_name: displayName,
          });

          if (error) throw error;
          gamerId = data[0].gamer_id;
          guestIdentifier.setGamerId(gamerId);
        }
      }

      const { data: gamerRecord, error: gamerRecordError } = await supabase
        .from("gamers")
        .select("guest_display_name, preferences, profile_id")
        .eq("id", gamerId)
        .maybeSingle();

      if (gamerRecordError) throw gamerRecordError;

      const preferences = parseGamerPreferences(gamerRecord?.preferences);
      const preferenceDisplayName = getPreferenceString(
        preferences,
        "display_name"
      );
      const preferenceAvatarUrl = getPreferenceString(
        preferences,
        "avatar_url"
      );
      const preferenceBio = getPreferenceString(preferences, "bio");
      const hasPreferenceDisplayName = !!preferenceDisplayName;

      const displayNameFromRecord = pickFirstNonEmptyString(
        gamerRecord?.guest_display_name
      );

      let activeProfile: Record<string, unknown> | null = null;

      if (user) {
        try {
          const { data: profileData } = await supabase.rpc("get_active_profile");
          if (Array.isArray(profileData) && profileData.length > 0) {
            activeProfile = profileData[0] ?? null;
          }
        } catch (profileError) {
          console.warn("Failed to fetch active profile", profileError);
        }
      }

      const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;

      const fallbackDisplayName =
        pickFirstNonEmptyString(
          preferenceDisplayName,
          displayNameFromRecord,
          getRecordString(activeProfile, "full_name"),
          getRecordString(activeProfile, "username"),
          getRecordString(userMetadata, "full_name"),
          getRecordString(userMetadata, "display_name"),
          getRecordString(userMetadata, "username"),
          user?.email ? user.email.split("@")[0] : null
        ) ?? "";

      const fallbackAvatarUrl =
        pickFirstNonEmptyString(
          preferenceAvatarUrl,
          getRecordString(activeProfile, "avatar_url"),
          getRecordString(userMetadata, "avatar_url")
        ) ?? "";

      const fallbackBio =
        pickFirstNonEmptyString(
          preferenceBio,
          getRecordString(activeProfile, "bio")
        ) ?? "";

      const shouldOpenModal = !hasPreferenceDisplayName;

      set({
        gamerId,
        guestId,
        gamerProfile: {
          displayName: hasPreferenceDisplayName
            ? preferenceDisplayName!
            : fallbackDisplayName,
          avatarUrl: hasPreferenceDisplayName
            ? preferenceAvatarUrl ?? null
            : fallbackAvatarUrl || null,
          bio: hasPreferenceDisplayName
            ? preferenceBio ?? null
            : fallbackBio || null,
          isComplete: hasPreferenceDisplayName,
        },
        gamerProfileForm: {
          displayName: fallbackDisplayName,
          avatarUrl: fallbackAvatarUrl,
          bio: fallbackBio,
        },
        isGamerProfileModalOpen: shouldOpenModal,
      });
    } catch (error) {
      console.error("Failed to initialize gamer:", error);
      set({ error: "ไม่สามารถสร้างผู้เล่นได้" });
    }
  },

  openGamerProfileModal: () => {
    const { gamerProfile, gamerProfileForm } = get();
    const fallbackDisplayName = gamerProfileForm.displayName ?? "";
    const fallbackAvatarUrl = gamerProfileForm.avatarUrl ?? "";
    const fallbackBio = gamerProfileForm.bio ?? "";

    set({
      gamerProfileForm: {
        displayName: gamerProfile?.displayName ?? fallbackDisplayName,
        avatarUrl: gamerProfile?.avatarUrl ?? fallbackAvatarUrl,
        bio: gamerProfile?.bio ?? fallbackBio,
      },
      isGamerProfileModalOpen: true,
    });
  },

  closeGamerProfileModal: () => {
    set({ isGamerProfileModalOpen: false });
  },

  updateGamerProfileForm: (field, value) => {
    set((state) => ({
      gamerProfileForm: {
        ...state.gamerProfileForm,
        [field]: value,
      },
    }));
  },

  saveGamerProfile: async () => {
    const { gamerId, gamerProfileForm, guestId } = get();
    if (!gamerId) {
      throw new Error("ไม่พบข้อมูลผู้เล่น");
    }

    const displayName = gamerProfileForm.displayName.trim();
    if (!displayName) {
      throw new Error("กรุณากรอกชื่อผู้เล่น");
    }

    const avatarUrl = gamerProfileForm.avatarUrl.trim();
    const bio = gamerProfileForm.bio.trim();

    set({ isSavingGamerProfile: true });

    try {
      const preferencesPayload: Json = {
        display_name: displayName,
        avatar_url: avatarUrl || null,
        bio: bio || null,
      };

      const { error: preferencesError } = await supabase.rpc(
        "update_gamer_preferences",
        {
          p_gamer_id: gamerId,
          p_preferences: preferencesPayload,
          p_guest_identifier: guestId || undefined,
        }
      );

      if (preferencesError) throw preferencesError;

      if (guestId && avatarUrl) {
        guestIdentifier.setGamerId(gamerId);
      }

      set({
        gamerProfile: {
          displayName,
          avatarUrl: avatarUrl || null,
          bio: bio || null,
          isComplete: true,
        },
        gamerProfileForm: {
          displayName,
          avatarUrl,
          bio,
        },
        isGamerProfileModalOpen: false,
        isSavingGamerProfile: false,
      });
    } catch (error) {
      console.error("Failed to save gamer profile:", error);
      set({
        isSavingGamerProfile: false,
        error:
          error instanceof Error
            ? error.message
            : "ไม่สามารถบันทึกโปรไฟล์ผู้เล่นได้",
      });
      throw error;
    }
  },

  /**
   * Create a new game room
   */
  createRoom: async (data: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      const { gamerId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId!;
      const resolvedGuestId = get().guestId;

      const { data: roomData, error } = await supabase.rpc("create_game_room", {
        p_gamer_id: resolvedGamerId,
        p_room_name: data.name,
        p_guest_identifier: resolvedGuestId || undefined,
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

      const details = parseRoomDetails(roomDetails);
      const baseRoom = mapRoomDetailsToGameRoom(details);
      const newRoom: GameRoom = {
        ...baseRoom,
        code: roomCode,
        hostId: resolvedGamerId,
        name: data.name || baseRoom.name,
        settings: {
          ...baseRoom.settings,
          password: data.password ?? baseRoom.settings.password,
          allowSpectators:
            data.allowSpectators ?? baseRoom.settings.allowSpectators,
        },
        currentPlayerCount: baseRoom.currentPlayerCount ?? 1,
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
   * Load latest accessible room for gamer (current or most recent)
   */
  loadLatestRoomContext: async () => {
    try {
      const { gamerId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId;
      if (!resolvedGamerId) {
        return null;
      }

      const resolvedGuestId = get().guestId;

      const { data: latestRooms, error } = await supabase.rpc(
        "get_latest_room_for_gamer",
        {
          p_gamer_id: resolvedGamerId,
          p_guest_identifier: resolvedGuestId || undefined,
        }
      );

      if (error) throw error;

      const latest = latestRooms && latestRooms.length > 0 ? latestRooms[0] : null;
      if (!latest?.room_id) {
        return null;
      }

      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: latest.room_id }
      );

      if (detailsError) throw detailsError;
      if (!roomDetails) return null;

      const details = parseRoomDetails(roomDetails);
      const room = mapRoomDetailsToGameRoom(details);

      set({
        currentRoom: room,
        isInRoom: true,
      });

      await get().subscribeToRoom(room.id);

      const { unsubscribeFromGame, loadGameState, subscribeToGameSession } = get();

      await unsubscribeFromGame();

      if (latest.session_id) {
        await loadGameState(latest.session_id);
        await subscribeToGameSession(latest.session_id);
      } else {
        set({
          currentSession: null,
          myHand: [],
          discardTop: null,
          otherPlayers: [],
        });
      }

      return room;
    } catch (error) {
      console.warn("Failed to load latest room context:", error);
      return null;
    }
  },

  /**
   * Join an existing room
   */
  joinRoom: async (data: JoinRoomData) => {
    set({ isLoading: true, error: null });

    try {
      const { gamerId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId!;
      const resolvedGuestId = get().guestId;

      const { data: joinedRoomId, error } = await supabase.rpc("join_game_room", {
        p_gamer_id: resolvedGamerId,
        p_guest_identifier: resolvedGuestId || undefined,
        p_room_code: data.roomCode || undefined,
        p_room_id: data.roomId || undefined,
        p_room_password: data.password || undefined,
      });

      if (error) throw error;
      if (!joinedRoomId) throw new Error("Failed to join room");

      // Fetch room details
      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: joinedRoomId }
      );

      if (detailsError) throw detailsError;
      if (!roomDetails) throw new Error("Failed to fetch room details");

      const details = parseRoomDetails(roomDetails);
      const room = mapRoomDetailsToGameRoom(details);

      set({
        currentRoom: room,
        isInRoom: true,
      });

      // Subscribe to room updates
      await get().subscribeToRoom(joinedRoomId);

      const { unsubscribeFromGame, loadGameState, subscribeToGameSession } = get();
      await unsubscribeFromGame();

      if (room.status === "playing") {
        const sessionId = await get().fetchActiveSessionForRoom(room.id);
        if (sessionId) {
          await loadGameState(sessionId);
          await subscribeToGameSession(sessionId);
        } else {
          set({
            currentSession: null,
            myHand: [],
            discardTop: null,
            otherPlayers: [],
          });
        }
      } else {
        set({
          currentSession: null,
          myHand: [],
          discardTop: null,
          otherPlayers: [],
        });
      }

      set({ isLoading: false });
      return joinedRoomId;
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
   * Start game (host only) - just validates, actual start is in startGameSession
   */
  startGame: async () => {
    set({ error: null });

    try {
      const { currentRoom, gamerId } = get();
      if (!currentRoom || !gamerId) {
        throw new Error("ไม่พบห้องเกม");
      }

      if (currentRoom.status === "playing") {
        throw new Error("เกมได้เริ่มไปแล้ว");
      }

      const isHost = currentRoom.players.find(
        (p) => p.userId === gamerId
      )?.isHost;

      if (!isHost) {
        throw new Error("เฉพาะเจ้าของห้องเท่านั้นที่สามารถเริ่มเกมได้");
      }

      const allReady = currentRoom.players.every((p) => p.isReady || p.isHost);

      if (!allReady) {
        throw new Error("ผู้เล่นบางคนยังไม่พร้อม");
      }

      if (currentRoom.currentPlayerCount < 2) {
        throw new Error("ต้องมีผู้เล่นอย่างน้อย 2 คน");
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "เริ่มเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
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

      const mappedRooms: GameRoom[] = (rooms || []).map((room) => ({
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
   * Fetch active session ID for a room
   */
  fetchActiveSessionForRoom: async (roomId: string) => {
    try {
      const { gamerId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId!;
      const resolvedGuestId = get().guestId;

      const { data: sessionId, error } = await supabase.rpc(
        "get_active_session_for_room",
        {
          p_room_id: roomId,
          p_gamer_id: resolvedGamerId,
          p_guest_identifier: resolvedGuestId || undefined,
        }
      );

      if (error) throw error;
      if (!sessionId) {
        return null;
      }

      return sessionId;
    } catch (error) {
      console.error("Failed to fetch active session:", error);
      return null;
    }
  },

  /**
   * Get cached or remote active session for current room
   */
  getActiveSessionForRoom: async (roomId: string) => {
    const { currentSession } = get();
    if (currentSession && currentSession.roomId === roomId && currentSession.isActive) {
      return currentSession.id;
    }

    return get().fetchActiveSessionForRoom(roomId);
  },

  /**
   * Subscribe to room updates via Realtime
   */
  subscribeToRoom: async (roomId: string) => {
    const refreshRoomState = async () => {
      try {
        const { data: roomDetails, error } = await supabase.rpc(
          "get_room_details",
          { p_room_id: roomId }
        );

        if (error) throw error;
        if (!roomDetails) return;

        const details = parseRoomDetails(roomDetails);
        const updatedRoom = mapRoomDetailsToGameRoom(details);

        set((state) => {
          const updates: Partial<GameStore> = {};
          if (state.currentRoom?.id === roomId) {
            updates.currentRoom = updatedRoom;
          }

          if (state.availableRooms.some((room) => room.id === roomId)) {
            updates.availableRooms = state.availableRooms.map((room) =>
              room.id === roomId ? updatedRoom : room
            );
          }

          return Object.keys(updates).length > 0 ? updates : state;
        });
      } catch (error) {
        console.error("Failed to refresh room state:", error);
      }
    };

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
        async (payload) => {
          console.log("Room player update:", payload);
          await refreshRoomState();
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
        async (payload) => {
          console.log("Room update:", payload);
          await refreshRoomState();
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

  // =====================================================
  // GAMEPLAY ACTIONS
  // =====================================================

  /**
   * Start game session (called after all players ready)
   */
  startGameSession: async () => {
    try {
      const { currentRoom, gamerId, guestId } = get();
      if (!currentRoom || !gamerId) {
        throw new Error("ไม่พบห้องเกม");
      }

      set({ isLoading: true });

      const { data: sessionId, error } = await supabase.rpc(
        "start_game_session",
        {
          p_room_id: currentRoom.id,
          p_host_gamer_id: gamerId,
          p_guest_identifier: guestId || undefined,
        }
      );

      if (error) throw error;
      if (!sessionId) throw new Error("Failed to start session");

      // Load initial game state
      await get().loadGameState(sessionId);

      // Subscribe to game updates
      get().unsubscribeFromGame();
      await get().subscribeToGameSession(sessionId);

      set(({ currentRoom: latestRoom }) => ({
        currentRoom:
          latestRoom && latestRoom.id === currentRoom.id
            ? {
                ...latestRoom,
                status: "playing",
                startedAt: new Date().toISOString(),
              }
            : latestRoom,
        isLoading: false,
      }));

      return sessionId;
    } catch (error) {
      console.error("Failed to start game session:", error);
      set({ error: "ไม่สามารถเริ่มเกมได้", isLoading: false });
      throw error;
    }
  },

  /**
   * Load current game state
   */
  loadGameState: async (sessionId: string) => {
    try {
      const { gamerId, guestId } = get();
      if (!gamerId) throw new Error("ไม่พบผู้เล่น");

      const { data, error } = await supabase.rpc("get_game_state", {
        p_session_id: sessionId,
        p_gamer_id: gamerId,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to load game state");

      const payload = data as unknown as GameStatePayload;
      const session = payload.session
        ? mapGameSessionRow(payload.session)
        : null;
      const myHand = (payload.my_hand ?? []).map(mapGameCardRow);
      const discardTop = payload.discard_top
        ? mapGameCardRow(payload.discard_top)
        : null;
      const otherPlayers = (payload.other_players ?? []).map(
        mapOtherPlayerSummary
      );

      set({
        currentSession: session,
        myHand,
        discardTop,
        otherPlayers,
      });
    } catch (error) {
      console.error("Failed to load game state:", error);
      set({ error: "ไม่สามารถโหลดสถานะเกมได้" });
      throw error;
    }
  },

  /**
   * Draw a card
   */
  drawCard: async (fromDeck: boolean) => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) throw new Error("ไม่พบเซสชันเกม");

      const { error } = await supabase.rpc("draw_card", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_from_deck: fromDeck,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      // Reload game state
      await get().loadGameState(currentSession.id);
    } catch (error) {
      console.error("Failed to draw card:", error);
      set({
        error: error instanceof Error ? error.message : "ไม่สามารถจั่วไพ่ได้",
      });
      throw error;
    }
  },

  /**
   * Discard a card
   */
  discardCard: async (cardId: string) => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) throw new Error("ไม่พบเซสชันเกม");

      const { error } = await supabase.rpc("discard_card", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_card_id: cardId,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      // Reload game state
      await get().loadGameState(currentSession.id);
    } catch (error) {
      console.error("Failed to discard card:", error);
      set({
        error: error instanceof Error ? error.message : "ไม่สามารถทิ้งไพ่ได้",
      });
      throw error;
    }
  },

  /**
   * Subscribe to game session updates
   */
  subscribeToGameSession: async (sessionId: string) => {
    const channel = supabase
      .channel(`game:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_cards",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Reload game state when cards change
          get().loadGameState(sessionId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          // Reload game state when session updates
          get().loadGameState(sessionId);
        }
      )
      .subscribe();

    set({ gameChannel: channel });
  },

  /**
   * Unsubscribe from game session
   */
  unsubscribeFromGame: () => {
    const { gameChannel } = get();
    if (gameChannel) {
      supabase.removeChannel(gameChannel);
      set({ gameChannel: null });
    }
  },
}));
