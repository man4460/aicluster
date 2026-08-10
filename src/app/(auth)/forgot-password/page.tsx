import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน | MAWELL PLATFORM",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
