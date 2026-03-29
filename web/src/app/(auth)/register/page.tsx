import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | MAWELL Buffet",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
