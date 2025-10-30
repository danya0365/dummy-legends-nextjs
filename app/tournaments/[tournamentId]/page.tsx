import { TournamentDetailView } from "@/src/presentation/components/tournament/TournamentDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายละเอียดทัวร์นาเมนต์ | Dummy Legends",
  description: "ดูรายละเอียดและลงทะเบียนเข้าร่วมทัวร์นาเมนต์ไพ่ดัมมี่",
};

interface TournamentDetailPageProps {
  params: Promise<{ tournamentId: string }>;
}

/**
 * Tournament Detail Page
 */
export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const resolvedParams = await params;

  return <TournamentDetailView tournamentId={resolvedParams.tournamentId} />;
}
