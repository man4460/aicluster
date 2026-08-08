import type { Metadata } from "next";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule } from "@/lib/modules/access";
import {
  appDashboardBrandCtaPillButtonClass,
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates";
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
import { listModuleSlugsChargedToday } from "@/lib/tokens/module-daily-deduction";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { getModuleDailyUsageBadge } from "@/lib/modules/module-usage-badge";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";
import { isChatAiDisabled } from "@/lib/chat-ai/feature";
import { CHAT_AI_DASHBOARD_HREF } from "@/lib/dashboard/chat-ai-href";
import { DashboardPwaInstallBanner } from "@/components/pwa/DashboardPwaInstallBanner";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import { DashboardHomeModuleShelf } from "@/components/dashboard/DashboardHomeModuleShelf";

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

  const [user, modulesRaw, subscribedIds, trialIds, billCtx] = await Promise.all([
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
    getModuleBillingContext(session.sub),
  ]);

  if (!user) redirect("/login");

  const chargedTodaySlugs = billCtx
    ? await listModuleSlugsChargedToday(billCtx.billingUserId).catch(() => new Set<string>())
    : new Set<string>();

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
        canAccessAppModule(
          accessFields,
          { slug: m.slug, groupId: m.groupId },
          { chargedTodaySlugs },
        ),
    )
    .map((m) => ({ ...m, title: displayAppModuleTitle(m.slug, m.title) }));

  /** ยังไม่มีโปรแกรมที่เปิดใช้ได้ — พาไปเลือกระบบที่หน้ารวมก่อน */
  if (subscribedModules.length === 0) {
    redirect("/dashboard/modules");
  }

  const chatAiOff = isChatAiDisabled();

  return (
    <div className="space-y-3 sm:space-y-5">
      <DashboardPwaInstallBanner />

      <header className="app-surface overflow-hidden rounded-[1.35rem] border border-[#e8e6fc]/80 p-4 sm:p-5">
        <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 pl-0.5 sm:pl-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Workspace</p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">
              สวัสดี, <span className="app-gradient-text">{user.fullName || user.username}</span>
            </h1>
          </div>
          <Link
            href="/dashboard/modules"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-4 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99]"
          >
            ดูระบบทั้งหมด
          </Link>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12">
        <section className="app-surface overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 md:col-span-2 lg:col-span-8 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3 pl-0.5 sm:pl-0">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Token</p>
                <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-4xl">
                  {user.tokens.toLocaleString("en-US")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-3 py-1 text-xs font-black text-[#2e2a58]">
                  {subscribedModules.length} ระบบ
                </span>
                <span className="rounded-lg border border-white/70 bg-white/80 px-3 py-1 text-xs font-black text-[#2e2a58]">
                  {tierLine}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TokenTopupModal
                triggerLabel="เติมโทเคน"
                triggerClassName="app-btn-primary inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 text-sm font-black shadow-lg transition active:scale-[0.99]"
                subscriptionTier={user.subscriptionTier}
                subscriptionType={user.subscriptionType}
              />
              <Link
                href="/dashboard/plans"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-5 text-sm font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99]"
              >
                อัปเกรดแพ็กเกจ
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Links - Medium (4 cols on LG, 1 col on MD) */}
        <section className="flex flex-col gap-4 sm:gap-5 md:col-span-1 lg:col-span-4">
          <div className="app-surface flex-1 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5">
            <p className="pl-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c] sm:pl-0">Shortcut</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
              {[
                { label: "โปรไฟล์", href: "/dashboard/profile", icon: "👤" },
                { label: "แชท", href: "/dashboard/chat", icon: "💬" },
                { label: "แพ็กเกจ", href: "/dashboard/plans", icon: "💎" },
                {
                  label: "เลขาส่วนตัว",
                  href: CHAT_AI_DASHBOARD_HREF,
                  icon: "🤖",
                  badge: chatAiOff ? "พัฒนา" : undefined,
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-lg border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/20 hover:bg-white active:scale-[0.99]"
                >
                  {"badge" in link && link.badge ? (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                      {link.badge}
                    </span>
                  ) : null}
                  <span className="text-xl transition-transform group-hover:scale-110">{link.icon}</span>
                  <span className="text-[11px] font-bold text-[#2e2a58]">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="md:col-span-1 lg:col-span-12">
          <div className="app-surface overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 pl-0.5 sm:pl-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Support</p>
                <p className="mt-1 truncate text-sm font-black text-[#2e2a58]">
                  {chatAiOff ? "เลขาส่วนตัว (น้องมาเวล) · อยู่ระหว่างพัฒนา" : "คุยกับเลขา AI ของคุณได้ตลอด 24 ชม."}
                </p>
              </div>
              {chatAiOff ? (
                <span className="inline-flex h-10 shrink-0 cursor-default items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-5 text-xs font-black text-[#2e2a58]">
                  เร็ว ๆ นี้
                </span>
              ) : (
                <Link
                  href={CHAT_AI_DASHBOARD_HREF}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-5 text-xs font-black text-white shadow-sm transition active:scale-[0.99]",
                    appDashboardBrandGradientFillClass,
                  )}
                >
                  เริ่มต้นแชท
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      <DashboardHomeModuleShelf
        modules={subscribedModules.map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          groupId: m.groupId,
          imageUrl: resolveModuleCardDisplayImageUrl(m.slug, m.cardImageUrl),
          href: dashboardModuleHref(m.slug),
          usageBadge: getModuleDailyUsageBadge(m.slug, m.groupId),
        }))}
      />

      {user.role === "ADMIN" && (
        <section className="app-surface overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0000BF]/10 text-base text-[#2e2a58] ring-1 ring-[#0000BF]/15">
                🛡️
              </span>
              <h2 className="text-base font-black tracking-tight text-[#2e2a58] sm:text-lg">แผงควบคุมผู้ดูแลระบบ</h2>
            </div>
            <span className="hidden rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-3 py-1 text-xs font-black text-[#2e2a58] sm:inline-flex">
              Admin
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/dashboard/admin/users", icon: "👥", label: "จัดการผู้ใช้" },
              { href: "/dashboard/admin/activity-logs", icon: "📝", label: "Log กิจกรรม" },
              { href: "/dashboard/admin/mqtt", icon: "📡", label: "MQTT Status" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-start gap-2 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/20 hover:bg-white active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-lg ring-1 ring-slate-200 transition-transform group-hover:scale-105">
                  {item.icon}
                </span>
                <span className="text-[11px] font-black text-[#2e2a58] sm:text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
