import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { canAccessAppModule } from "@/lib/modules/access";
import { displayAppModuleTitle, MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
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

  const [subscribedIds, trialIds] = await Promise.all([
    listSubscribedModuleIds(session.sub),
    listTrialModuleIds(session.sub),
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

  const accessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };

  let serviceModules = allModules
    .filter((m) => !user.employerUserId || STAFF_ALLOWED_MODULE_SLUGS.has(m.slug))
    .filter((m) => subscribedSet.has(m.id) || trialSet.has(m.id))
    .filter(
      (m) =>
        user.role === "ADMIN" ||
        user.employerUserId ||
        canAccessAppModule(accessFields, { slug: m.slug, groupId: m.groupId }),
    )
    .map(({ slug, title, groupId }) => ({
      slug,
      title: displayAppModuleTitle(slug, title),
      groupId,
    }));

  if (!isMqttServiceModuleEnabled()) {
    serviceModules = serviceModules.filter((m) => m.slug !== MQTT_SERVICE_MODULE_SLUG);
  }

  serviceModules.sort((a, b) =>
    a.groupId !== b.groupId ? a.groupId - b.groupId : a.title.localeCompare(b.title, "th"),
  );

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
