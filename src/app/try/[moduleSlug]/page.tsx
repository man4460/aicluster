import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { isDemoAccountConfiguredForEntry } from "@/lib/auth/demo-account";
import { moduleTryDashboardHref } from "@/lib/modules/try-link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ moduleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleSlug } = await params;
  const slug = decodeURIComponent(moduleSlug).trim();
  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { title: true },
  });
  return {
    title: mod ? `ทดลอง ${mod.title} | MAWELL` : "ทดลองใช้งาน | MAWELL",
  };
}

/**
 * ลิงก์/QR สาธารณะต่อโมดูล — redirect ไป Route Handler ที่ตั้งคุกกี้บัญชีทดลอง
 * (ห้าม set cookies ใน Server Component)
 */
export default async function ModuleTryPage({ params }: Props) {
  const { moduleSlug } = await params;
  const slug = decodeURIComponent(moduleSlug).trim();
  if (!slug) notFound();

  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { slug: true, title: true },
  });
  if (!mod) notFound();

  const dashboardHref = moduleTryDashboardHref(mod.slug);
  const loginHref = `/login?next=${encodeURIComponent(dashboardHref)}`;
  const registerHref = `/register?next=${encodeURIComponent(dashboardHref)}`;

  if (isDemoAccountConfiguredForEntry()) {
    redirect(`/api/auth/demo/enter?next=${encodeURIComponent(dashboardHref)}`);
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-100/50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#5b61ff]">
          ทดลองใช้งาน
        </p>
        <h1 className="mt-2 text-center text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
          {mod.title}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#5f5a8a]">
          บัญชีทดลองยังไม่เปิดบนเซิร์ฟเวอร์ — เข้าสู่ระบบหรือสมัครสมาชิกเพื่อใช้โมดูลนี้
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={loginHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#5b61ff] to-indigo-600 px-4 text-sm font-bold text-white shadow-md"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href={registerHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#5b61ff]/25 bg-white/90 px-4 text-sm font-bold text-[#4d47b6]"
          >
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </main>
  );
}
