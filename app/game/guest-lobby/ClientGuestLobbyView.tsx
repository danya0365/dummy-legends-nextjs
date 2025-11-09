"use client";

import { GuestLobbyView } from "@/src/presentation/components/game/guest-lobby/GuestLobbyView";
import { useEffect, useState } from "react";

export default function ClientGuestLobbyView() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <GuestLobbyView />;
}
