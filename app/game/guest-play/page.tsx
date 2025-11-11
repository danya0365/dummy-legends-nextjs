import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";
import ClientGuestGamePlayView from "./ClientGuestGamePlayView";

export const metadata: Metadata = {
  title: "เล่นผ่าน WebRTC | Dummy Legends",
  description:
    "หน้าจอการเล่นสำหรับโหมด WebRTC แยกจาก Supabase เชื่อมต่อระหว่าง Host และ Guest แบบ P2P",
};

export default function GuestPlayPage() {
  return (
    <MainLayout>
      <ClientGuestGamePlayView />
    </MainLayout>
  );
}
