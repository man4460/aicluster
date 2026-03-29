import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | MAWELL Buffet",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = q.next?.startsWith("/") ? q.next : "/dashboard";
  return <LoginForm redirectTo={next} />;
}
