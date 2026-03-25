import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { displayAppModuleTitle } from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await applyDailyTokenDeduction(session.sub);
    await applyBuffetMonthlyBilling(session.sub);
  } catch (e) {
    console.error("[token billing]", e);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      username: true,
      fullName: true,
      role: true,
      tokens: true,
      subscriptionTier: true,
      subscriptionType: true,
      lastBuffetBillingMonth: true,
      avatarUrl: true,
      employerUserId: true,
    },
  });

  if (!user) redirect("/login");

  const billCtx = await getModuleBillingContext(session.sub);
  if (!billCtx) redirect("/login");

  const allModules = await prisma.appModule.findMany({
    where: { isActive: true },
    orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
    select: { id: true, slug: true, title: true, groupId: true },
  });

  const access: UserAccessFields = billCtx.access;
  const [subscribedIds, trialIds] = await Promise.all([
    listSubscribedModuleIds(session.sub),
    Promise.resolve(listTrialModuleIds(session.sub)),
  ]);
  const subscribedSet = new Set(subscribedIds);
  const trialSet = new Set(trialIds);

  const allowDashboard = user.employerUserId
    ? true
    : computeDashboardAccessAllowed({
        role: user.role,
        subscriptionType: user.subscriptionType,
        subscriptionTier: user.subscriptionTier,
        tokens: user.tokens,
        lastBuffetBillingMonth: user.lastBuffetBillingMonth,
      });

  const serviceModules = allModules
    .filter((m) => !user.employerUserId || STAFF_ALLOWED_MODULE_SLUGS.has(m.slug))
    .filter((m) => subscribedSet.has(m.id) || trialSet.has(m.id))
    .map(({ slug, title, groupId }) => ({
      slug,
      title: displayAppModuleTitle(slug, title),
      groupId,
    }));

  const safeAvatar =
    user.avatarUrl && user.avatarUrl.startsWith("/uploads/") ? user.avatarUrl : null;

  return (
    <DashboardShell
      username={user.username}
      displayName={user.fullName?.trim() || user.username}
      role={user.role}
      tokens={user.tokens}
      subscriptionTier={user.subscriptionTier}
      subscriptionType={user.subscriptionType}
      serviceModules={serviceModules}
      avatarUrl={safeAvatar}
    >
      <TokenGate allowDashboard={allowDashboard} role={user.role}>
        {children}
      </TokenGate>
    </DashboardShell>
  );
}
