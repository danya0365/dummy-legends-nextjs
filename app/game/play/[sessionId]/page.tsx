import { GamePlayView } from "@/src/presentation/components/game/GamePlayView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "กำลังเล่นเกม | Dummy Legends",
  description: "เล่นเกมไพ่ดัมมี่แบบ realtime กับผู้เล่นคนอื่น",
};

interface GamePlayPageProps {
  params: Promise<{ sessionId: string }>;
}

/**
 * Game Play Page
 * Main gameplay screen
 */
export default async function GamePlayPage({ params }: GamePlayPageProps) {
  const resolvedParams = await params;

  return <GamePlayView sessionId={resolvedParams.sessionId} />;
}
