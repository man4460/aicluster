import type { Metadata } from "next";
import { LoginFormClient } from "./LoginFormClient";
import { getGoogleOAuthClientId } from "@/lib/auth/google-oauth";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | MAWELL Buffet",
};

/** อ่าน GOOGLE_* ทุก request — กันหน้าโหลดแบบ static แล้วไม่เห็นปุ่ม Google หลังใส่ .env */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = q.next?.startsWith("/") && !q.next.startsWith("//") ? q.next : "/dashboard";
  /** แสดงปุ่มเมื่อมี Client ID — การแลกโค้ดยังต้องมี GOOGLE_CLIENT_SECRET (API จะ redirect กลับพร้อมข้อความถ้ายังไม่ครบ) */
  const googleOAuthEnabled = Boolean(getGoogleOAuthClientId());
  return (
    <LoginFormClient
      redirectTo={next}
      initialErrorKey={q.error}
      googleOAuthEnabled={googleOAuthEnabled}
    />
  );
}
