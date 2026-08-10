import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | MAWELL PLATFORM",
};

type Props = { searchParams: Promise<{ next?: string }> };

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default async function RegisterPage({ searchParams }: Props) {
  const q = await searchParams;
  const redirectTo = safeNextPath(q.next);

  return (
    <Suspense fallback={null}>
      <RegisterForm redirectTo={redirectTo} />
    </Suspense>
  );
}
