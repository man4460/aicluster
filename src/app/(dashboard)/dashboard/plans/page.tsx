import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlansPricing } from "@/components/dashboard/PlansPricing";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listMonthly199ModuleSlugs } from "@/lib/tokens/module-monthly-199";

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

  const monthly199Slugs = await listMonthly199ModuleSlugs(session.sub);

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
        </div>
      </header>
      <PlansPricing
        showUpgradeHint={q.upgrade === "1"}
        subscriptionTier={user.subscriptionTier}
        subscriptionType={user.subscriptionType}
        tokens={user.tokens}
        monthly199Slugs={monthly199Slugs}
      />
    </div>
  );
}
