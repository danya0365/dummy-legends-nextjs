"use client";

import { useCallback, useEffect } from "react";
import type { GameCard } from "@/src/domain/types/gameplay.types";
import {
  ActionKind,
  type ActionPayloadMap,
  type GameSnapshot,
  type ActionRequestPayload,
  type ActionAckPayload,
  useGamePlayWebRtcStore,
} from "@/src/stores/gamePlayWebRtcStore";
import { useGameStoreWebRtc, type ParticipantSummary } from "@/src/stores/gameStoreWebRtc";

interface GuestGamePlayController {
  roomId: string | null;
  joinCode: string | null;
  role: "host" | "guest" | null;
  isHost: boolean;
  isSynced: boolean;
  snapshot: GameSnapshot | null;
  myHand: GameCard[];
  notices: Array<{ id: string; level: "info" | "warning" | "error"; message: string; timestamp: number }>;
  participants: ParticipantSummary[];
  pendingActions: ActionRequestPayload[];
  incomingActionRequests: ActionRequestPayload[];
  lastActionAck: ActionAckPayload | null;
  sendGuestAction: <K extends ActionKind>(action: K, payload?: ActionPayloadMap[K]) => void;
  requestSync: () => void;
  clearNotice: (id: string) => void;
  hostBroadcastSampleState: () => void;
  hostAcknowledgeAction: (params: { actionId: string; status: "accepted" | "rejected"; reason?: string }) => void;
  localPeerId: string | null;
}

const createSampleHand = (peerId: string): GameCard[] => {
  const suits = ["hearts", "diamonds", "clubs", "spades"] as const;
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

  const cards: GameCard[] = [];
  for (let index = 0; index < 10; index += 1) {
    const suit = suits[index % suits.length];
    const rank = ranks[(index * 2) % ranks.length];
    const id = `${peerId}-${rank}-${suit}-${index}`;
    cards.push({
      id,
      suit,
      rank,
      value: index + 1,
      location: "hand",
      ownerId: peerId,
      position: index,
    });
  }

  return cards.map((card, position) => ({ ...card, position, meldId: null, isHead: position === 0, meldCardIndex: null }));
};

const buildSampleSnapshot = (params: {
  roomId: string;
  joinCode: string | null;
  hostPeerId: string;
  participants: ParticipantSummary[];
  localPeerId: string;
  existing?: GameSnapshot | null;
}): { snapshot: GameSnapshot; hands: Record<string, GameCard[]> } => {
  const { roomId, joinCode, hostPeerId, participants, localPeerId, existing } = params;
  const now = Date.now();

  const hands: Record<string, GameCard[]> = {};

  const players = participants.map((participant) => {
    const displayName = participant.displayName || `ผู้เล่น ${participant.peerId.slice(0, 4)}`;
    const generatedHand = createSampleHand(participant.peerId);
    const isOwner = participant.peerId === localPeerId || participant.peerId === hostPeerId;
    hands[participant.peerId] = isOwner ? generatedHand : [];
    return {
      peerId: participant.peerId,
      displayName,
      handCount: hands[participant.peerId]?.length ?? 0,
      isHost: participant.peerId === hostPeerId,
      isReady: participant.connected,
      lastUpdated: now,
    };
  });

  if (!hands[hostPeerId]) {
    hands[hostPeerId] = createSampleHand(hostPeerId);
  }

  const snapshot: GameSnapshot = {
    room: {
      roomId,
      joinCode: joinCode ?? roomId,
      hostPeerId,
      createdAt: existing?.room.createdAt ?? now,
    },
    phase: existing?.phase ?? "turn",
    turn: existing?.turn ?? {
      currentPeerId: hostPeerId,
      startedAt: now,
      remainingMs: 45_000,
    },
    players,
    hands: Object.fromEntries(players.map((player) => [player.peerId, player.handCount])),
    tableMelds: existing?.tableMelds ?? [],
    discardStack: existing?.discardStack ?? {
      topCard: hands[hostPeerId][0] ?? null,
      entries: hands[hostPeerId].slice(0, 1).map((card) => ({ card, byPeerId: hostPeerId, at: now })),
    },
    deckCount: existing?.deckCount ?? 42,
    lastAction: existing?.lastAction ?? {
      id: `${now}`,
      action: "DRAW_FROM_DECK",
      actorPeerId: hostPeerId,
      timestamp: now,
      payload: undefined,
    },
    scores: existing?.scores ?? {},
    result: existing?.result,
  };

  return { snapshot, hands };
};

