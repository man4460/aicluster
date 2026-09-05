import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlansPricing, type PlansModuleRow } from "@/components/dashboard/PlansPricing";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import {
  displayAppModuleTitle,
  isDailyTokenExemptModuleSlug,
} from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { prisma } from "@/lib/prisma";
import { listMonthly199ModuleSlugs, listPendingMonthlyDowngradeSlugs } from "@/lib/tokens/module-monthly-199";

export const metadata: Metadata = {
  title: "แพ็กเกจ | MAWELL PLATFORM",
};

type Props = { searchParams: Promise<{ upgrade?: string }> };

export default async function PlansPage({ searchParams }: Props) {
  const q = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      tokens: true,
      subscriptionTier: true,
      subscriptionType: true,
    },
  });
  if (!user) redirect("/login");

  const [moduleIds, monthly199Slugs, pendingDowngradeSlugs] = await Promise.all([
    listSubscribedModuleIds(session.sub),
    listMonthly199ModuleSlugs(session.sub),
    listPendingMonthlyDowngradeSlugs(session.sub),
  ]);
  const monthlySet = new Set(monthly199Slugs);
  const pendingDowngradeSet = new Set(pendingDowngradeSlugs);

  const appModules =
    moduleIds.length > 0
      ? await prisma.appModule.findMany({
          where: { id: { in: moduleIds }, isActive: true },
          select: { id: true, slug: true, title: true, sortOrder: true, groupId: true },
          orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
        })
      : [];

  const byId = new Map(appModules.map((m) => [m.id, m]));
  const modules: PlansModuleRow[] = moduleIds
    .map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => {
      const tokenFree = isDailyTokenExemptModuleSlug(m.slug);
      const plan: PlansModuleRow["plan"] = tokenFree
        ? "free"
        : monthlySet.has(m.slug)
          ? "monthly199"
          : "daily";
      return {
        id: m.id,
        slug: m.slug,
        title: displayAppModuleTitle(m.slug, m.title),
        tokenFree,
        plan,
        pendingDowngrade: plan === "monthly199" && pendingDowngradeSet.has(m.slug),
      };
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="app-surface relative overflow-hidden rounded-3xl border border-white/70 px-5 py-6 shadow-[0_16px_48px_-24px_rgba(79,70,229,0.2)] sm:px-8 sm:py-7">
        <div className={cn("h-1.5 w-full rounded-full relative z-[2]", appDashboardBrandGradientBarClass)} aria-hidden />
        <div
          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-[#c7d2fe]/50 to-fuchsia-200/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-[#0000BF]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative mt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Plans</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2e2a58] sm:text-3xl">แพ็กเกจ</h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium text-[#66638c]">
            จัดการสายรายวัน / รายเดือน ของแต่ละระบบที่สมัคร
          </p>
        </div>
      </header>
      <PlansPricing
        showUpgradeHint={q.upgrade === "1"}
        subscriptionTier={user.subscriptionTier}
        subscriptionType={user.subscriptionType}
        tokens={user.tokens}
        modules={modules}
      />
    </div>
  );
}
