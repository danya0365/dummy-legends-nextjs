import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";
import ClientGamePlayView from "./ClientGamePlayView";

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
  const { sessionId } = await params;

  return (
    <MainLayout>
      <ClientGamePlayView sessionId={sessionId} />
    </MainLayout>
  );
}
