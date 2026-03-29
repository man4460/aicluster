import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "รีเซ็ตรหัสผ่าน | MAWELL Buffet",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
