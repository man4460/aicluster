import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { displayAppModuleTitle, filterAppModulesForDashboardUi, MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { ModuleSubscriptionBrowser } from "@/components/dashboard/ModuleSubscriptionBrowser";
import { listActiveResubscribeCooldowns, listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";
import { SYSTEM_MAP_CATALOG_ROW } from "@/lib/modules/system-map-catalog";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";

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
  const hydrationReferenceMs = Date.now();

  const modules = filterAppModulesForDashboardUi(modulesRaw, ctx.access.role);

  const catalogModules = isMqttServiceModuleEnabled()
    ? modules
    : modules.filter((m) => m.slug !== MQTT_SERVICE_MODULE_SLUG);

  const modulesWithDisplayTitles = [
    { ...SYSTEM_MAP_CATALOG_ROW },
    ...catalogModules.map((m) => ({
      ...m,
      title: displayAppModuleTitle(m.slug, m.title),
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ระบบทั้งหมด"
        description="ค้นหาและเลือก Subscribe ระบบที่ต้องการใช้งาน"
        action={
          <Link href="/dashboard" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← กลับหน้าแดชบอร์ด
          </Link>
        }
      />
      <ModuleSubscriptionBrowser
        modules={modulesWithDisplayTitles}
        access={ctx.access}
        initialSubscribedIds={subscribedIds}
        initialTrialIds={trialIds}
        initialCooldownUnlocks={initialCooldownUnlocks}
        hydrationReferenceMs={hydrationReferenceMs}
      />
    </div>
  );
}

