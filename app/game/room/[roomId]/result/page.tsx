import { GameRoomResultPageView } from "@/src/presentation/components/game/GameRoomResultPageView";
import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สรุปผลเกม | Dummy Legends",
  description: "ดูสรุปผลคะแนนและรายละเอียดหลังจบเกมไพ่ดัมมี่",
};

interface GameRoomResultPageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function GameRoomResultPage({
  params,
  searchParams,
}: GameRoomResultPageProps) {
  const [{ roomId }, search] = await Promise.all([params, searchParams]);
  const sessionId = search?.sessionId;

  return (
    <MainLayout>
      <GameRoomResultPageView roomId={roomId} sessionId={sessionId} />
    </MainLayout>
  );
}
