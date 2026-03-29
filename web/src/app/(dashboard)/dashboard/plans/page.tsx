import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlansPricing } from "@/components/dashboard/PlansPricing";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แพ็กเกจ | MAWELL Buffet",
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

  return (
    <div className="space-y-6">
      <PageHeader title="แพ็กเกจ Buffet Subscription" />
      <PlansPricing
        showUpgradeHint={q.upgrade === "1"}
        subscriptionTier={user.subscriptionTier}
        subscriptionType={user.subscriptionType}
        tokens={user.tokens}
      />
    </div>
  );
}
