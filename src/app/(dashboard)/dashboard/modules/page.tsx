import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
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
  const hydrationReferenceMs = Number(new Date());

  const modules = filterAppModulesForDashboardUi(modulesRaw, session.role);

  const catalogModules = isMqttServiceModuleEnabled()
    ? modules
    : modules.filter((m) => m.slug !== MQTT_SERVICE_MODULE_SLUG);

  /** แผนผังระบบ — เฉพาะบัญชีที่ล็อกอินเป็นแอดมิน (ไม่ใช้สิทธิ์เจ้านายของพนักงาน) */
  const modulesWithDisplayTitles = [
    ...(session.role === "ADMIN" ? [{ ...SYSTEM_MAP_CATALOG_ROW }] : []),
    ...catalogModules.map((m) => ({
      ...m,
      title: displayAppModuleTitle(m.slug, m.title),
    })),
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="ระบบทั้งหมด"
        description="เลือกเปิดใช้งานระบบที่ต้องการ พร้อมค้นหาและจัดการ Subscribe ได้ในหน้าเดียว"
        className="rounded-3xl border border-white/80 bg-gradient-to-r from-white via-[#f8f7ff] to-[#fff3fb] p-4 shadow-sm sm:p-6"
        action={
          <Link
            href="/dashboard"
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[40px] items-center rounded-2xl border-[#0000BF]/20 bg-white/85 px-3 text-xs text-[#0000BF] hover:border-[#0000BF]/35 hover:bg-white sm:min-h-[42px] sm:px-4 sm:text-sm",
            )}
            aria-label="กลับหน้าแดชบอร์ด"
          >
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">กลับหน้าแดชบอร์ด</span>
          </Link>
        }
      />
      <ModuleSubscriptionBrowser
        modules={modulesWithDisplayTitles}
        showSystemMapCatalog={session.role === "ADMIN"}
        access={ctx.access}
        initialSubscribedIds={subscribedIds}
        initialTrialIds={trialIds}
        initialCooldownUnlocks={initialCooldownUnlocks}
        hydrationReferenceMs={hydrationReferenceMs}
      />
    </div>
  );
}

