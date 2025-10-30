import { TournamentListView } from "@/src/presentation/components/tournament/TournamentListView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ทัวร์นาเมนต์ | Dummy Legends",
  description: "แข่งขันกับผู้เล่นชั้นนำและชิงรางวัลมากมาย เข้าร่วมทัวร์นาเมนต์ไพ่ดัมมี่",
};

/**
 * Tournament List Page
 */
export default function TournamentsPage() {
  return <TournamentListView />;
}
