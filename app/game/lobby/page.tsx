import { GameLobbyView } from "@/src/presentation/components/game/GameLobbyView";
import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ล็อบบี้เกม | Dummy Legends",
  description: "เลือกห้องเกมไพ่ดัมมี่ที่ต้องการเข้าร่วม หรือสร้างห้องใหม่",
};

/**
 * Game Lobby Page
 */
export default function GameLobbyPage() {
  return (
    <MainLayout>
      <GameLobbyView />
    </MainLayout>
  );
}
