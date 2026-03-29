import type { Metadata } from "next";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { TokenTopupModal } from "@/components/dashboard/TokenTopupModal";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buffetTierMaxGroup, displayAppModuleTitle, MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";

export const metadata: Metadata = {
  title: "แดชบอร์ด | MAWELL Buffet",
};

function groupTone(groupId: number): { chip: string; icon: string } {
  if (groupId === 1) return { chip: "bg-[#0000BF]/10 text-[#0000BF] border-[#0000BF]/20", icon: "●" };
  if (groupId === 2) return { chip: "bg-slate-100 text-slate-700 border-slate-200", icon: "◆" };
  if (groupId === 3) return { chip: "bg-amber-100 text-amber-800 border-amber-200", icon: "▲" };
  if (groupId === 4) return { chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200", icon: "■" };
  return { chip: "bg-rose-100 text-rose-800 border-rose-200", icon: "★" };
}

function groupCardAccent(groupId: number): string {
  if (groupId === 1) return "from-[#0000BF]/[0.05] to-white";
  if (groupId === 2) return "from-slate-100 to-white";
  if (groupId === 3) return "from-amber-100/70 to-white";
  if (groupId === 4) return "from-fuchsia-100/70 to-white";
  return "from-rose-100/70 to-white";
}

function groupIcon(groupId: number): string {
  if (groupId === 1) return "🧩";
  if (groupId === 2) return "⚙️";
  if (groupId === 3) return "📊";
  if (groupId === 4) return "🛠️";
  return "✨";
}

function planDisplayLabel(subscriptionType: SubscriptionType, subscriptionTier: SubscriptionTier): string {
  if (subscriptionType === "BUFFET" && subscriptionTier !== "NONE") {
    const g = buffetTierMaxGroup(subscriptionTier);
    return MODULE_GROUP_TIER_NAME[g] ?? subscriptionTier;
  }
  return "—";
}

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, modules, subscribedIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        username: true,
        role: true,
        tokens: true,
        subscriptionTier: true,
        subscriptionType: true,
        fullName: true,
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
      },
    }),
    listSubscribedModuleIds(session.sub),
  ]);

  if (!user) redirect("/login");

  const tierLine = planDisplayLabel(user.subscriptionType, user.subscriptionTier);

  const subscribedSet = new Set(subscribedIds);
  const subscribedModules = modules
    .filter((m) => subscribedSet.has(m.id))
    .map((m) => ({ ...m, title: displayAppModuleTitle(m.slug, m.title) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`สวัสดี, ${user.fullName || user.username}`}
        description="ยินดีต้อนรับกลับมา ตรวจสอบโทเคน แพ็กเกจ และเข้าใช้งานระบบที่ Subscribe ได้จากหน้านี้"
      />

      <section className="rounded-3xl border border-[#0000BF]/15 bg-gradient-to-br from-white via-[#0000BF]/[0.03] to-sky-100/60 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0000BF]/80">Token Balance</p>
            <p className="mt-1 flex items-center gap-2 text-4xl font-bold tabular-nums text-slate-900 sm:text-5xl">
              <span aria-hidden className="text-2xl sm:text-3xl">
                🪙
              </span>
              <span>{user.tokens.toLocaleString("en-US")}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">พร้อมใช้งาน {subscribedModules.length} ระบบที่ Subscribe</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <TokenTopupModal
              triggerLabel="เติมโทเคน"
              subscriptionTier={user.subscriptionTier}
              subscriptionType={user.subscriptionType}
            />
            <Link
              href="/dashboard/plans"
              className="inline-flex items-center justify-center rounded-xl border border-[#0000BF]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0000BF] hover:bg-[#0000BF]/5"
            >
              ดูแพ็กเกจ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscription Type</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {user.subscriptionType === "BUFFET" ? "แพ็กเกจเหมา (Buffet)" : "สายรายวัน (Pay-per-day)"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Plan</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{tierLine}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscribed Systems</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{subscribedModules.length} ระบบ</p>
          <p className="mt-1 text-xs text-slate-500">จัดการรายการระบบได้ที่เมนูระบบทั้งหมด</p>
        </div>
      </section>

      {user.tokens <= 0 && user.role === "USER" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">โทเคนของคุณหมดแล้ว กรุณาเติมโทเคนเพื่อใช้งานต่อ</p>
          <div className="mt-3">
            <Link
              href="/dashboard/plans"
              className="inline-flex rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
            >
              ดูแพ็กเกจเหมา
            </Link>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">โปรแกรมที่ Subscribe แล้ว</h2>
          <Link href="/dashboard/modules" className="text-sm font-medium text-[#0000BF] hover:underline">
            ดูระบบทั้งหมด
          </Link>
        </div>
        {subscribedModules.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subscribedModules.map((m) => {
              const tone = groupTone(m.groupId);
              return (
                <div
                  key={m.id}
                  className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-gradient-to-br ${groupCardAccent(m.groupId)} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${tone.chip}`}
                    >
                      <span aria-hidden>{tone.icon}</span>
                      <span>กลุ่ม {m.groupId}</span>
                    </div>
                    <span className="text-lg leading-none" aria-hidden>
                      {groupIcon(m.groupId)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{m.title}</p>
                  <p className="mt-1 min-h-[2.5rem] line-clamp-2 text-xs text-slate-500">
                    {m.description ?? "พร้อมใช้งานทันที"}
                  </p>
                  <Link
                    href={dashboardModuleHref(m.slug)}
                    className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-[#0000BF] py-2 text-xs font-semibold text-white hover:bg-[#0000a3]"
                  >
                    เข้าใช้งาน
                  </Link>
                </div>
              );
            })}
          </div>
        ) : null}
        {subscribedModules.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ยังไม่มีระบบที่ Subscribe — กด{" "}
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
