import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";
import ClientGuestLobbyView from "./ClientGuestLobbyView";

export const metadata: Metadata = {
  title: "ล็อบบี้ Guest | Dummy Legends",
  description:
    "เล่น Dummy Legends แบบ Guest ผ่าน WebRTC สร้างห้อง แชร์รหัส และเล่นกับเพื่อนได้ทันทีโดยไม่ต้องสมัครสมาชิก",
};

export default function GuestLobbyPage() {
  return (
    <MainLayout>
      <ClientGuestLobbyView />
    </MainLayout>
  );
}
