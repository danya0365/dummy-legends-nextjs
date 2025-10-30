import { CreateRoomView } from "@/src/presentation/components/game/CreateRoomView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สร้างห้องเกม | Dummy Legends",
  description: "สร้างห้องเกมไพ่ดัมมี่และเชิญเพื่อนมาเล่นด้วยกัน",
};

/**
 * Create Room Page
 */
export default function CreateRoomPage() {
  return <CreateRoomView />;
}
