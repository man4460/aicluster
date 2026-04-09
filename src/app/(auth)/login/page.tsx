import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/auth/google-oauth";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | MAWELL Buffet",
};

/** อ่าน GOOGLE_* ทุก request — กันหน้าโหลดแบบ static แล้วไม่เห็นปุ่ม Google หลังใส่ .env */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : "/dashboard";
  const googleOAuthEnabled = isGoogleOAuthConfigured();
  return (
    <LoginForm redirectTo={next} initialErrorKey={q.error} googleOAuthEnabled={googleOAuthEnabled} />
  );
}
