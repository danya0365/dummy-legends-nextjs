import { GameRoomView } from "@/src/presentation/components/game/GameRoomView";
import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ห้องเกม | Dummy Legends",
  description: "ห้องรอเล่นเกมไพ่ดัมมี่ รอผู้เล่นพร้อมก่อนเริ่มเกม",
};

interface GameRoomPageProps {
  params: Promise<{ roomId: string }>;
}

/**
 * Game Room Page (Waiting Room)
 */
export default async function GameRoomPage({ params }: GameRoomPageProps) {
  const resolvedParams = await params;

  return (
    <MainLayout>
      <GameRoomView roomId={resolvedParams.roomId} />
    </MainLayout>
  );
}
