import type { Metadata } from "next";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModuleShowcase } from "@/components/dashboard/ModuleShowcase";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { buffetTierMaxGroup, MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";
import type { UserAccessFields } from "@/lib/modules/access";

export const metadata: Metadata = {
  title: "แดชบอร์ด | MAWELL Buffet",
};

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

  const [user, modules] = await Promise.all([
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
  ]);

  if (!user) redirect("/login");

  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };

  const tierLine = planDisplayLabel(user.subscriptionType, user.subscriptionTier);

  return (
    <div className="space-y-8">
      <PageHeader title={`สวัสดี, ${user.fullName || user.username}`} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">โทเคนคงเหลือ</p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-slate-900">{user.tokens}</p>
          </div>
          <Link
            href="/dashboard/refill"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            เติมโทเคน
          </Link>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold text-slate-900">สถานะการสมัคร</h2>
          <p className="mt-2 text-sm text-slate-600">
            ประเภท:{" "}
            <span className="font-medium text-slate-800">
              {user.subscriptionType === "BUFFET" ? "แพ็กเกจเหมา (Buffet)" : "สายรายวัน (Pay-per-day)"}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            แพ็กเกจ: <span className="font-medium text-slate-800">{tierLine}</span>
          </p>
          <Link
            href="/dashboard/plans"
            className="mt-4 inline-block text-sm font-medium text-[#0000BF] hover:underline"
          >
            ดูแพ็กเกจ / อัปเกรด
          </Link>
        </div>

        {user.tokens <= 0 && user.role === "USER" ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link
              href="/dashboard/plans"
              className="inline-flex rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
            >
              ดูแพ็กเกจเหมา
            </Link>
          </div>
        ) : null}
      </div>

      <ModuleShowcase modules={modules} access={access} />
    </div>
  );
}
