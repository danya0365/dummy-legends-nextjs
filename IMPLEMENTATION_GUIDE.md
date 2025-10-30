# Dummy Legends - Implementation Guide

## 🎯 การ Integrate Supabase กับ gameStore.ts

### 1. Setup Supabase Client

```typescript
// src/infrastructure/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/domain/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### 2. Guest Management Helper

```typescript
// src/utils/guestIdentifier.ts
const GUEST_ID_KEY = "dummy_legends_guest_id";
const GAMER_ID_KEY = "dummy_legends_gamer_id";

export const guestIdentifier = {
  // Get or create guest identifier
  getOrCreate(): string {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  },

  // Get stored gamer ID
  getGamerId(): string | null {
    return localStorage.getItem(GAMER_ID_KEY);
  },

  // Store gamer ID
  setGamerId(gamerId: string): void {
    localStorage.setItem(GAMER_ID_KEY, gamerId);
  },

  // Clear on logout/link to profile
  clear(): void {
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GAMER_ID_KEY);
  },

  // Check if user is guest
  isGuest(): boolean {
    return !!localStorage.getItem(GUEST_ID_KEY);
  },
};
```

### 3. Updated gameStore.ts

```typescript
// src/stores/gameStore.ts
"use client";

import { create } from "zustand";
import { supabase } from "@/src/infrastructure/supabase/client";
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
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  subscribeToRoom: (roomId: string) => Promise<void>;
  unsubscribeFromRoom: () => void;
  linkGuestToProfile: (profileId: string) => Promise<void>;
}

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
        p_guest_identifier: get().guestId,
        p_room_name: data.name,
        p_mode: data.mode,
        p_max_players: data.maxPlayers,
        p_bet_amount: data.betAmount,
        p_time_limit_seconds: data.timeLimit,
        p_is_private: data.isPrivate,
        p_room_password: data.password,
      });

      if (error) throw error;

      const roomId = roomData[0].room_id;
      const roomCode = roomData[0].room_code;

      // Fetch full room details
      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: roomId }
      );

      if (detailsError) throw detailsError;

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
        players: roomDetails.players || [],
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
        p_guest_identifier: get().guestId,
        p_room_code: data.roomCode,
        p_room_id: data.roomId,
        p_room_password: data.password,
      });

      if (error) throw error;

      // Fetch room details
      const { data: roomDetails, error: detailsError } = await supabase.rpc(
        "get_room_details",
        { p_room_id: roomId }
      );

      if (detailsError) throw detailsError;

      const room: GameRoom = {
        id: roomDetails.room.id,
        code: roomDetails.room.room_code,
        hostId: roomDetails.room.host_gamer_id,
        name: roomDetails.room.room_name,
        status: roomDetails.room.status,
        mode: roomDetails.room.mode,
        settings: {
          maxPlayers: roomDetails.room.max_players,
          betAmount: roomDetails.room.bet_amount,
          timeLimit: roomDetails.room.time_limit_seconds,
          isPrivate: roomDetails.room.is_private,
          allowSpectators: roomDetails.room.allow_spectators,
        },
        players: roomDetails.players || [],
        spectators: [],
        currentPlayerCount: roomDetails.room.current_player_count,
        maxPlayerCount: roomDetails.room.max_players,
        createdAt: roomDetails.room.created_at,
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
        p_guest_identifier: guestId,
        p_room_id: currentRoom.id,
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
          p_guest_identifier: guestId,
          p_room_id: currentRoom.id,
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
      const { currentRoom, gamerId } = get();
      if (!currentRoom || !gamerId) {
        throw new Error("ไม่พบห้องเกม");
      }

      const isHost = currentRoom.players.find(
        (p) => p.userId === gamerId
      )?.isHost;
      if (!isHost) {
        throw new Error("เฉพาะเจ้าของห้องเท่านั้นที่เริ่มเกมได้");
      }

      const allReady = currentRoom.players.every((p) => p.isReady || p.isHost);
      if (!allReady) {
        throw new Error("ผู้เล่นบางคนยังไม่พร้อม");
      }

      if (currentRoom.currentPlayerCount < 2) {
        throw new Error("ต้องมีผู้เล่นอย่างน้อย 2 คน");
      }

      // TODO: Call RPC to start game session
      // This will create game_session, deal cards, etc.

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "เริ่มเกมไม่สำเร็จ",
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

      const mappedRooms: GameRoom[] = rooms.map((room) => ({
        id: room.id,
        code: room.room_code,
        hostId: room.host_gamer_id,
        name: room.room_name,
        status: room.status,
        mode: room.mode,
        settings: {
          maxPlayers: room.max_players,
          betAmount: room.bet_amount,
          timeLimit: 60, // Default, fetch from room if needed
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
          error instanceof Error ? error.message : "โหลดรายการห้องไม่สำเร็จ",
        isLoading: false,
      });
      throw error;
    }
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
          // TODO: Update currentRoom.players
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

  /**
   * Link guest account to profile
   */
  linkGuestToProfile: async (profileId: string) => {
    try {
      const { guestId } = get();
      if (!guestId) {
        throw new Error("ไม่ใช่บัญชีแขก");
      }

      const { error } = await supabase.rpc("link_guest_to_profile", {
        p_guest_identifier: guestId,
        p_profile_id: profileId,
      });

      if (error) throw error;

      // Clear guest data
      guestIdentifier.clear();

      // Re-initialize as authenticated user
      await get().initializeGamer();
    } catch (error) {
      console.error("Failed to link guest:", error);
      set({ error: "เชื่อมบัญชีไม่สำเร็จ" });
      throw error;
    }
  },
}));
```

### 4. Usage in Components

```typescript
// app/game/lobby/page.tsx
"use client";

