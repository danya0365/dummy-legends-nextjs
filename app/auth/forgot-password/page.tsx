import { ForgotPasswordView } from "@/src/presentation/components/auth/ForgotPasswordView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน | Dummy Legends",
  description: "รีเซ็ตรหัสผ่านสำหรับบัญชี Dummy Legends ของคุณ",
};

/**
 * Forgot Password Page
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