export function useGuestGamePlayController(roomIdParam: string | null): GuestGamePlayController {
  const {
    role,
    initialize,
    cleanup,
    requestStateSync,
    sendActionRequest,
    hostBroadcastSnapshot,
    hostSendHandSnapshot,
    hostAcknowledgeAction,
    hostConsumeNextActionRequest,
    clearNotice,
    snapshot,
    myHand,
    notices,
    pendingActions,
    incomingActionRequests,
    lastActionAck,
    isSynced,
  } = useGamePlayWebRtcStore();

  const {
    roomId: storeRoomId,
    joinCode,
    localPeerId,
    isHost,
    gameStateSnapshot,
    participants,
  } = useGameStoreWebRtc();

  const resolvedRoomId = roomIdParam ?? storeRoomId ?? snapshot?.room.roomId ?? null;

  useEffect(() => {
    if (!localPeerId || !resolvedRoomId) {
      return;
    }

    const hostPeerId = isHost ? localPeerId : snapshot?.room.hostPeerId ?? participants.find((participant) => participant.peerId !== localPeerId)?.peerId ?? null;

    initialize({
      role: isHost ? "host" : "guest",
      roomId: resolvedRoomId,
      hostPeerId,
      initialSnapshot: (gameStateSnapshot ?? null) as GameSnapshot | null,
    });

    return () => {
      cleanup();
    };
  }, [cleanup, gameStateSnapshot, initialize, isHost, localPeerId, participants, resolvedRoomId, snapshot?.room.hostPeerId]);

  useEffect(() => {
    if (!isHost && resolvedRoomId && !snapshot && isSynced === false) {
      requestStateSync();
    }
  }, [isHost, isSynced, requestStateSync, resolvedRoomId, snapshot]);

  const sendGuestAction = useCallback(
    <K extends ActionKind>(action: K, payload?: ActionPayloadMap[K]) => {
      if (!isHost) {
        sendActionRequest(action, payload);
      }
    },
    [isHost, sendActionRequest]
  );

  const hostBroadcastSampleState = useCallback(() => {
    if (!isHost || !localPeerId || !resolvedRoomId) {
      return;
    }

    const { snapshot: nextSnapshot, hands } = buildSampleSnapshot({
      roomId: resolvedRoomId,
      joinCode,
      hostPeerId: localPeerId,
      participants,
      localPeerId,
      existing: snapshot,
    });

    hostBroadcastSnapshot(nextSnapshot, { broadcastHands: true, hands });
    hostSendHandSnapshot(localPeerId, hands[localPeerId] ?? []);
  }, [hostBroadcastSnapshot, hostSendHandSnapshot, isHost, joinCode, localPeerId, participants, resolvedRoomId, snapshot]);

  const hostHandleAction = useCallback(
    ({ actionId, status, reason }: { actionId: string; status: "accepted" | "rejected"; reason?: string }) => {
      if (!isHost) return;

      const request = hostConsumeNextActionRequest(actionId);
      if (!request) {
        return;
      }

      hostAcknowledgeAction({
        actionId: request.id,
        status,
        reason,
        recipientPeerId: request.actorPeerId,
      });
    },
    [hostAcknowledgeAction, hostConsumeNextActionRequest, isHost]
  );

  return {
    roomId: resolvedRoomId,
    joinCode,
    role,
    isHost,
    isSynced,
    snapshot,
    myHand,
    notices,
    participants,
    pendingActions,
    incomingActionRequests,
    lastActionAck,
    sendGuestAction,
    requestSync: requestStateSync,
    clearNotice,
    hostBroadcastSampleState,
    hostAcknowledgeAction: hostHandleAction,
    localPeerId,
  };
}
