"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { GameResultSummaryView } from "@/src/presentation/components/game/GameResultSummaryView";

interface GameRoomResultPageViewProps {
  roomId: string;
  sessionId?: string;
}

export function GameRoomResultPageView({
  roomId,
  sessionId,
}: GameRoomResultPageViewProps) {
  const router = useRouter();

  const handleBackToRoom = useCallback(() => {
    router.push(`/game/room/${roomId}`);
  }, [router, roomId]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-12">
      <GameResultSummaryView
        roomId={roomId}
        sessionId={sessionId}
        onClose={handleBackToRoom}
      />
    </div>
  );
}
