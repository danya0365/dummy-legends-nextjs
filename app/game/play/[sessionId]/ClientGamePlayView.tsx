"use client";

import { GamePlayView } from "@/src/presentation/components/game/GamePlayView";
import { useEffect, useState } from "react";

export default function ClientGamePlayView({
  sessionId,
}: {
  sessionId: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <GamePlayView sessionId={sessionId} />;
}
