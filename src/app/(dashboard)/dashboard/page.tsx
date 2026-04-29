import type { Metadata } from "next";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule } from "@/lib/modules/access";
import { appDashboardBrandCtaPillButtonClass, appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { TokenTopupModal } from "@/components/dashboard/TokenTopupModal";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  displayAppModuleTitle,
  filterAppModulesForDashboardUi,
  MQTT_SERVICE_MODULE_SLUG,
} from "@/lib/modules/config";
import { tierGroupLabel } from "@/lib/module-permissions";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import {
  dashboardModuleCardDescription,
  dashboardSystemMapCardDescription,
} from "@/lib/modules/dashboard-card-descriptions";
import {
  SYSTEM_MAP_CATALOG_ROW,
  SYSTEM_MAP_CATALOG_SLUG,
} from "@/lib/modules/system-map-catalog";
import { CHAT_AI_DASHBOARD_HREF } from "@/lib/dashboard/chat-ai-href";
import { DashboardModuleHeroCard } from "@/components/dashboard/DashboardModuleHeroCard";

export const metadata: Metadata = {
  title: "แดชบอร์ด | MAWELL Buffet",
};

function planSummaryLine(subscriptionType: SubscriptionType, subscriptionTier: SubscriptionTier): string {
  if (subscriptionType === "DAILY") return "สายรายวัน";
  if (subscriptionType === "BUFFET" && subscriptionTier !== "NONE") return tierGroupLabel(subscriptionTier);
  return "—";
}

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, modulesRaw, subscribedIds, trialIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        username: true,
        role: true,
        tokens: true,
        subscriptionTier: true,
        subscriptionType: true,
        fullName: true,
        employerUserId: true,
      },
    }),
    prisma.appModule.findMany({
      where: { isActive: true },
      orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        groupId: true,
        cardImageUrl: true,
      },
    }),
    listSubscribedModuleIds(session.sub),
    listTrialModuleIds(session.sub),
  ]);

  if (!user) redirect("/login");

  const modules = filterAppModulesForDashboardUi(modulesRaw, user.role);

  const tierLine = planSummaryLine(user.subscriptionType, user.subscriptionTier);

  const accessSet = new Set([...subscribedIds, ...trialIds]);
  const accessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  const subscribedModules = modules
    .filter((m) => m.slug !== SYSTEM_MAP_CATALOG_SLUG)
    .filter((m) => isMqttServiceModuleEnabled() || m.slug !== MQTT_SERVICE_MODULE_SLUG)
    .filter((m) => !user.employerUserId || STAFF_ALLOWED_MODULE_SLUGS.has(m.slug))
    .filter((m) => accessSet.has(m.id))
    .filter(
      (m) =>
        user.role === "ADMIN" ||
        user.employerUserId ||
        canAccessAppModule(accessFields, { slug: m.slug, groupId: m.groupId }),
    )
    .map((m) => ({ ...m, title: displayAppModuleTitle(m.slug, m.title) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 pb-10">
      {/* Header Section - Bento Hero */}
      <header className="group relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-gradient-to-br from-[#f7f2ff] via-white to-[#ffeefa] p-6 shadow-[0_20px_50px_-20px_rgba(68,49,127,0.18)] ring-1 ring-white/70 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#c7d2fe]/40 to-fuchsia-200/30 blur-[80px] transition-transform duration-1000 group-hover:scale-110"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-[#0000BF]/5 blur-[60px]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center rounded-full bg-[#5b61ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b61ff]">
              Workspace
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#2e2a58] sm:text-4xl">
              สวัสดี, <span className="app-gradient-text">{user.fullName || user.username}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#66638c] sm:text-base">
              ยินดีต้อนรับสู่ MAWELL Buffet — พื้นที่จัดการธุรกิจของคุณให้เป็นเรื่องง่ายและทันสมัย
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/modules"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/80 px-5 text-sm font-semibold text-[#5b61ff] shadow-sm ring-1 ring-[#5b61ff]/20 backdrop-blur-sm transition hover:bg-white"
            >
              ดูระบบทั้งหมด
            </Link>
          </div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* Token Balance Card - Large (8 cols on LG, 2 cols on MD) */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#e8e4ff]/90 bg-gradient-to-br from-[#f6efff] via-white to-[#ffeef8] p-6 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.2)] ring-1 ring-white/90 md:col-span-2 lg:col-span-8 sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-100/30 blur-[60px]"
            aria-hidden
          />
          <div className="relative h-full flex flex-col justify-between gap-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0000BF]/60">Token Balance</span>
                <p className="text-4xl font-black tabular-nums tracking-tighter text-[#1e1b4b] sm:text-5xl">
                  {user.tokens.toLocaleString("en-US")}
                </p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-indigo-100 to-violet-50 shadow-sm" />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2">
              <div className="rounded-3xl bg-white/40 p-4 ring-1 ring-white/60 backdrop-blur-md">
                <p className="text-xs font-medium text-[#66638c]">สถานะการใช้งาน</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-[#2e2a58]">{subscribedModules.length} ระบบที่เปิดใช้</span>
                </div>
              </div>
              <div className="rounded-3xl bg-white/40 p-4 ring-1 ring-white/60 backdrop-blur-md">
                <p className="text-xs font-medium text-[#66638c]">ระดับแพ็กเกจ</p>
                <p className="mt-2 text-sm font-bold text-[#2e2a58]">{tierLine}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <TokenTopupModal
                triggerLabel="เติมโทเคน"
                triggerClassName={cn(appDashboardBrandCtaPillButtonClass, "flex-1 rounded-2xl")}
                subscriptionTier={user.subscriptionTier}
                subscriptionType={user.subscriptionType}
              />
              <Link
                href="/dashboard/plans"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#5b61ff]/20 bg-white px-6 text-sm font-bold text-[#5b61ff] shadow-sm transition hover:bg-[#5b61ff]/5"
              >
                อัปเกรดแพ็กเกจ
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Links - Medium (4 cols on LG, 1 col on MD) */}
        <section className="flex flex-col gap-6 md:col-span-1 lg:col-span-4">
          <div className="flex-1 rounded-[2.5rem] border border-[#e8e6f4]/70 bg-white/60 p-6 shadow-sm backdrop-blur-md ring-1 ring-white/80">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#66638c]">Shortcut</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2">
              {[
                { label: "โปรไฟล์", href: "/dashboard/profile", icon: "👤" },
                { label: "แชท", href: "/dashboard/chat", icon: "💬" },
                { label: "แพ็กเกจ", href: "/dashboard/plans", icon: "💎" },
                { label: "เลขาส่วนตัว", href: CHAT_AI_DASHBOARD_HREF, icon: "🤖" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col items-center justify-center gap-2 rounded-3xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-1 hover:border-[#5b61ff]/30 hover:shadow-md"
                >
                  <span className="text-xl transition-transform group-hover:scale-110">{link.icon}</span>
                  <span className="text-[11px] font-bold text-[#2e2a58]">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Support Card - 1 col on MD, 4 cols on LG if needed or separate row */}
        <section className="md:col-span-1 lg:col-span-12">
          <div className="rounded-[2.5rem] border border-[#0000BF]/10 bg-gradient-to-br from-[#0000BF] to-[#6366f1] p-6 text-white shadow-lg shadow-indigo-500/20 lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex lg:items-center lg:gap-8">
              <div className="flex items-center justify-between lg:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Support</p>
                <div className="h-2 w-2 rounded-full bg-white/40 lg:hidden" />
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed lg:mt-0 lg:text-base">
                ต้องการความช่วยเหลือ? <br className="lg:hidden" />
                <span className="text-lg font-bold lg:ml-2 lg:text-xl">คุยกับเลขา AI ของคุณได้ตลอด 24 ชม.</span>
              </p>
            </div>
            <Link
              href={CHAT_AI_DASHBOARD_HREF}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-white px-6 text-sm font-bold text-[#0000BF] transition hover:bg-opacity-90 lg:mt-0"
            >
              เริ่มต้นแชท
            </Link>
          </div>
        </section>
      </div>

      {/* Modules Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-[#2e2a58]">โปรแกรมที่ใช้งานได้</h2>
          <Link href="/dashboard/modules" className="text-sm font-semibold text-[#5b61ff] hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        
        {subscribedModules.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {user.role === "ADMIN" && (
              <DashboardModuleHeroCard
                variant="systemMap"
                groupId={SYSTEM_MAP_CATALOG_ROW.groupId}
                title={SYSTEM_MAP_CATALOG_ROW.title}
                description={dashboardSystemMapCardDescription()}
                href="/dashboard/explore"
                ctaLabel="เปิดแผนผังระบบ"
              />
            )}
            {subscribedModules.map((m) => (
              <DashboardModuleHeroCard
                key={m.id}
                href={dashboardModuleHref(m.slug)}
                imageUrl={m.cardImageUrl}
                title={m.title}
                description={dashboardModuleCardDescription(m.slug)}
                groupId={m.groupId}
                ctaLabel="เข้าใช้งาน"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <h3 className="text-base font-bold text-[#2e2a58]">ยังไม่มีระบบที่เปิดใช้งาน</h3>
            <p className="mt-1 text-sm text-[#66638c]">เลือกเปิดใช้งานระบบที่ต้องการได้จากหน้าระบบทั้งหมด</p>
            <Link
              href="/dashboard/modules"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0000BF] px-6 text-sm font-bold text-white transition hover:bg-opacity-90"
            >
              ไปหน้าระบบทั้งหมด
            </Link>
          </div>
        )}
      </section>

      {user.role === "ADMIN" && (
        <section className="rounded-[2.5rem] border border-[#c8c4ff]/50 bg-white/40 p-6 backdrop-blur-md ring-1 ring-white/60 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5b61ff] text-white text-base shadow-lg shadow-[#5b61ff]/20">
              🛡️
            </span>
            <h2 className="text-lg font-bold text-[#2e2a58]">แผงควบคุมผู้ดูแลระบบ</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link href="/dashboard/admin/users" className="group flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:ring-[#5b61ff]/30">
              <span className="text-lg transition-transform group-hover:scale-110">👥</span>
              <span className="text-xs font-bold text-[#2e2a58]">จัดการผู้ใช้</span>
            </Link>
            <Link href="/dashboard/admin/activity-logs" className="group flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:ring-[#5b61ff]/30">
              <span className="text-lg transition-transform group-hover:scale-110">📝</span>
              <span className="text-xs font-bold text-[#2e2a58]">Log กิจกรรม</span>
            </Link>
            <Link href="/dashboard/admin/mqtt" className="group flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:ring-[#5b61ff]/30">
              <span className="text-lg transition-transform group-hover:scale-110">📡</span>
              <span className="text-xs font-bold text-[#2e2a58]">MQTT Status</span>
            </Link>
            <Link href="/dashboard/explore" className="group flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:ring-[#5b61ff]/30">
              <span className="text-lg transition-transform group-hover:scale-110">🗺️</span>
              <span className="text-xs font-bold text-[#2e2a58]">แผนผังระบบ</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
