"use client";

import { create } from "zustand";

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const DATA_CHANNEL_LABEL = "dummy-legends-data";
const SIGNALING_BROADCAST_CHANNEL = "dummy-legends-webrtc";
const MAX_MESSAGE_HISTORY = 100;

type ConnectionPhase =
  | "idle"
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type SignalingMessageType =
  | "HOST_READY"
  | "JOIN_REQUEST"
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "LEAVE";

interface SignalingEnvelope<T = unknown> {
  type: SignalingMessageType;
  roomId: string;
  senderId: string;
  targetId?: string;
  payload?: T;
  timestamp: number;
}

interface SignalingClient {
  connect(options: {
    roomId: string;
    peerId: string;
    onMessage: (message: SignalingEnvelope) => void;
  }): Promise<void>;
  send(message: SignalingEnvelope): void;
  disconnect(): void;
}

class BroadcastChannelSignalingClient implements SignalingClient {
  private channel: BroadcastChannel | null = null;
  private roomId: string | null = null;
  private peerId: string | null = null;
  private handler: ((message: SignalingEnvelope) => void) | null = null;

  async connect(options: {
    roomId: string;
    peerId: string;
    onMessage: (message: SignalingEnvelope) => void;
  }): Promise<void> {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      throw new Error("BroadcastChannel is not available in this environment");
    }

    this.roomId = options.roomId;
    this.peerId = options.peerId;
    this.handler = options.onMessage;

    this.channel = new BroadcastChannel(SIGNALING_BROADCAST_CHANNEL);
    this.channel.onmessage = (event) => {
      const envelope = event.data as SignalingEnvelope | undefined;
      if (!envelope || envelope.roomId !== this.roomId) {
        return;
      }
      if (envelope.senderId === this.peerId) {
        return; // ignore self messages
      }
      this.handler?.(envelope);
    };
  }

  send(message: SignalingEnvelope): void {
    this.channel?.postMessage(message);
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.onmessage = null;
      this.channel.close();
      this.channel = null;
    }
    this.roomId = null;
    this.peerId = null;
    this.handler = null;
  }
}

class WebSocketSignalingClient implements SignalingClient {
  private socket: WebSocket | null = null;
  private onMessage: ((message: SignalingEnvelope) => void) | null = null;

  constructor(private readonly url: string) {}

