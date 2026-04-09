import type { Metadata } from "next";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { canAccessAppModule } from "@/lib/modules/access";
import { TokenTopupModal } from "@/components/dashboard/TokenTopupModal";
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
import { SYSTEM_MAP_CATALOG_ROW } from "@/lib/modules/system-map-catalog";
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
    <div className="space-y-8 sm:space-y-10">
      <header className="app-surface relative overflow-hidden rounded-3xl border border-white/70 px-5 py-6 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-8 sm:py-7">
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-[#0000BF]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0000BF]/75">MAWELL Buffet</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2e2a58] sm:text-3xl">
            สวัสดี, {user.fullName || user.username}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#66638c]">
            ยินดีต้อนรับกลับมา — เข้าระบบจากเมนูด้านข้างหรือการ์ดด้านล่าง โมดูลเพิ่มเติมดูได้ที่หน้า
            <Link href="/dashboard/modules" className="font-medium text-[#0000BF] hover:underline">
              ระบบทั้งหมด
            </Link>
          </p>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#f4f2ff]/95 via-white to-[#fff8fc] p-6 shadow-[0_24px_64px_-28px_rgba(79,70,229,0.28)] ring-1 ring-[#e8e4ff]/60 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-200/40 to-violet-100/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#0000BF]/20 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0000BF] backdrop-blur-sm">
                Token balance
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0000BF]/[0.08] px-3 py-1 text-xs font-semibold text-[#312e81]">
                <span className="tabular-nums">{subscribedModules.length}</span>
                <span className="text-[#66638c]">ระบบที่เปิดใช้</span>
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-3 sm:gap-4">
              <span
                aria-hidden
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0000BF] to-[#6366f1] text-white shadow-lg shadow-indigo-500/30"
              >
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-[#66638c]">ยอดโทเคนคงเหลือ</p>
                <p className="mt-0.5 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] bg-clip-text text-4xl font-bold tabular-nums tracking-tight text-transparent sm:text-5xl">
                  {user.tokens.toLocaleString("en-US")}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#66638c]">
              พร้อมใช้งาน <span className="font-semibold text-[#2e2a58]">{subscribedModules.length}</span> ระบบ
              <span className="text-[#94a3b8]"> · </span>
              Subscribe หรือทดลอง
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:max-w-xs lg:w-auto lg:min-w-[220px]">
            <TokenTopupModal
              triggerLabel="เติมโทเคน"
              triggerClassName="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0000BF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0000BF]/25 transition hover:bg-[#0000a3] active:scale-[0.99]"
              subscriptionTier={user.subscriptionTier}
              subscriptionType={user.subscriptionType}
            />
            <Link
              href="/dashboard/plans"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#0000BF]/20 bg-white/90 px-5 py-3 text-sm font-semibold text-[#0000BF] shadow-sm backdrop-blur-sm transition hover:border-[#0000BF]/35 hover:bg-white"
            >
              <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
              </svg>
              ดูแพ็กเกจ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="app-surface-strong flex flex-col gap-3 rounded-2xl border border-[#e8e6f4]/70 p-5 shadow-sm transition hover:border-[#c7d2fe]/80 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-50 text-[#4338ca]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#66638c]">ประเภทแพ็กเกจ</p>
          <p className="text-base font-semibold leading-snug text-[#2e2a58]">
            {user.subscriptionType === "BUFFET" ? "แพ็กเกจเหมา (Buffet)" : "สายรายวัน (Pay-per-day)"}
          </p>
        </div>
        <div className="app-surface-strong flex flex-col gap-3 rounded-2xl border border-[#e8e6f4]/70 p-5 shadow-sm transition hover:border-[#c7d2fe]/80 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#66638c]">แพ็ก / ระดับปัจจุบัน</p>
          <p className="text-base font-semibold leading-snug text-[#2e2a58]">{tierLine}</p>
        </div>
        <div className="app-surface-strong flex flex-col gap-3 rounded-2xl border border-[#e8e6f4]/70 p-5 shadow-sm transition hover:border-[#c7d2fe]/80 hover:shadow-md sm:col-span-3 lg:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-teal-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 10h16M4 14h10M4 18h8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#66638c]">ระบบที่เปิดสิทธิ์</p>
          <p className="text-base font-semibold tabular-nums text-[#2e2a58]">{subscribedModules.length} ระบบ</p>
          <p className="text-xs leading-relaxed text-[#66638c]">
            จัดการรายการได้ที่{" "}
            <Link href="/dashboard/modules" className="font-medium text-[#0000BF] hover:underline">
              ระบบทั้งหมด
            </Link>
          </p>
        </div>
      </section>

      {user.tokens <= 0 && user.role === "USER" ? (
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/95 via-white/90 to-rose-50/60 px-4 py-3 shadow-md backdrop-blur-sm">
          <p className="text-sm font-medium text-amber-900">โทเคนของคุณหมดแล้ว กรุณาเติมโทเคนเพื่อใช้งานต่อ</p>
          <div className="mt-3">
            <Link
              href="/dashboard/plans"
              className="inline-flex rounded-2xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#0000a3]"
            >
              ดูแพ็กเกจเหมา
            </Link>
          </div>
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-[#e8e6f4]/90 bg-gradient-to-r from-white via-[#faf9ff] to-[#f5f3ff] px-5 py-4 shadow-sm ring-1 ring-white/80 sm:px-6 sm:py-5">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#0000BF] via-[#6366f1] to-[#a78bfa]"
            aria-hidden
          />
          <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0000BF]/80">Your apps</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-[1.35rem]">
                โปรแกรมที่ใช้งานได้
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[#66638c]">
                เลือกการ์ดเพื่อเข้าใช้งาน หรือเปิดแผนผังเพื่อดูภาพรวมระบบ
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end sm:gap-2">
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/explore"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-[#0000BF]/15 bg-white/90 px-4 py-2 text-sm font-semibold text-[#0000BF] shadow-sm backdrop-blur-sm transition hover:border-[#0000BF]/30 hover:bg-white"
                >
                  แผนผังระบบ
                </Link>
                <Link
                  href="/dashboard/modules"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-semibold text-[#2e2a58] shadow-sm transition hover:border-[#c7d2fe] hover:bg-white"
                >
                  ดูระบบทั้งหมด
                </Link>
              </div>
              {user.role === "ADMIN" ? (
                <Link
                  href="/dashboard/admin/module-cards"
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-2xl bg-[#0000BF] px-4 py-2 text-center text-sm font-semibold text-white shadow-md shadow-indigo-400/20 transition hover:bg-[#0000a3] sm:w-auto"
                >
                  อัปโหลดรูปการ์ดระบบ
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        {user.role === "ADMIN" ? (
          <p className="rounded-2xl border border-[#c7d2fe] bg-gradient-to-r from-[#eef2ff] to-[#faf5ff] px-4 py-3 text-sm text-[#312e81]">
            <span className="font-semibold">แอดมิน:</span> รูปบนการ์ดแต่ละระบบไม่ได้อัปโหลดจากการ์ดนี้ — กดปุ่ม{" "}
            <strong>อัปโหลดรูปการ์ดระบบ</strong> ด้านบน หรือเข้า{" "}
            <strong>ศูนย์แอดมิน</strong> จากเมนูกลุ่มพื้นฐาน แล้วเลือก «รูปการ์ดระบบ»
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardModuleHeroCard
            variant="systemMap"
            groupId={SYSTEM_MAP_CATALOG_ROW.groupId}
            title={SYSTEM_MAP_CATALOG_ROW.title}
            description={dashboardSystemMapCardDescription()}
            href="/dashboard/explore"
            ctaLabel="เปิดแผนผังระบบ"
          />
          {subscribedModules.map((m) => (
            <DashboardModuleHeroCard
              key={m.id}
              imageUrl={m.cardImageUrl}
              groupId={m.groupId}
              title={m.title}
              description={dashboardModuleCardDescription(m.slug)}
              href={dashboardModuleHref(m.slug)}
              ctaLabel="เข้าใช้งาน"
            />
          ))}
        </div>
        {subscribedModules.length === 0 ? (
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/95 to-rose-50/70 px-4 py-3 text-sm text-amber-900 shadow-md backdrop-blur-sm">
            ยังไม่มีระบบที่ Subscribe หรือทดลอง — กด{" "}
            <Link href="/dashboard/modules" className="font-semibold underline">
              ดูระบบทั้งหมด
            </Link>{" "}
            เพื่อเลือกใช้งาน
          </div>
        ) : null}
      </section>
    </div>
  );
}
