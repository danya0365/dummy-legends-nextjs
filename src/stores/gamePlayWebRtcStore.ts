"use client";

import { create } from "zustand";
import type { GameCard } from "@/src/domain/types/gameplay.types";
import { useGameStoreWebRtc } from "./gameStoreWebRtc";

export type GamePlayPhase = "lobby" | "dealing" | "turn" | "finished";

export type ActionKind =
  | "DRAW_FROM_DECK"
  | "DRAW_FROM_DISCARD"
  | "DISCARD_CARD"
  | "START_MELD"
  | "CONFIRM_MELD"
  | "CANCEL_MELD"
  | "LAYOFF"
  | "END_TURN"
  | "REQUEST_SYNC";

export interface ActionPayloadMap {
  DRAW_FROM_DECK: Record<string, never>;
  DRAW_FROM_DISCARD: { discardCardId: string };
  DISCARD_CARD: { cardId: string };
  START_MELD: { cardIds: string[] };
  CONFIRM_MELD: Record<string, never>;
  CANCEL_MELD: Record<string, never>;
  LAYOFF: { targetMeldId: string; cardIds: string[] };
  END_TURN: Record<string, never>;
  REQUEST_SYNC: Record<string, never>;
}

export interface PlayerSeat {
  peerId: string;
  displayName: string;
  handCount: number;
  isHost: boolean;
  isReady: boolean;
  lastUpdated: number;
}

export interface TableMeldEntry {
  meldId: string;
  ownerPeerId: string;
  cards: GameCard[];
}

export interface DiscardStackEntryView {
  card: GameCard;
  byPeerId: string;
  at: number;
}

export interface LastActionEntry {
  id: string;
  action: ActionKind;
  actorPeerId: string;
  timestamp: number;
  payload?: unknown;
}

export interface GameSnapshot {
  room: {
    roomId: string;
    joinCode: string;
    hostPeerId: string;
    createdAt: number;
  };
  phase: GamePlayPhase;
  turn: {
    currentPeerId: string | null;
    startedAt: number | null;
    remainingMs: number | null;
  };
  players: PlayerSeat[];
  hands: Record<string, number>;
  tableMelds: TableMeldEntry[];
  discardStack: {
    topCard: GameCard | null;
    entries: DiscardStackEntryView[];
  };
  deckCount: number;
  lastAction?: LastActionEntry;
  scores?: Record<string, number>;
  result?: {
    winnerPeerId: string;
    winningType: string;
    finishedAt: number;
  };
}

export interface ActionRequestPayload<K extends ActionKind = ActionKind> {
  id: string;
  action: K;
  actorPeerId: string;
  timestamp: number;
  payload?: ActionPayloadMap[K];
}

export interface ActionAckPayload {
  id: string;
  actionId: string;
  status: "accepted" | "rejected";
  responderPeerId: string;
  recipientPeerId?: string;
  reason?: string;
  timestamp: number;
}

export interface HandSyncPayload {
  peerId: string;
  hand: GameCard[];
}

export interface SystemNoticePayload {
  level: "info" | "warning" | "error";
  message: string;
}

interface WebRtcGameMessage<TPayload = unknown> {
  id: string;
  type: string;
  payload?: TPayload;
  senderId: string;
  timestamp: number;
}

interface InitializeOptions {
  role: "host" | "guest";
  roomId?: string | null;
  hostPeerId?: string | null;
  initialSnapshot?: GameSnapshot | null;
}

interface HostBroadcastOptions {
  hands?: Record<string, GameCard[]>;
  targetPeerId?: string;
  broadcastHands?: boolean;
}

interface GamePlayWebRtcStoreState {
  role: "host" | "guest" | null;
  localPeerId: string | null;
  hostPeerId: string | null;
  roomId: string | null;
  snapshot: GameSnapshot | null;
  handLookup: Record<string, GameCard[]>;
  myHand: GameCard[];
  isSynced: boolean;
  pendingActions: ActionRequestPayload[];
  incomingActionRequests: ActionRequestPayload[];
  lastActionAck: ActionAckPayload | null;
  notices: Array<SystemNoticePayload & { id: string; timestamp: number }>;
  error: string | null;
  initialize: (options: InitializeOptions) => void;
  cleanup: () => void;
  sendActionRequest: <K extends ActionKind>(type: K, payload?: ActionPayloadMap[K]) => void;
  requestStateSync: () => void;
  hostBroadcastSnapshot: (snapshot: GameSnapshot, options?: HostBroadcastOptions) => void;
  hostSendHandSnapshot: (peerId: string, hand: GameCard[]) => void;
  hostAcknowledgeAction: (params: {
    actionId: string;
    status: "accepted" | "rejected";
    reason?: string;
    recipientPeerId: string;
  }) => void;
  hostConsumeNextActionRequest: (actionId?: string) => ActionRequestPayload | null;
  clearNotice: (id: string) => void;
  clearError: () => void;
}

