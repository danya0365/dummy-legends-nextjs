import { RegisterView } from "@/src/presentation/components/auth/RegisterView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | Dummy Legends",
  description: "สร้างบัญชี Dummy Legends เพื่อเริ่มเล่นเกมไพ่ดัมมี่ออนไลน์",
};

/**
 * Register Page
 */
export default function RegisterPage() {
  return <RegisterView />;
}
