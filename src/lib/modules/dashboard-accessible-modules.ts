import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { canAccessAppModule } from "@/lib/modules/access";
import {
  displayAppModuleTitle,
  filterAppModulesForDashboardUi,
  MQTT_SERVICE_MODULE_SLUG,
} from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";
import { listModuleSlugsChargedToday } from "@/lib/tokens/module-daily-deduction";

export type DashboardAccessibleModule = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  groupId: number;
  cardImageUrl: string | null;
};

/** โมดูลที่ user เปิดใช้ได้บนแดชบอร์ด (สมัคร + ทดลองที่ยังมีสิทธิ) */
export async function listDashboardAccessibleModules(userId: string): Promise<{
  modules: DashboardAccessibleModule[];
  role: UserRole;
}> {
  const [user, modulesRaw, subscribedIds, trialIds, billCtx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        tokens: true,
        subscriptionType: true,
        subscriptionTier: true,
        employerUserId: true,
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
        cardImageUrl: true,
      },
    }),
    listSubscribedModuleIds(userId),
    listTrialModuleIds(userId),
    getModuleBillingContext(userId),
  ]);

  if (!user) {
    return { modules: [], role: "USER" };
  }

  const chargedTodaySlugs = billCtx
    ? await listModuleSlugsChargedToday(billCtx.billingUserId).catch(() => new Set<string>())
    : new Set<string>();

  const modules = filterAppModulesForDashboardUi(modulesRaw, user.role);
  const accessSet = new Set([...subscribedIds, ...trialIds]);
  const accessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };

  const accessible = modules
    .filter((m) => m.slug !== SYSTEM_MAP_CATALOG_SLUG)
    .filter((m) => isMqttServiceModuleEnabled() || m.slug !== MQTT_SERVICE_MODULE_SLUG)
    .filter((m) => !user.employerUserId || STAFF_ALLOWED_MODULE_SLUGS.has(m.slug))
    .filter((m) => accessSet.has(m.id))
    .filter(
      (m) =>
        user.role === "ADMIN" ||
        user.employerUserId ||
        canAccessAppModule(
          accessFields,
          { slug: m.slug, groupId: m.groupId },
          { chargedTodaySlugs },
        ),
    )
    .map((m) => ({
      ...m,
      title: displayAppModuleTitle(m.slug, m.title),
    }));

  return { modules: accessible, role: user.role };
}