const MAX_NOTICE_HISTORY = 20;

const initialState: Omit<
  GamePlayWebRtcStoreState,
  | "initialize"
  | "cleanup"
  | "sendActionRequest"
  | "requestStateSync"
  | "hostBroadcastSnapshot"
  | "hostSendHandSnapshot"
  | "hostAcknowledgeAction"
  | "hostConsumeNextActionRequest"
  | "clearNotice"
  | "clearError"
> = {
  role: null,
  localPeerId: null,
  hostPeerId: null,
  roomId: null,
  snapshot: null,
  handLookup: {},
  myHand: [],
  isSynced: false,
  pendingActions: [],
  incomingActionRequests: [],
  lastActionAck: null,
  notices: [],
  error: null,
};

let unsubscribeMessageStream: (() => void) | null = null;
const handledMessageIds = new Set<string>();

export const useGamePlayWebRtcStore = create<GamePlayWebRtcStoreState>((set, get) => {
  const sendBaseMessage = useGameStoreWebRtc.getState().sendMessage;

  const reset = () => {
    handledMessageIds.clear();
    set({ ...initialState });
  };

  const detachBridge = () => {
    if (unsubscribeMessageStream) {
      unsubscribeMessageStream();
      unsubscribeMessageStream = null;
    }
    handledMessageIds.clear();
  };

  const appendNotice = (notice: SystemNoticePayload & { id: string; timestamp: number }) => {
    set((state) => ({
      notices: [notice, ...state.notices].slice(0, MAX_NOTICE_HISTORY),
    }));
  };

  const handleStateSync = (snapshot: GameSnapshot, message: WebRtcGameMessage) => {
    set({
      snapshot,
      roomId: snapshot.room.roomId,
      hostPeerId: snapshot.room.hostPeerId,
      isSynced: true,
      error: null,
    });

    appendNotice({
      id: message.id,
      level: "info",
      message: "ได้รับสถานะเกมล่าสุด",
      timestamp: message.timestamp,
    });
  };

  const handleHandSync = (payload: HandSyncPayload) => {
    const { localPeerId } = get();
    if (!localPeerId || payload.peerId !== localPeerId) {
      return;
    }

    set((state) => ({
      myHand: payload.hand,
      handLookup: {
        ...state.handLookup,
        [payload.peerId]: payload.hand,
      },
    }));
  };

  const handleActionAck = (payload: ActionAckPayload) => {
    const { localPeerId } = get();
    if (payload.recipientPeerId && payload.recipientPeerId !== localPeerId) {
      return;
    }

    set((state) => ({
      pendingActions: state.pendingActions.filter((request) => request.id !== payload.actionId),
      lastActionAck: payload,
    }));

    appendNotice({
      id: payload.id,
      level: payload.status === "accepted" ? "info" : "warning",
      message:
        payload.status === "accepted"
          ? "คำสั่งได้รับการยืนยันจากโฮสต์"
          : payload.reason ?? "ไม่สามารถดำเนินการคำสั่งได้",
      timestamp: payload.timestamp,
    });
  };

  const handleActionRequest = (payload: ActionRequestPayload) => {
    const { role, localPeerId } = get();
    if (role !== "host" || payload.actorPeerId === localPeerId) {
      return;
    }

    set((state) => ({
      incomingActionRequests: [...state.incomingActionRequests, payload],
    }));
  };

  const handleSystemNotice = (payload: SystemNoticePayload, message: WebRtcGameMessage) => {
    appendNotice({
      id: message.id,
      level: payload.level,
      message: payload.message,
      timestamp: message.timestamp,
    });
  };

  const bridgeMessages = () => {
    let lastIndex = useGameStoreWebRtc.getState().messages.length;

    const unsubscribe = useGameStoreWebRtc.subscribe((state) => {
      const nextMessages = state.messages;
      const currentLength = nextMessages.length;
      if (currentLength === lastIndex) return;

      for (let index = lastIndex; index < currentLength; index += 1) {
        const envelope = nextMessages[index];
        if (!envelope || handledMessageIds.has(envelope.id)) {
          continue;
        }
        handledMessageIds.add(envelope.id);

        switch (envelope.type) {
          case "STATE_SYNC":
            handleStateSync(envelope.payload as GameSnapshot, envelope);
            break;
          case "HAND_SYNC":
            handleHandSync(envelope.payload as HandSyncPayload);
            break;
          case "ACTION_ACK":
            handleActionAck(envelope.payload as ActionAckPayload);
            break;
          case "ACTION_REQUEST":
            handleActionRequest(envelope.payload as ActionRequestPayload);
            break;
          case "SYSTEM_NOTICE":
            handleSystemNotice(envelope.payload as SystemNoticePayload, envelope);
            break;
          default:
            break;
        }
      }

      lastIndex = currentLength;
    });

    unsubscribeMessageStream = unsubscribe;
  };

  return {
    ...initialState,
    initialize: ({ role, roomId, hostPeerId, initialSnapshot }) => {
      const { localPeerId } = useGameStoreWebRtc.getState();
      set({
        role,
        localPeerId,
        roomId: roomId ?? null,
        hostPeerId: hostPeerId ?? null,
        snapshot: initialSnapshot ?? null,
        isSynced: Boolean(initialSnapshot),
        error: null,
      });

      detachBridge();
      bridgeMessages();
    },
    cleanup: () => {
      detachBridge();
      reset();
    },
    sendActionRequest: (type, payload) => {
      const { localPeerId, role } = get();
      if (!localPeerId || role !== "guest") {
        return;
      }

      const action: ActionRequestPayload = {
        id: crypto.randomUUID(),
        action: type,
        actorPeerId: localPeerId,
        timestamp: Date.now(),
        payload,
      };

      set((state) => ({ pendingActions: [...state.pendingActions, action] }));
      sendBaseMessage({ type: "ACTION_REQUEST", payload: action });
    },
    requestStateSync: () => {
      const { localPeerId } = get();
      if (!localPeerId) return;

      const request: ActionRequestPayload<"REQUEST_SYNC"> = {
        id: crypto.randomUUID(),
        action: "REQUEST_SYNC",
        actorPeerId: localPeerId,
        timestamp: Date.now(),
      };

      sendBaseMessage({ type: "ACTION_REQUEST", payload: request });
    },
    hostBroadcastSnapshot: (snapshot, options) => {
      const { localPeerId, role } = get();
      if (role !== "host" || !localPeerId) {
        return;
      }

      sendBaseMessage({
        type: "STATE_SYNC",
        payload: snapshot,
      });

      if (options?.broadcastHands && options.hands) {
        Object.entries(options.hands).forEach(([peerId, hand]) => {
          sendBaseMessage({
            type: "HAND_SYNC",
            payload: { peerId, hand },
            targetPeerId: peerId,
          });
        });
      } else if (options?.targetPeerId && options.hands?.[options.targetPeerId]) {
        sendBaseMessage({
          type: "HAND_SYNC",
          payload: {
            peerId: options.targetPeerId,
            hand: options.hands[options.targetPeerId],
          },
          targetPeerId: options.targetPeerId,
        });
      }
    },
    hostSendHandSnapshot: (peerId, hand) => {
      const { role } = get();
      if (role !== "host") return;

      sendBaseMessage({ type: "HAND_SYNC", payload: { peerId, hand }, targetPeerId: peerId });
    },
    hostAcknowledgeAction: ({ actionId, status, reason, recipientPeerId }) => {
      const { role, localPeerId } = get();
      if (role !== "host" || !localPeerId) return;

      const ack: ActionAckPayload = {
        id: crypto.randomUUID(),
        actionId,
        status,
        responderPeerId: localPeerId,
        recipientPeerId,
        reason,
        timestamp: Date.now(),
      };

      sendBaseMessage({ type: "ACTION_ACK", payload: ack, targetPeerId: recipientPeerId });
    },
    hostConsumeNextActionRequest: (actionId) => {
      const { role } = get();
      if (role !== "host") return null;

      const requests = get().incomingActionRequests;
      if (requests.length === 0) {
        return null;
      }

      if (actionId) {
        const requestIndex = requests.findIndex((request) => request.id === actionId);
        if (requestIndex === -1) {
          return null;
        }

        const [target] = requests.slice(requestIndex, requestIndex + 1);
        set({
          incomingActionRequests: requests.filter((request) => request.id !== actionId),
        });
        return target ?? null;
      }

      const [head, ...rest] = requests;
      set({ incomingActionRequests: rest });
      return head ?? null;
    },
    clearNotice: (id) => {
      set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) }));
    },
    clearError: () => set({ error: null }),
  };
});