  async connect(options: {
    roomId: string;
    peerId: string;
    onMessage: (message: SignalingEnvelope) => void;
  }): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("WebSocket is not available during SSR");
    }

    await new Promise<void>((resolve, reject) => {
      try {
        const params = new URLSearchParams({
          roomId: options.roomId,
          peerId: options.peerId,
        });
        const socket = new WebSocket(`${this.url}?${params.toString()}`);

        socket.onopen = () => {
          this.socket = socket;
          this.onMessage = options.onMessage;
          resolve();
        };

        socket.onerror = (event) => {
          reject(event);
        };

        socket.onmessage = (event) => {
          try {
            const envelope = JSON.parse(event.data) as SignalingEnvelope | undefined;
            if (!envelope) return;
            this.onMessage?.(envelope);
          } catch (error) {
            console.warn("Failed to parse signaling message", error);
          }
        };

        socket.onclose = () => {
          this.socket = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: SignalingEnvelope): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.onMessage = null;
  }
}

const createDefaultSignalingClient = (): SignalingClient => {
  if (typeof window === "undefined") {
    throw new Error("Signaling client cannot be created during SSR");
  }

  const url = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL;
  if (url) {
    return new WebSocketSignalingClient(url);
  }

  return new BroadcastChannelSignalingClient();
};

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 10)}`;
};

const generateJoinCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

type WebRtcGameMessageType =
  | "SYSTEM"
  | "HELLO"
  | "STATE_SYNC"
  | "ACTION"
  | "CHAT"
  | (string & {});

export interface WebRtcGameMessage<T = unknown> {
  id: string;
  type: WebRtcGameMessageType;
  payload: T;
  senderId: string;
  timestamp: number;
}

interface ParticipantSummary {
  peerId: string;
  displayName: string;
  connected: boolean;
  isLocal: boolean;
  lastUpdated: number;
}

interface PeerConnectionEntry {
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connectionState: RTCPeerConnectionState;
}

interface WebRtcGameStore {
  localPeerId: string;
  displayName: string;
  roomId: string | null;
  joinCode: string | null;
  isHost: boolean;
  signalingReady: boolean;
  connectionState: ConnectionPhase;
  participants: ParticipantSummary[];
  peers: Record<string, PeerConnectionEntry>;
  messages: WebRtcGameMessage[];
  lastMessage: WebRtcGameMessage | null;
  gameStateSnapshot: unknown;
  error: string | null;

  createRoom: (options?: {
    roomId?: string;
    joinCode?: string;
    displayName?: string;
  }) => Promise<{ roomId: string; joinCode: string }>;
  joinRoom: (
    joinCode: string,
    options?: { displayName?: string }
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: <T = unknown>(message: {
    type: WebRtcGameMessageType;
    payload: T;
    targetPeerId?: string;
  }) => void;
  broadcastState: (state: unknown) => void;
  updateDisplayName: (displayName: string) => void;
  resetError: () => void;
}

export const useGameStoreWebRtc = create<WebRtcGameStore>((set, get) => {
  const localPeerId = randomId();
  let signalingClient: SignalingClient | null = null;

  const upsertParticipant = (peerId: string, updates: Partial<ParticipantSummary>) => {
    set((state) => {
      const existing = state.participants.find((participant) => participant.peerId === peerId);
      const now = Date.now();
      if (existing) {
        return {
          participants: state.participants.map((participant) =>
            participant.peerId === peerId
              ? { ...participant, ...updates, lastUpdated: now }
              : participant
          ),
        };
      }

      const newEntry: ParticipantSummary = {
        peerId,
        displayName: updates.displayName ?? `Guest-${peerId.slice(0, 4)}`,
        connected: updates.connected ?? false,
        isLocal: updates.isLocal ?? false,
        lastUpdated: now,
      };

      return {
        participants: [...state.participants, newEntry],
      };
    });
  };

  const pushMessage = (message: WebRtcGameMessage) => {
    set((state) => {
      const messages = [...state.messages, message];
      if (messages.length > MAX_MESSAGE_HISTORY) {
        messages.splice(0, messages.length - MAX_MESSAGE_HISTORY);
      }
      return {
        messages,
        lastMessage: message,
      };
    });
  };

  const handleIncomingGameMessage = (peerId: string, rawData: string) => {
    try {
      const message = JSON.parse(rawData) as WebRtcGameMessage | undefined;
      if (!message) {
        return;
      }

      if (message.type === "HELLO") {
        const displayName =
          typeof message.payload === "object" && message.payload !== null
            ? (message.payload as { displayName?: string }).displayName
            : undefined;
        if (displayName) {
          upsertParticipant(peerId, { displayName, connected: true });
        }
      }

      if (message.type === "STATE_SYNC") {
        set({ gameStateSnapshot: message.payload });
      }

      pushMessage(message);
    } catch (error) {
      console.warn("Failed to process incoming data channel message", error);
    }
  };

  const updatePeerEntry = (
    peerId: string,
    updates: Partial<Omit<PeerConnectionEntry, "peerId">>
  ) => {
    set((state) => {
      const existing = state.peers[peerId];
      if (!existing) {
        return state;
      }
      return {
        peers: {
          ...state.peers,
          [peerId]: {
            ...existing,
            ...updates,
          },
        },
      };
    });
  };

  const removePeer = (peerId: string) => {
    set((state) => {
      const entry = state.peers[peerId];
      if (entry) {
        entry.connection.onicecandidate = null;
        entry.connection.onconnectionstatechange = null;
        entry.connection.ondatachannel = null;
        entry.connection.close();
        entry.dataChannel?.close();
      }
      const nextPeers = { ...state.peers };
      delete nextPeers[peerId];
      return {
        peers: nextPeers,
        participants: state.participants
          .map((participant) =>
            participant.peerId === peerId
              ? { ...participant, connected: false, lastUpdated: Date.now() }
              : participant
          ),
      };
    });
  };

  const sendHelloToPeer = (peerId: string) => {
    const { displayName } = get();
    const message: WebRtcGameMessage<{ displayName: string }> = {
      id: randomId(),
      type: "HELLO",
      payload: { displayName },
      senderId: localPeerId,
      timestamp: Date.now(),
    };

    set((state) => {
      const peer = state.peers[peerId];
      if (peer?.dataChannel?.readyState === "open") {
        peer.dataChannel.send(JSON.stringify(message));
      }
      return state;
    });
  };

  const configureDataChannel = (peerId: string, channel: RTCDataChannel) => {
    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      updatePeerEntry(peerId, { dataChannel: channel });
      upsertParticipant(peerId, { connected: true });
      set({ connectionState: "connected" });
      sendHelloToPeer(peerId);
    };

    channel.onclose = () => {
      updatePeerEntry(peerId, { dataChannel: null });
      upsertParticipant(peerId, { connected: false });
      if (Object.values(get().peers).every((peer) => peer.dataChannel?.readyState !== "open")) {
        set({ connectionState: "disconnected" });
      }
    };

    channel.onerror = (event) => {
      console.error("Data channel error", event);
      set({ error: "เกิดข้อผิดพลาดในช่องทางการสื่อสาร" });
    };

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        handleIncomingGameMessage(peerId, event.data);
      }
    };
  };

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    const { roomId } = get();
    if (!roomId) {
      throw new Error("Room ID is not set");
    }

    const connection = new RTCPeerConnection({ iceServers: DEFAULT_STUN_SERVERS });

    connection.onicecandidate = (event) => {
      if (!event.candidate || !signalingClient) {
        return;
      }

      const envelope: SignalingEnvelope<RTCIceCandidateInit> = {
        type: "ICE_CANDIDATE",
        roomId,
        senderId: localPeerId,
        targetId: peerId,
        payload: event.candidate.toJSON(),
        timestamp: Date.now(),
      };
      signalingClient.send(envelope);
    };

    connection.onconnectionstatechange = () => {
      updatePeerEntry(peerId, { connectionState: connection.connectionState });
    };

    connection.oniceconnectionstatechange = () => {
      if (
        connection.iceConnectionState === "failed" ||
        connection.iceConnectionState === "disconnected" ||
        connection.iceConnectionState === "closed"
      ) {
        removePeer(peerId);
      }
    };

    connection.ondatachannel = (event) => {
      configureDataChannel(peerId, event.channel);
    };

    const entry: PeerConnectionEntry = {
      peerId,
      connection,
      dataChannel: null,
      connectionState: connection.connectionState,
    };

    set((state) => ({
      peers: {
        ...state.peers,
        [peerId]: entry,
      },
    }));

    if (isInitiator) {
      const channel = connection.createDataChannel(DATA_CHANNEL_LABEL);
      configureDataChannel(peerId, channel);
    }

    return connection;
  };

  const ensureSignaling = async (roomId: string) => {
    if (signalingClient) {
      return signalingClient;
    }

    const client = createDefaultSignalingClient();
    await client.connect({
      roomId,
      peerId: localPeerId,
      onMessage: (message) => {
        void handleSignalingMessage(message);
      },
    });
    signalingClient = client;
    set({ signalingReady: true });
    return client;
  };

  const handleSignalingMessage = async (message: SignalingEnvelope) => {
    const state = get();
    if (message.roomId !== state.roomId || message.senderId === localPeerId) {
      return;
    }

    switch (message.type) {
      case "HOST_READY": {
        if (!state.isHost) {
          set({ connectionState: "connecting" });
        }
        break;
      }
      case "JOIN_REQUEST": {
        if (!state.isHost || !state.roomId) {
          return;
        }
        const peerId = message.senderId;
        upsertParticipant(peerId, {
          displayName:
            typeof message.payload === "object" && message.payload !== null
              ? (message.payload as { displayName?: string }).displayName
              : undefined,
          connected: false,
        });
        const connection = createPeerConnection(peerId, true);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        signalingClient?.send({
          type: "OFFER",
          roomId: state.roomId,
          senderId: localPeerId,
          targetId: peerId,
          payload: offer,
          timestamp: Date.now(),
        });
        break;
      }
      case "OFFER": {
        if (message.targetId !== localPeerId || !state.roomId) {
          return;
        }
        const connection = createPeerConnection(message.senderId, false);
        const description = new RTCSessionDescription(message.payload as RTCSessionDescriptionInit);
        await connection.setRemoteDescription(description);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        signalingClient?.send({
          type: "ANSWER",
          roomId: state.roomId,
          senderId: localPeerId,
          targetId: message.senderId,
          payload: answer,
          timestamp: Date.now(),
        });
        break;
      }
      case "ANSWER": {
        if (!state.isHost || message.targetId !== localPeerId) {
          return;
        }
        const connection = state.peers[message.senderId]?.connection;
        if (!connection) {
          return;
        }
        const description = new RTCSessionDescription(message.payload as RTCSessionDescriptionInit);
        await connection.setRemoteDescription(description);
        break;
      }
      case "ICE_CANDIDATE": {
        if (message.targetId !== localPeerId) {
          return;
        }
        const connection = state.peers[message.senderId]?.connection;
        if (!connection) {
          return;
        }
        try {
          const candidate = new RTCIceCandidate(message.payload as RTCIceCandidateInit);
          await connection.addIceCandidate(candidate);
        } catch (error) {
          console.warn("Failed to add ICE candidate", error);
        }
        break;
      }
      case "LEAVE": {
        removePeer(message.senderId);
        break;
      }
      default:
        break;
    }
  };

  const cleanup = () => {
    Object.keys(get().peers).forEach((peerId) => {
      removePeer(peerId);
    });
    signalingClient?.disconnect();
    signalingClient = null;
    set({ signalingReady: false });
  };

  return {
    localPeerId,
    displayName: `Guest-${localPeerId.slice(0, 4)}`,
    roomId: null,
    joinCode: null,
    isHost: false,
    signalingReady: false,
    connectionState: "idle",
    participants: [],
    peers: {},
    messages: [],
    lastMessage: null,
    gameStateSnapshot: null,
    error: null,

    createRoom: async (options) => {
      const joinCode = (options?.joinCode ?? generateJoinCode()).toUpperCase();
      const roomId = options?.roomId ?? joinCode;
      const displayName = options?.displayName ?? get().displayName;

      set({
        roomId,
        joinCode,
        isHost: true,
        connectionState: "waiting",
        participants: [
          {
            peerId: localPeerId,
            displayName,
            connected: true,
            isLocal: true,
            lastUpdated: Date.now(),
          },
        ],
        displayName,
        messages: [],
        lastMessage: null,
        error: null,
      });

      await ensureSignaling(roomId);
      signalingClient?.send({
        type: "HOST_READY",
        roomId,
        senderId: localPeerId,
        timestamp: Date.now(),
      });

      return { roomId, joinCode };
    },

    joinRoom: async (joinCode, options) => {
      if (!joinCode) {
        throw new Error("ต้องกรอกรหัสห้องเพื่อเข้าร่วม");
      }
      const normalizedCode = joinCode.trim().toUpperCase();
      const roomId = normalizedCode;
      const displayName = options?.displayName ?? get().displayName;

      set({
        roomId,
        joinCode: normalizedCode,
        isHost: false,
        connectionState: "connecting",
        participants: [
          {
            peerId: localPeerId,
            displayName,
            connected: true,
            isLocal: true,
            lastUpdated: Date.now(),
          },
        ],
        displayName,
        messages: [],
        lastMessage: null,
        error: null,
      });

      await ensureSignaling(roomId);

      signalingClient?.send({
        type: "JOIN_REQUEST",
        roomId,
        senderId: localPeerId,
        payload: { displayName },
        timestamp: Date.now(),
      });
    },

    leaveRoom: async () => {
      const state = get();
      if (state.roomId && signalingClient) {
        signalingClient.send({
          type: "LEAVE",
          roomId: state.roomId,
          senderId: localPeerId,
          timestamp: Date.now(),
        });
      }

      cleanup();

      set({
        roomId: null,
        joinCode: null,
        isHost: false,
        connectionState: "idle",
        participants: [],
        peers: {},
        messages: [],
        lastMessage: null,
        gameStateSnapshot: null,
        error: null,
      });
    },

    sendMessage: (input) => {
      const { peers } = get();
      const message: WebRtcGameMessage = {
        id: randomId(),
        type: input.type,
        payload: input.payload,
        senderId: localPeerId,
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(message);

      if (input.targetPeerId) {
        const peer = peers[input.targetPeerId];
        if (peer?.dataChannel?.readyState === "open") {
          peer.dataChannel.send(serialized);
        }
      } else {
        Object.values(peers).forEach((peer) => {
          if (peer.dataChannel?.readyState === "open") {
            peer.dataChannel.send(serialized);
          }
        });
      }

      pushMessage(message);

      if (message.type === "STATE_SYNC") {
        set({ gameStateSnapshot: message.payload });
      }
    },

    broadcastState: (stateSnapshot) => {
      get().sendMessage({ type: "STATE_SYNC", payload: stateSnapshot });
    },

    updateDisplayName: (displayName) => {
      upsertParticipant(localPeerId, { displayName, isLocal: true, connected: true });
      set({ displayName });
      Object.keys(get().peers).forEach((peerId) => {
        sendHelloToPeer(peerId);
      });
    },

    resetError: () => {
      set({ error: null });
    },
  };
});
