import { LoginView } from "@/src/presentation/components/auth/LoginView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Dummy Legends",
  description: "เข้าสู่ระบบ Dummy Legends เพื่อเริ่มเล่นเกมไพ่ดัมมี่ออนไลน์",
};

/**
 * Login Page
 */
export default function LoginPage() {
  return <LoginView />;
}
