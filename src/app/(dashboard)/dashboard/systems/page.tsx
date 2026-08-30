import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates";
import { DashboardHomeModuleShelf } from "@/components/dashboard/DashboardHomeModuleShelf";
import { getSession } from "@/lib/auth/session";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { listDashboardAccessibleModules } from "@/lib/modules/dashboard-accessible-modules";
import { getModuleDailyUsageBadge } from "@/lib/modules/module-usage-badge";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "ระบบที่สมัคร | MAWELL PLATFORM",
};

export default async function DashboardSubscribedSystemsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { modules } = await listDashboardAccessibleModules(session.sub);
  if (modules.length === 0) {
    redirect("/dashboard/modules");
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="app-surface overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5">
        <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 pl-0.5 sm:pl-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">My systems</p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">
              ระบบที่สมัคร
            </h1>
            <p className="mt-1 text-xs font-semibold text-[#66638c]">
              เปิดใช้งานระบบที่คุณสมัครไว้ — {modules.length} ระบบ
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/70 bg-white/85 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-white active:scale-[0.99] sm:px-4"
            >
              แดชบอร์ด
            </Link>
            <Link
              href="/dashboard/modules"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99] sm:px-4"
            >
              ดูระบบทั้งหมด
            </Link>
          </div>
        </div>
      </header>

      <DashboardHomeModuleShelf
        variant="all"
        moreLink={{ href: "/dashboard/modules", label: "ดูระบบทั้งหมด" }}
        modules={modules.map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          groupId: m.groupId,
          imageUrl: resolveModuleCardDisplayImageUrl(m.slug, m.cardImageUrl),
          href: dashboardModuleHref(m.slug),
          usageBadge: getModuleDailyUsageBadge(m.slug, m.groupId),
        }))}
      />
    </div>
  );
}
