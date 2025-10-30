import { MainLayout } from "@/src/presentation/components/layout";
import { LeaderboardView } from "@/src/presentation/components/leaderboard/LeaderboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลีดเดอร์บอร์ด | Dummy Legends",
  description: "อันดับผู้เล่นชั้นนำและสถิติต่างๆ ของเกมไพ่ดัมมี่",
};

/**
 * Leaderboard Page
 */
export default function LeaderboardPage() {
  return (
    <MainLayout>
      <LeaderboardView />
    </MainLayout>
  );
}