import { useEffect } from "react";
import { useGameStore } from "@/src/stores/gameStore";

export default function LobbyPage() {
  const {
    availableRooms,
    isLoading,
    error,
    initializeGamer,
    fetchAvailableRooms,
    joinRoom,
  } = useGameStore();

  useEffect(() => {
    // Initialize gamer on mount
    initializeGamer().then(() => {
      fetchAvailableRooms();
    });
  }, []);

  const handleJoinRoom = async (roomCode: string) => {
    try {
      await joinRoom({ roomCode });
      // Navigate to room
      router.push(`/game/room/${roomCode}`);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  if (isLoading) return <div>กำลังโหลด...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div>
      <h1>ห้องเกมที่เปิดรับ</h1>
      {availableRooms.map((room) => (
        <div key={room.id}>
          <h2>{room.name}</h2>
          <p>
            ผู้เล่น: {room.currentPlayerCount}/{room.maxPlayerCount}
          </p>
          <p>โหมด: {room.mode}</p>
          <button onClick={() => handleJoinRoom(room.code)}>เข้าร่วม</button>
        </div>
      ))}
    </div>
  );
}
```

```typescript
// app/game/room/[roomCode]/page.tsx
"use client";

import { useEffect } from "react";
import { useGameStore } from "@/src/stores/gameStore";
import { useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  const {
    currentRoom,
    isInRoom,
    gamerId,
    toggleReady,
    startGame,
    leaveRoom,
    joinRoom,
    initializeGamer,
  } = useGameStore();

  useEffect(() => {
    // Initialize and join room
    const init = async () => {
      await initializeGamer();
      if (!isInRoom) {
        await joinRoom({ roomCode });
      }
    };
    init();

    // Cleanup on unmount
    return () => {
      leaveRoom();
    };
  }, []);

  if (!currentRoom) return <div>กำลังโหลด...</div>;

  const myPlayer = currentRoom.players.find((p) => p.userId === gamerId);
  const isHost = myPlayer?.isHost;
  const canStart =
    isHost && currentRoom.players.every((p) => p.isReady || p.isHost);

  return (
    <div>
      <h1>{currentRoom.name}</h1>
      <p>รหัสห้อง: {currentRoom.code}</p>
      <p>สถานะ: {currentRoom.status}</p>

      <h2>
        ผู้เล่น ({currentRoom.currentPlayerCount}/{currentRoom.maxPlayerCount})
      </h2>
      <ul>
        {currentRoom.players.map((player) => (
          <li key={player.id}>
            {player.displayName}
            {player.isHost && " (เจ้าของห้อง)"}
            {player.isReady && " ✅"}
          </li>
        ))}
      </ul>

      <button onClick={() => toggleReady()}>
        {myPlayer?.isReady ? "ยกเลิกพร้อม" : "พร้อมแล้ว"}
      </button>

      {isHost && (
        <button onClick={() => startGame()} disabled={!canStart}>
          เริ่มเกม
        </button>
      )}

      <button onClick={() => leaveRoom()}>ออกจากห้อง</button>
    </div>
  );
}
```

## 🔧 Environment Setup

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 TODO List

### Phase 1: Core Functionality ✅

- [x] Database schema with migrations
- [x] RLS policies for guest and authenticated users
- [x] RPC functions for gamer and room management
- [x] Realtime subscriptions setup

### Phase 2: Game Logic

- [ ] Start game session RPC
- [ ] Deal cards algorithm
- [ ] Turn management
- [ ] Draw card RPC
- [ ] Discard card RPC
- [ ] Meld validation and creation
- [ ] Knock/Gin logic
- [ ] Calculate deadwood
- [ ] End round scoring

### Phase 3: Advanced Features

- [ ] ELO rating calculation
- [ ] Achievements system
- [ ] Tournament mode
- [ ] Spectator mode
- [ ] Chat system
- [ ] Replay system
- [ ] Analytics dashboard

### Phase 4: UI/UX

- [ ] Beautiful card animations
- [ ] Sound effects
- [ ] Music
- [ ] Theme system
- [ ] Mobile optimization
- [ ] Tutorial system

## 🎮 Game Session Flow

```typescript
// Example: Complete game session flow

// 1. Create room
const room = await createRoom({...});

// 2. Players join
await joinRoom({ roomCode: room.code });

// 3. All ready
await toggleReady();

// 4. Host starts game
await startGame();
// → Creates game_session
// → Deals cards to all players
// → Sets first player turn

// 5. Game loop
while (!gameEnded) {
  // Current player's turn
  await drawCard(); // or drawFromDiscard()
  await discardCard(cardId);
  // or
  await meldCards(cardIds);
  // or
  await knockOrGin();
}

// 6. End game
// → Calculate scores
// → Update ELO
// → Save results
// → Show winner
```

## 🚀 Deployment

```bash
# 1. Run migrations
supabase migration up

# 2. Generate types
supabase gen types typescript --local > src/domain/types/supabase.ts

# 3. Build app
npm run build

# 4. Deploy
vercel deploy
```

---

**Happy Gaming! 🎮🃏**
