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
  DeadwoodCardDetail,
  DiscardStackInfo,
  GameCard,
  GameCardRow,
  GameMeldRow,
  GameResultMeld,
  GameResultPlayerRow,
  GameResultPlayerSummary,
  GameResultRow,
  GameResultSummary,
  GameScoreEventEntry,
  GameScoreEventRow,
  GameSession,
  GameSessionRow,
  GameStateOtherPlayerSummary,
  GameStatePayload,
  OtherPlayer,
  PlayerMeld,
  TableMeld,
  TurnActionContext,
  TurnActionMode,
  TurnActionPermission,
  TurnActionState,
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
  meldId: card.meld_id ?? null,
  isHead: card.is_head ?? false,
  isSpeto: card.is_speto ?? false,
  meldCardIndex: card.meld_card_index ?? null,
});

const mapPlayerMeld = (meld: {
  meld_id: string;
  created_at?: string | null;
  cards: GameCardRow[];
}): PlayerMeld => ({
  meldId: meld.meld_id,
  createdAt: meld.created_at ?? null,
  cards: meld.cards.map(mapGameCardRow),
});

const mapTableMeld = (meld: {
  meld_id: string;
  owner_gamer_id: string | null;
  created_at?: string | null;
  cards: GameCardRow[];
}): TableMeld => ({
  meldId: meld.meld_id,
  ownerGamerId: meld.owner_gamer_id,
  createdAt: meld.created_at ?? null,
  cards: meld.cards.map(mapGameCardRow),
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

const parseGamerPreferences = (
  preferences: unknown
): Record<string, unknown> => {
  if (
    preferences &&
    typeof preferences === "object" &&
    !Array.isArray(preferences)
  ) {
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
  const preferenceDisplayName = getPreferenceString(
    preferences,
    "display_name"
  );
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

interface ValidationError {
  type: string | null;
  message: string;
  canForce?: boolean;
}

interface GameStore extends RoomState {
  gamerId: string | null;
  guestId: string | null;
  roomChannel: RealtimeChannel | null;
  lobbyChannel: RealtimeChannel | null;
  gamerProfile: GamerProfileData | null;
  gamerProfileForm: GamerProfileFormState;
  isGamerProfileModalOpen: boolean;
  isSavingGamerProfile: boolean;
  validationError: ValidationError | null;

  // Meld selection state
  pendingMeldCardIds: string[];
  isSelectingMeld: boolean;

  // Game Play State
  currentSession: GameSession | null;
  myHand: GameCard[];
  myMelds: PlayerMeld[];
  tableMelds: TableMeld[];
  discardTop: GameCard | null;
  discardStack: DiscardStackInfo | null;
  otherPlayers: OtherPlayer[];
  gameChannel: RealtimeChannel | null;
  isSelectingLayoff: boolean;
  targetMeldId: string | null;
  pendingLayoffCardIds: string[];
  selectedDiscardCardId: string | null;
  selectedDiscardPickupCardIds: string[];
  selectedDiscardMeldCardIds: string[];
  hasDrawnThisTurn: boolean;
  turnActionState: TurnActionState;

  // Game result summary
  gameResultSummary: GameResultSummary | null;
  gameResultPlayers: GameResultPlayerSummary[];
  gameResultMelds: GameResultMeld[];
  gameScoreEvents: GameScoreEventEntry[];
  isLoadingResultSummary: boolean;
  resultSummaryError: string | null;

  // Actions - Room
  initializeGamer: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<GameRoom>;
  joinRoom: (data: JoinRoomData) => Promise<string>;
  leaveRoom: () => Promise<void>;
  loadLatestRoomContext: () => Promise<GameRoom | null>;
  toggleReady: () => void;
  startGame: () => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  subscribeToLobby: () => Promise<void>;
  unsubscribeFromLobby: () => Promise<void>;
  subscribeToRoom: (roomId: string) => Promise<void>;
  unsubscribeFromRoom: () => Promise<void>;
  updateRoomStatus: (status: RoomStatus) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  openGamerProfileModal: () => void;
  closeGamerProfileModal: () => void;
  updateGamerProfileForm: (
    field: keyof GamerProfileFormState,
    value: string
  ) => void;
  saveGamerProfile: () => Promise<void>;

  // Actions - Gameplay
  fetchActiveSessionForRoom: (roomId: string) => Promise<string | null>;
  startGameSession: () => Promise<string>;
  loadGameState: (sessionId: string) => Promise<void>;
  drawCard: (
    fromDeck: boolean,
    options?: { meldCards?: string[]; selectedDiscardCardId?: string }
  ) => Promise<void>;
  selectDiscardCard: (cardId: string | null) => void;
  setTurnActionContext: (context: Partial<TurnActionContext>) => void;
  setTurnActionMode: (
    mode: TurnActionMode,
    options?: {
      allowedActions?: TurnActionPermission[];
      context?: Partial<TurnActionContext>;
    }
  ) => void;
  createMeld: (cardIds?: string[]) => Promise<string>;
  startMeldSelection: () => void;
  cancelMeldSelection: () => void;
  toggleMeldCard: (cardId: string) => void;
  startLayoffSelection: () => void;
  cancelLayoffSelection: () => void;
  toggleLayoffCard: (cardId: string) => void;
  selectLayoffTarget: (meldId: string | null) => void;
  confirmLayoff: () => Promise<void>;
  discardCard: (cardId: string, forceDiscard?: boolean) => Promise<void>;
  sortHandByRank: () => Promise<void>;
  sortHandBySuit: () => Promise<void>;
  subscribeToGameSession: (sessionId: string) => Promise<void>;
  unsubscribeFromGame: () => Promise<void>;
  getActiveSessionForRoom: (roomId: string) => Promise<string | null>;
  loadGameResultSummary: (sessionId: string) => Promise<void>;
  loadGameResultSummaryForRoom: (roomId: string) => Promise<void>;
  resetGameResultSummary: () => void;
}

/**
 * Game Store using Zustand
 * Manages game rooms and gameplay state
 */
export const EMPTY_CHANNEL: RealtimeChannel = {
  subscribe: () => ({
    data: null,
  }),
} as unknown as RealtimeChannel;

const LOBBY_CHANNEL_KEY = "game:lobby";

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State - Room
  currentRoom: null,
  availableRooms: [],
  lobbyChannel: null,
  isInRoom: false,
  isLoading: false,
  error: null,
  validationError: null,
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
  pendingMeldCardIds: [],
  isSelectingMeld: false,

  // Initial State - Gameplay
  currentSession: null,
  myHand: [],
  myMelds: [],
  tableMelds: [],
  discardTop: null,
  discardStack: null,
  otherPlayers: [],
  gameChannel: null,
  isSelectingLayoff: false,
  targetMeldId: null,
  pendingLayoffCardIds: [],
  selectedDiscardCardId: null,
  selectedDiscardPickupCardIds: [],
  selectedDiscardMeldCardIds: [],
  hasDrawnThisTurn: false,
  turnActionState: {
    mode: "idle",
    allowedActions: [],
    context: {},
  },

  // Initial State - Game result summary
  gameResultSummary: null,
  gameResultPlayers: [],
  gameResultMelds: [],
  gameScoreEvents: [],
  isLoadingResultSummary: false,
  resultSummaryError: null,

  /**
   * Subscribe to lobby updates
   */
  subscribeToLobby: async () => {
    const { lobbyChannel } = get();
    if (lobbyChannel) {
      return;
    }

    const channel = supabase
      .channel(LOBBY_CHANNEL_KEY)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
        },
        async () => {
          try {
            await get().fetchAvailableRooms();
          } catch (error) {
            console.error("Failed to refresh lobby rooms", error);
          }
        }
      )
      .subscribe();

    set({ lobbyChannel: channel });
  },

  /**
   * Unsubscribe from lobby updates
   */
  unsubscribeFromLobby: async () => {
    const { lobbyChannel } = get();
    if (lobbyChannel) {
      await supabase.removeChannel(lobbyChannel);
      set({ lobbyChannel: null });
    }
  },

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

        let resolvedStoredGamerId: string | null = storedGamerId ?? null;

        if (storedGamerId) {
          const { data: existingGamer, error: existingError } = await supabase
            .from("gamers")
            .select("id")
            .eq("id", storedGamerId)
            .maybeSingle();

          if (existingError) {
            console.warn("Failed to validate stored guest gamer id", existingError);
            resolvedStoredGamerId = null;
          } else if (!existingGamer) {
            // Local storage holds stale gamerId (e.g. after DB reset)
            guestIdentifier.clear();
            resolvedStoredGamerId = null;
            guestId = guestIdentifier.getOrCreate();
          }
        }

        if (resolvedStoredGamerId) {
          gamerId = resolvedStoredGamerId;
        } else {
          const displayName =
            "Guest_" + Math.random().toString(36).substr(2, 6);
          const { data, error } = await supabase.rpc("create_or_get_gamer", {
            p_guest_identifier: guestId,
            p_guest_display_name: displayName,
          });

          if (error) throw error;

          const createdGamerId = Array.isArray(data) ? data[0]?.gamer_id : null;
          if (!createdGamerId) {
            throw new Error("Failed to create guest gamer record");
          }

          gamerId = createdGamerId;
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
          const { data: profileData } = await supabase.rpc(
            "get_active_profile"
          );
          if (Array.isArray(profileData) && profileData.length > 0) {
            activeProfile = profileData[0] ?? null;
          }
        } catch (profileError) {
          console.warn("Failed to fetch active profile", profileError);
        }
      }

      const userMetadata = (user?.user_metadata ?? {}) as Record<
        string,
        unknown
      >;

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
  selectDiscardCard: (cardId: string | null) => {
    set((state) => {
      const discardEntries = state.discardStack?.entries ?? [];
      if (discardEntries.length === 0) {
        return {};
      }

      const findIndex = (id: string | null) =>
        id
          ? discardEntries.findIndex((entry) => entry.card.id === id)
          : -1;

      const entriesWithMeta = discardEntries.map((entry, index) => ({
        entry,
        index,
        position: entry.card.position ?? index,
      }));

      const topOrder = entriesWithMeta
        .slice()
        .sort((a, b) => {
          if (a.position === b.position) {
            return b.index - a.index;
          }
          return b.position - a.position;
        })
        .map((meta) => meta.index);

      const indexToRank = new Map<number, number>();
      topOrder.forEach((originalIndex, rank) => {
        indexToRank.set(originalIndex, rank);
      });

      const getRank = (originalIndex: number) =>
        indexToRank.get(originalIndex) ?? Number.POSITIVE_INFINITY;

      const buildSelectionStateFromIndices = (
        primaryIndex: number,
        meldIndices: number[],
        options?: { resetPending?: boolean }
      ): Partial<GameStore> => {
        const primaryEntry = discardEntries[primaryIndex];
        if (!primaryEntry) {
          return {};
        }

        const uniqueIndices = Array.from(
          new Set([primaryIndex, ...meldIndices.filter((index) => index !== primaryIndex)])
        ).slice(0, 2);

        const ranks = uniqueIndices.map((idx) => getRank(idx));
        if (ranks.some((rank) => !Number.isFinite(rank))) {
          return {};
        }

        const maxRank = Math.max(...ranks);
        const pickupIndices = topOrder.filter((originalIndex) => {
          const rank = getRank(originalIndex);
          return rank <= maxRank;
        });

        if (pickupIndices.length === 0) {
          return {};
        }

        const pickupIds = pickupIndices.map(
          (originalIndex) => discardEntries[originalIndex].card.id
        );
        const uniqueMeldIds = uniqueIndices.map(
          (originalIndex) => discardEntries[originalIndex].card.id
        );

        const discardSelectionCount = uniqueMeldIds.length;
        const discardPickupCount = pickupIds.length;
        const requiredHandCardsForSelectedDiscard = Math.max(
          0,
          3 - discardSelectionCount
        );

        const highlightRange = {
          start: Math.min(...pickupIndices),
          end: Math.max(...pickupIndices),
        };

        const nextContext: TurnActionContext = {
          ...state.turnActionState.context,
          allowDrawFromDiscard: discardEntries.length > 0,
          discardSelectionCount,
          discardPickupCount,
          requiredHandCardsForSelectedDiscard,
          remainingHandCardsNeeded: requiredHandCardsForSelectedDiscard,
          totalMeldSelectionCount: discardSelectionCount,
          remainingCardsNeededForMeld: Math.max(0, 3 - discardSelectionCount),
          isDiscardMeld: true,
          selectedDiscardPickupCardIds: pickupIds,
          selectedDiscardMeldCardIds: uniqueMeldIds,
          discardHighlightRange: highlightRange,
        };

        console.log(
          "[selectDiscardCard] pickupIds=%o meldIds=%o",
          pickupIds,
          uniqueMeldIds
        );

        return {
          selectedDiscardCardId: primaryEntry.card.id,
          selectedDiscardPickupCardIds: pickupIds,
          selectedDiscardMeldCardIds: uniqueMeldIds,
          pendingMeldCardIds: options?.resetPending ? [] : state.pendingMeldCardIds,
          isSelectingMeld: true,
          turnActionState: {
            mode: "assembling_discard_meld",
            allowedActions: [
              "select_discard_card",
              "toggle_meld_card",
              "confirm_meld",
              "draw_from_discard",
              "cancel_selection",
            ],
            context: nextContext,
          },
        };
      };

      const resetSelection = (): Partial<GameStore> => {
        const mode: TurnActionMode = state.hasDrawnThisTurn
          ? "awaiting_discard"
          : "awaiting_draw";
        const allowedActions: TurnActionPermission[] = state.hasDrawnThisTurn
          ? [
              "select_hand_card",
              "discard_card",
              "start_meld_selection",
              "start_layoff_selection",
            ]
          : [
              "draw_from_deck",
              "draw_from_discard",
              "select_discard_card",
              "start_meld_selection",
            ];

        return {
          selectedDiscardCardId: null,
          selectedDiscardPickupCardIds: [],
          selectedDiscardMeldCardIds: [],
          pendingMeldCardIds: [],
          isSelectingMeld: false,
          turnActionState: {
            mode,
            allowedActions,
            context: {
              ...state.turnActionState.context,
              allowDrawFromDiscard: discardEntries.length > 0,
              isDiscardMeld: false,
              discardSelectionCount: 0,
              discardPickupCount: 0,
              requiredHandCardsForSelectedDiscard: 3,
              remainingHandCardsNeeded: 3,
              totalMeldSelectionCount: 0,
              remainingCardsNeededForMeld: 3,
              selectedDiscardPickupCardIds: [],
              selectedDiscardMeldCardIds: [],
              discardHighlightRange: null,
            },
          },
        };
      };

      if (!cardId) {
        return resetSelection();
      }

      const clickedIndex = findIndex(cardId);
      if (clickedIndex < 0) {
        return {};
      }

      const currentPrimaryId = state.selectedDiscardCardId;
      const secondaryId = state.selectedDiscardMeldCardIds.find(
        (id) => id !== currentPrimaryId
      );
      const clickedRank = getRank(clickedIndex);

      if (!currentPrimaryId) {
        if (!Number.isFinite(clickedRank)) {
          return {};
        }

        return buildSelectionStateFromIndices(clickedIndex, [clickedIndex], {
          resetPending: true,
        });
      }

      if (cardId === currentPrimaryId) {
        return resetSelection();
      }

      const primaryIndex = findIndex(currentPrimaryId);
      if (primaryIndex < 0) {
        if (!Number.isFinite(clickedRank)) {
          return {};
        }
        return buildSelectionStateFromIndices(clickedIndex, [clickedIndex], {
          resetPending: true,
        });
      }

      const primaryRank = getRank(primaryIndex);
      if (!Number.isFinite(primaryRank)) {
        return {};
      }

      if (secondaryId && cardId === secondaryId) {
        return buildSelectionStateFromIndices(primaryIndex, [primaryIndex], {
          resetPending: false,
        });
      }

      if (secondaryId) {
        // มีการเลือกใบที่สองแล้ว ไม่อนุญาตให้เลือกใบอื่นจนกว่าจะยกเลิก
        return {};
      }

      if (!Number.isFinite(clickedRank)) {
        return {};
      }

      // หากเลือกไพ่ที่อยู่ลึกกว่าของเดิม ให้เริ่มชุดใหม่
      if (clickedRank > primaryRank) {
        return buildSelectionStateFromIndices(clickedIndex, [clickedIndex], {
          resetPending: true,
        });
      }

      return buildSelectionStateFromIndices(primaryIndex, [primaryIndex, clickedIndex], {
        resetPending: false,
      });
    });
  },

  setTurnActionContext: (context) => {
    set((state) => ({
      turnActionState: {
        ...state.turnActionState,
        context: { ...state.turnActionState.context, ...context },
      },
    }));
  },

  setTurnActionMode: (mode, options) => {
    set((state) => ({
      turnActionState: {
        mode,
        allowedActions: options?.allowedActions ?? state.turnActionState.allowedActions,
        context: { ...state.turnActionState.context, ...(options?.context ?? {}) },
      },
    }));
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

      const latest =
        latestRooms && latestRooms.length > 0 ? latestRooms[0] : null;
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

      const { unsubscribeFromGame, loadGameState, subscribeToGameSession } =
        get();

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

      const { data: joinedRoomId, error } = await supabase.rpc(
        "join_game_room",
        {
          p_gamer_id: resolvedGamerId,
          p_guest_identifier: resolvedGuestId || undefined,
          p_room_code: data.roomCode || undefined,
          p_room_id: data.roomId || undefined,
          p_room_password: data.password || undefined,
        }
      );

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

      const { unsubscribeFromGame, loadGameState, subscribeToGameSession } =
        get();
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

      const resolvedGamerId = get().gamerId;
      if (!resolvedGamerId) {
        return null;
      }

      const resolvedGuestId = get().guestId;

      const { data, error } = await supabase.rpc("get_active_session_for_room", {
        p_room_id: roomId,
        p_gamer_id: resolvedGamerId,
        p_guest_identifier: resolvedGuestId || undefined,
      });

      if (error) throw error;
      return (data as string | null) ?? null;
    } catch (error) {
      console.error("Failed to fetch active session:", error);
      return null;
    }
  },
  getActiveSessionForRoom: async (roomId: string) => {
    return get().fetchActiveSessionForRoom(roomId);
  },
  loadGameResultSummary: async (sessionId: string) => {
    set({ isLoadingResultSummary: true, resultSummaryError: null });

    try {
      const { gamerId, guestId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId;
      if (!resolvedGamerId) {
        throw new Error("ไม่สามารถระบุผู้เล่นได้");
      }

      type SummaryPayload = {
        result: GameResultRow | null;
        players: GameResultPlayerRow[];
        melds: Array<
          GameMeldRow & {
            game_cards?: GameCardRow[];
          }
        >;
        events: GameScoreEventRow[];
        remaining_cards: GameCardRow[];
      };

      const { data, error } = await supabase.rpc(
        "get_game_result_summary",
        {
          p_session_id: sessionId,
          p_gamer_id: resolvedGamerId,
          p_guest_identifier: guestId || undefined,
        }
      );

      if (error) throw error;

      const payload = data as SummaryPayload | null;

      if (!payload || !payload.result) {
        set({
          gameResultSummary: null,
          gameResultPlayers: [],
          gameResultMelds: [],
          gameScoreEvents: [],
          isLoadingResultSummary: false,
          resultSummaryError: "ไม่พบข้อมูลสรุปเกม",
        });
        return;
      }

      const remainingCardRows = Array.isArray(payload.remaining_cards)
        ? payload.remaining_cards
        : [];
      const playerRows = Array.isArray(payload.players) ? payload.players : [];
      const meldRows = Array.isArray(payload.melds) ? payload.melds : [];
      const eventRows = Array.isArray(payload.events) ? payload.events : [];

      const remainingCardsMap = new Map<string, GameCard>();
      remainingCardRows.forEach((card) => {
        remainingCardsMap.set(card.id, mapGameCardRow(card));
      });

      const mapSummary = (row: GameResultRow): GameResultSummary => ({
        id: row.id,
        sessionId: row.session_id ?? "",
        roomId: row.room_id,
        winnerGamerId: row.winner_gamer_id,
        winningType: row.winning_type,
        totalRounds: row.total_rounds,
        totalMoves: row.total_moves,
        durationSeconds: row.game_duration_seconds,
        createdAt: row.created_at,
        summaryMetadata: (row.summary_metadata as Record<string, unknown>) ?? {},
        eloChanges: (row.elo_changes as Record<string, unknown>) ?? {},
      });

      const mapScoreEvent = (row: GameScoreEventRow): GameScoreEventEntry => ({
        id: row.id,
        sessionId: row.session_id,
        gamerId: row.gamer_id,
        eventType: row.event_type,
        points: row.points,
        relatedMeldId: row.related_meld_id,
        relatedCardIds: row.related_card_ids ?? [],
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.created_at,
      });

      const mapMeld = (
        row: GameMeldRow & { game_cards?: GameCardRow[] }
      ): GameResultMeld => ({
        id: row.id,
        sessionId: row.session_id,
        gamerId: row.gamer_id,
        meldType: row.meld_type as GameResultMeld["meldType"],
        createdFromHead: row.created_from_head,
        includesSpeto: row.includes_speto,
        scoreValue: row.score_value,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.created_at,
        cards: (row.game_cards ?? []).map(mapGameCardRow),
      });

      const mapPlayer = (row: GameResultPlayerRow): GameResultPlayerSummary => {
        const metadata = (row.metadata as Record<string, unknown>) ?? {};
        const deadwoodCardsRaw = Array.isArray(metadata.deadwood_cards)
          ? (metadata.deadwood_cards as DeadwoodCardDetail[])
          : [];

        const remainingCards = (row.remaining_card_ids ?? [])
          .map((cardId) => remainingCardsMap.get(cardId))
          .filter((card): card is GameCard => !!card);

        return {
          id: row.id,
          resultId: row.result_id,
          gamerId: row.gamer_id,
          position: row.position,
          totalPoints: row.total_points,
          meldPoints: row.meld_points ?? 0,
          bonusPoints: row.bonus_points ?? 0,
          penaltyPoints: row.penalty_points ?? 0,
          handPoints: row.hand_points ?? 0,
          isWinner: row.is_winner,
          specialEvents: row.special_events ?? [],
          displayedMeldIds: row.displayed_meld_ids ?? [],
          remainingCardIds: row.remaining_card_ids ?? [],
          remainingCards,
          metadata,
          deadwoodScore:
            typeof metadata.deadwood_score === "number" ? metadata.deadwood_score : 0,
          deadwoodCards: deadwoodCardsRaw,
          createdAt: row.created_at,
        };
      };

      set({
        gameResultSummary: mapSummary(payload.result),
        gameResultPlayers: playerRows.map(mapPlayer),
        gameResultMelds: meldRows.map(mapMeld),
        gameScoreEvents: eventRows.map(mapScoreEvent),
        isLoadingResultSummary: false,
        resultSummaryError: null,
      });
    } catch (error) {
      console.error("Failed to load game result summary:", error);
      set({
        isLoadingResultSummary: false,
        resultSummaryError:
          error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลสรุปเกมได้",
      });
    }
  },
  loadGameResultSummaryForRoom: async (roomId: string) => {
    set({ isLoadingResultSummary: true, resultSummaryError: null });

    try {
      const { gamerId, guestId } = get();
      if (!gamerId) {
        await get().initializeGamer();
      }

      const resolvedGamerId = get().gamerId;
      if (!resolvedGamerId) {
        throw new Error("ไม่สามารถระบุผู้เล่นได้");
      }

      const { data, error } = await supabase.rpc(
        "get_latest_game_result_for_room",
        {
          p_room_id: roomId,
          p_gamer_id: resolvedGamerId,
          p_guest_identifier: guestId || undefined,
        }
      );

      if (error) throw error;

      const sessionId =
        Array.isArray(data) && data.length > 0 ? data[0]?.session_id : null;

      if (!sessionId) {
        set({
          gameResultSummary: null,
          gameResultPlayers: [],
          gameResultMelds: [],
          gameScoreEvents: [],
          isLoadingResultSummary: false,
          resultSummaryError: "ไม่พบข้อมูลสรุปเกม",
        });
        return;
      }

      await get().loadGameResultSummary(sessionId);
    } catch (error) {
      console.error("Failed to load game result summary by room:", error);
      set({
        isLoadingResultSummary: false,
        resultSummaryError:
          error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลสรุปเกมได้",
      });
    }
  },
  resetGameResultSummary: () => {
    set({
      gameResultSummary: null,
      gameResultPlayers: [],
      gameResultMelds: [],
      gameScoreEvents: [],
      isLoadingResultSummary: false,
      resultSummaryError: null,
    });
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
  unsubscribeFromRoom: async () => {
    const { roomChannel } = get();
    if (roomChannel) {
      await supabase.removeChannel(roomChannel);
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
      const myMelds = (payload.my_melds ?? []).map(mapPlayerMeld);
      const tableMelds = (payload.table_melds ?? []).map(mapTableMeld);
      const discardTop = payload.discard_top
        ? mapGameCardRow(payload.discard_top)
        : null;
      const discardStackCards = (payload.discard_stack ?? []).map(
        mapGameCardRow
      );
      const otherPlayers = (payload.other_players ?? []).map(
        mapOtherPlayerSummary
      );

      const prevState = get();
      const prevSelectedDiscardId = prevState.selectedDiscardCardId;
      const discardStack: DiscardStackInfo | null =
        discardStackCards.length > 0
          ? {
              entries: discardStackCards.map((card) => ({
                card,
                canSelect: true,
              })),
              selectedCardId: prevSelectedDiscardId &&
                discardStackCards.some((card) => card.id === prevSelectedDiscardId)
                ? prevSelectedDiscardId
                : null,
            }
          : null;

      const isMyTurn = session?.currentTurnGamerId === gamerId;
      const hasDrawn = prevState.hasDrawnThisTurn && isMyTurn;

      const nextTurnState: TurnActionState = !isMyTurn
        ? { mode: "idle", allowedActions: [], context: {} }
        : hasDrawn
        ? {
            mode: "awaiting_discard",
            allowedActions: [
              "select_hand_card",
              "discard_card",
              "start_meld_selection",
              "start_layoff_selection",
            ],
            context: {},
          }
        : {
            mode: "awaiting_draw",
            allowedActions: [
              "draw_from_deck",
              "draw_from_discard",
              "select_discard_card",
              "start_meld_selection",
            ],
            context: { allowDrawFromDiscard: discardStackCards.length > 0 },
          };

      set({
        currentSession: session,
        myHand,
        myMelds,
        tableMelds,
        discardTop,
        discardStack,
        otherPlayers,
        pendingMeldCardIds: [],
        isSelectingMeld: false,
        pendingLayoffCardIds: [],
        isSelectingLayoff: false,
        targetMeldId: null,
        selectedDiscardCardId: discardStack?.selectedCardId ?? null,
        hasDrawnThisTurn: hasDrawn,
        turnActionState: nextTurnState,
      });
    } catch (error) {
      console.error("Failed to load game state:", error);
      set({ error: "ไม่สามารถโหลดสถานะเกมได้" });
      throw error;
    }
  },

  drawCard: async (
    fromDeck: boolean,
    options?: { meldCards?: string[]; selectedDiscardCardId?: string }
  ) => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) {
        throw new Error("ไม่พบเซสชันเกม");
      }

      const { error } = await supabase.rpc(
        fromDeck ? "draw_card" : "draw_discard_and_meld",
        fromDeck
          ? {
              p_session_id: currentSession.id,
              p_gamer_id: gamerId,
              p_guest_identifier: guestId || undefined,
            }
          : {
              p_session_id: currentSession.id,
              p_gamer_id: gamerId,
              p_guest_identifier: guestId || undefined,
              p_meld_cards: options?.meldCards ?? [],
              p_selected_discard_card_id:
                options?.selectedDiscardCardId || undefined,
            }
      );

      if (error) throw error;

      set({ hasDrawnThisTurn: true });

      await get().loadGameState(currentSession.id);

      if (!fromDeck) {
        set({
          pendingMeldCardIds: [],
          isSelectingMeld: false,
          selectedDiscardCardId: null,
          selectedDiscardPickupCardIds: [],
          selectedDiscardMeldCardIds: [],
        });
      }
    } catch (error) {
      console.error("Failed to draw card:", error);
      set({
        error: error instanceof Error ? error.message : "ไม่สามารถจั่วไพ่ได้",
      });
      throw error;
    }
  },

  createMeld: async (cardIds?: string[]) => {
    try {
      const { currentSession, gamerId, guestId, pendingMeldCardIds } = get();
      if (!currentSession || !gamerId) {
        throw new Error("ไม่พบเซสชันเกม");
      }

      const selectedCards =
        cardIds && cardIds.length > 0 ? cardIds : pendingMeldCardIds;

      if (!selectedCards || selectedCards.length < 3) {
        throw new Error("ต้องเลือกไพ่อย่างน้อย 3 ใบเพื่อเกิด");
      }

      const { data, error } = await supabase.rpc("create_meld", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_meld_cards: selectedCards,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      await get().loadGameState(currentSession.id);
      set({
        pendingMeldCardIds: [],
        isSelectingMeld: false,
        hasDrawnThisTurn: true,
        turnActionState: {
          mode: "awaiting_discard",
          allowedActions: [
            "select_hand_card",
            "discard_card",
            "start_meld_selection",
            "start_layoff_selection",
          ],
          context: {},
        },
      });
      return (data as string) ?? "";
    } catch (error) {
      console.error("Failed to create meld:", error);
      set({
        error: error instanceof Error ? error.message : "ไม่สามารถเกิดไพ่ได้",
      });
      throw error;
    }
  },

  startMeldSelection: () => {
    set((state) => {
      const discardSelectionCount =
        state.turnActionState.context.discardSelectionCount ?? 0;
      const requiredHandCardsForSelectedDiscard = Math.max(
        0,
        3 - discardSelectionCount
      );
      const isDiscardMeld =
        Boolean(state.selectedDiscardCardId) ||
        Boolean(state.turnActionState.context.isDiscardMeld);

      return {
        isSelectingMeld: true,
        pendingMeldCardIds: [],
        turnActionState: {
          mode: isDiscardMeld
            ? "assembling_discard_meld"
            : "selecting_meld",
          allowedActions: [
            "toggle_meld_card",
            "confirm_meld",
            "cancel_selection",
          ],
          context: {
            ...state.turnActionState.context,
            discardSelectionCount,
            requiredHandCardsForSelectedDiscard,
            remainingHandCardsNeeded: requiredHandCardsForSelectedDiscard,
            totalMeldSelectionCount: discardSelectionCount,
            remainingCardsNeededForMeld: Math.max(
              0,
              3 - discardSelectionCount
            ),
            isDiscardMeld,
          },
        },
      };
    });
  },

  cancelMeldSelection: () => {
    set((state) => ({
      isSelectingMeld: false,
      pendingMeldCardIds: [],
      turnActionState: (() => {
        if (
          state.turnActionState.context.isDiscardMeld &&
          state.selectedDiscardCardId
        ) {
          return {
            mode: "selecting_discard_meld" as TurnActionMode,
            allowedActions: [
              "select_discard_card",
              "start_meld_selection",
              "cancel_selection",
            ],
            context: {
              ...state.turnActionState.context,
              isDiscardMeld: true,
            },
          } satisfies TurnActionState;
        }

        return {
          mode: state.hasDrawnThisTurn ? "awaiting_discard" : "awaiting_draw",
          allowedActions: state.hasDrawnThisTurn
            ? [
                "select_hand_card",
                "discard_card",
                "start_meld_selection",
                "start_layoff_selection",
              ]
            : [
                "draw_from_deck",
                "draw_from_discard",
                "select_discard_card",
                "start_meld_selection",
              ],
          context: {
            ...state.turnActionState.context,
            isDiscardMeld: false,
          },
        } satisfies TurnActionState;
      })(),
    }));
  },

  toggleMeldCard: (cardId: string) => {
    set((state) => {
      const shouldStart =
        !state.isSelectingMeld && state.pendingMeldCardIds.length === 0;
      if (shouldStart) {
        return { isSelectingMeld: true, pendingMeldCardIds: [cardId] };
      }

      const exists = state.pendingMeldCardIds.includes(cardId);
      const pendingMeldCardIds = exists
        ? state.pendingMeldCardIds.filter((id) => id !== cardId)
        : [...state.pendingMeldCardIds, cardId];

      const discardSelectionCount =
        state.turnActionState.context.discardSelectionCount ?? 0;
      const totalSelected = discardSelectionCount + pendingMeldCardIds.length;
      const requiredHandCardsForSelectedDiscard = Math.max(
        0,
        3 - discardSelectionCount
      );
      const remainingHandCardsNeeded = Math.max(
        0,
        requiredHandCardsForSelectedDiscard - pendingMeldCardIds.length
      );
      const remainingCardsNeededForMeld = Math.max(0, 3 - totalSelected);
      const isDiscardMeld = Boolean(state.turnActionState.context.isDiscardMeld);
      const hasPending = pendingMeldCardIds.length > 0;

      const nextMode: TurnActionMode = isDiscardMeld
        ? hasPending
          ? "assembling_discard_meld"
          : "selecting_discard_meld"
        : hasPending
        ? "selecting_meld"
        : state.hasDrawnThisTurn
        ? "awaiting_discard"
        : "awaiting_draw";

      let nextAllowedActions: TurnActionPermission[];
      if (hasPending) {
        nextAllowedActions = [
          "toggle_meld_card",
          "confirm_meld",
          "cancel_selection",
        ];
        if (isDiscardMeld) {
          nextAllowedActions.push("draw_from_discard");
        }
      } else if (isDiscardMeld) {
        nextAllowedActions = [
          "select_discard_card",
          "start_meld_selection",
          "cancel_selection",
          "draw_from_discard",
        ];
      } else if (state.hasDrawnThisTurn) {
        nextAllowedActions = [
          "select_hand_card",
          "discard_card",
          "start_meld_selection",
          "start_layoff_selection",
        ];
      } else {
        nextAllowedActions = [
          "draw_from_deck",
          "draw_from_discard",
          "select_discard_card",
          "start_meld_selection",
        ];
      }

      return {
        pendingMeldCardIds,
        isSelectingMeld: hasPending,
        turnActionState: {
          mode: nextMode,
          allowedActions: nextAllowedActions,
          context: {
            ...state.turnActionState.context,
            discardSelectionCount,
            requiredHandCardsForSelectedDiscard,
            remainingHandCardsNeeded,
            totalMeldSelectionCount: totalSelected,
            remainingCardsNeededForMeld,
            isDiscardMeld,
          },
        },
      };
    });
  },

  startLayoffSelection: () => {
    set((state) => ({
      isSelectingLayoff: true,
      pendingLayoffCardIds: [],
      targetMeldId: null,
      turnActionState: {
        mode: "selecting_layoff",
        allowedActions: [
          "select_hand_card",
          "toggle_layoff_card",
          "confirm_layoff",
          "cancel_selection",
        ],
        context: state.turnActionState.context,
      },
    }));
  },

  cancelLayoffSelection: () => {
    set((state) => ({
      isSelectingLayoff: false,
      pendingLayoffCardIds: [],
      targetMeldId: null,
      turnActionState: {
        mode: state.hasDrawnThisTurn ? "awaiting_discard" : "awaiting_draw",
        allowedActions: state.hasDrawnThisTurn
          ? [
              "select_hand_card",
              "discard_card",
              "start_meld_selection",
              "start_layoff_selection",
            ]
          : [
              "draw_from_deck",
              "draw_from_discard",
              "select_discard_card",
              "start_meld_selection",
            ],
        context: state.turnActionState.context,
      },
    }));
  },

  toggleLayoffCard: (cardId: string) => {
    set((state) => {
      const exists = state.pendingLayoffCardIds.includes(cardId);
      const pendingLayoffCardIds = exists
        ? state.pendingLayoffCardIds.filter((id) => id !== cardId)
        : [...state.pendingLayoffCardIds, cardId];

      return {
        pendingLayoffCardIds,
        isSelectingLayoff: pendingLayoffCardIds.length > 0 || state.targetMeldId !== null,
        turnActionState: {
          mode: "selecting_layoff",
          allowedActions: [
            "select_hand_card",
            "toggle_layoff_card",
            "confirm_layoff",
            "cancel_selection",
          ],
          context: {
            ...state.turnActionState.context,
            totalMeldSelectionCount: pendingLayoffCardIds.length,
          },
        },
      };
    });
  },

  selectLayoffTarget: (meldId: string | null) => {
    set((state) => ({
      targetMeldId: meldId,
      isSelectingLayoff: state.pendingLayoffCardIds.length > 0 || !!meldId,
      turnActionState: {
        mode: "selecting_layoff",
        allowedActions: [
          "select_hand_card",
          "toggle_layoff_card",
          "confirm_layoff",
          "cancel_selection",
        ],
        context: state.turnActionState.context,
      },
    }));
  },

  confirmLayoff: async () => {
    try {
      const {
        currentSession,
        gamerId,
        guestId,
        pendingLayoffCardIds,
        targetMeldId,
        myMelds,
        tableMelds,
      } = get();

      if (!currentSession || !gamerId) {
        throw new Error("ไม่พบเซสชันเกม");
      }

      if (!targetMeldId) {
        throw new Error("โปรดเลือกกองที่จะฝากไพ่");
      }

      if (!pendingLayoffCardIds.length) {
        throw new Error("โปรดเลือกไพ่ที่จะฝากอย่างน้อย 1 ใบ");
      }

      const allMelds = [...myMelds, ...tableMelds];
      const targetMeld = allMelds.find((meld) => meld.meldId === targetMeldId);

      if (!targetMeld) {
        throw new Error("ไม่พบกองไพ่ที่เลือก");
      }

      const meldCardIds = targetMeld.cards.map((card) => card.id);

      const { error } = await supabase.rpc("layoff_cards", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_target_meld_id: targetMeldId,
        p_target_meld_card_ids: meldCardIds,
        p_layoff_card_ids: pendingLayoffCardIds,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      await get().loadGameState(currentSession.id);
      set({
        pendingLayoffCardIds: [],
        isSelectingLayoff: false,
        targetMeldId: null,
        hasDrawnThisTurn: true,
      });
    } catch (error) {
      console.error("Failed to layoff cards:", error);
      set({
        error: error instanceof Error ? error.message : "ไม่สามารถฝากไพ่ได้",
      });
      throw error;
    }
  },

  /**
   * Discard a card
   */
  discardCard: async (cardId: string, forceDiscard = false) => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) throw new Error("ไม่พบเซสชันเกม");

      const { data, error } = await supabase.rpc("discard_card_with_validation", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_card_id: cardId,
        p_guest_identifier: guestId || undefined,
        p_force_discard: forceDiscard,
      });

      if (error) throw error;

      // ตรวจสอบผลการ validate
      // @ts-expect-error - response type จะถูก generate หลัง migration
      if (data && !data.success) {
        // @ts-expect-error - validation field ยังไม่มีใน generated types
        const validation = data.validation;
        const errorMessage = validation?.violation_message || "ไม่สามารถทิ้งไพ่ได้";
        
        set({
          error: errorMessage,
          validationError: {
            type: validation?.violation_type,
            message: errorMessage,
            canForce: validation?.violation_type === "can_meld_immediately",
          },
        });
        throw new Error(errorMessage);
      }

      // Reload game state
      await get().loadGameState(currentSession.id);
      set({
        pendingMeldCardIds: [],
        isSelectingMeld: false,
        selectedDiscardCardId: null,
        hasDrawnThisTurn: false,
        validationError: null,
        turnActionState: {
          mode: "idle",
          allowedActions: [],
          context: {},
        },
      });
    } catch (error) {
      console.error("Failed to discard card:", error);
      if (!get().validationError) {
        set({
          error: error instanceof Error ? error.message : "ไม่สามารถทิ้งไพ่ได้",
        });
      }
      throw error;
    }
  },

  sortHandByRank: async () => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) {
        throw new Error("ไม่พบเซสชันเกม");
      }

      set({ isLoading: true });

      const { error } = await supabase.rpc("sort_hand_by_rank", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      await get().loadGameState(currentSession.id);
    } catch (error) {
      console.error("Failed to sort hand by rank:", error);
      set({
        error:
          error instanceof Error ? error.message : "ไม่สามารถจัดเรียงไพ่ตามแต้มได้",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  sortHandBySuit: async () => {
    try {
      const { currentSession, gamerId, guestId } = get();
      if (!currentSession || !gamerId) {
        throw new Error("ไม่พบเซสชันเกม");
      }

      set({ isLoading: true });

      const { error } = await supabase.rpc("sort_hand_by_suit", {
        p_session_id: currentSession.id,
        p_gamer_id: gamerId,
        p_guest_identifier: guestId || undefined,
      });

      if (error) throw error;

      await get().loadGameState(currentSession.id);
    } catch (error) {
      console.error("Failed to sort hand by suit:", error);
      set({
        error:
          error instanceof Error ? error.message : "ไม่สามารถจัดเรียงไพ่ตามดอกได้",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Subscribe to game session updates
   */
  subscribeToGameSession: async (sessionId: string) => {
    let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        get().loadGameState(sessionId);
        reloadTimeout = null;
      }, 100);
    };

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
        scheduleReload
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        scheduleReload
      )
      .subscribe((status) => {
        console.log("Game session subscription response:", status);
      });

    set({ gameChannel: channel });
  },

  /**
   * Unsubscribe from game session
   */
  unsubscribeFromGame: async () => {
    const { gameChannel } = get();
    if (gameChannel) {
      await supabase.removeChannel(gameChannel);
      set({ gameChannel: null });
    }
  },
}));
