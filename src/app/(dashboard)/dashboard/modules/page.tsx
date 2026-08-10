import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { displayAppModuleTitle, filterAppModulesForDashboardUi, MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { ModuleSubscriptionBrowser } from "@/components/dashboard/ModuleSubscriptionBrowser";
import { listActiveResubscribeCooldowns, listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";

export default async function ModulesCatalogPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx) redirect("/login");

  const [modulesRaw, subscribedIds, trialIds, cooldownRows] = await Promise.all([
    prisma.appModule.findMany({
      where: { isActive: true },
      orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, slug: true, title: true, description: true, groupId: true, cardImageUrl: true },
    }),
    listSubscribedModuleIds(session.sub),
    listTrialModuleIds(session.sub),
    listActiveResubscribeCooldowns(session.sub),
  ]);

  const initialCooldownUnlocks = Object.fromEntries(cooldownRows.map((c) => [c.moduleId, c.unlockAtIso]));
  const hydrationReferenceMs = Number(new Date());

  const modules = filterAppModulesForDashboardUi(modulesRaw, session.role);

  const catalogModules = isMqttServiceModuleEnabled()
    ? modules
    : modules.filter((m) => m.slug !== MQTT_SERVICE_MODULE_SLUG);

  const modulesWithDisplayTitles = catalogModules.map((m) => ({
    ...m,
    title: displayAppModuleTitle(m.slug, m.title),
    cardImageUrl: resolveModuleCardDisplayImageUrl(m.slug, m.cardImageUrl),
  }));

  return (
    <ModuleSubscriptionBrowser
      showCatalogHeader
      backHref="/dashboard"
      modules={modulesWithDisplayTitles}
      access={ctx.access}
      initialSubscribedIds={subscribedIds}
      initialTrialIds={trialIds}
      initialCooldownUnlocks={initialCooldownUnlocks}
      hydrationReferenceMs={hydrationReferenceMs}
    />
  );
}
