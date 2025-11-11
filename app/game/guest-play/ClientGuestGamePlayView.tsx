"use client";

import { useEffect, useState } from "react";
import { GuestGamePlayView } from "@/src/presentation/components/game/guest-play/GuestGamePlayView";

interface ClientGuestGamePlayViewProps {
  roomId?: string | null;
}

export default function ClientGuestGamePlayView({ roomId }: ClientGuestGamePlayViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <GuestGamePlayView roomId={roomId ?? null} />;
}
