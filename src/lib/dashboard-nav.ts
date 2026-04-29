export type DashboardNavGroupId = "basic" | "finance" | "services" | "property" | "admin";

import {
  ATTENDANCE_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";
import { CHAT_AI_DASHBOARD_HREF, resolveDashboardNavLinkHref } from "@/lib/dashboard/chat-ai-href";
import type { UserRole as DashboardNavRole } from "@/generated/prisma/enums";

/** slug ใน `module_list` ที่ชี้หน้า Chat AI — ต้องได้ href เดียวกับเมนูพื้นฐาน (กันซ้ำ / mismatch) */
const CHAT_AI_MODULE_SLUGS = new Set(["chatai", "chat-ai", "personal-ai"]);

export type DashboardNavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

export function dashboardModuleHref(slug: string): string {
  if (CHAT_AI_MODULE_SLUGS.has(slug)) return CHAT_AI_DASHBOARD_HREF;
  if (slug === SYSTEM_MAP_CATALOG_SLUG) return "/dashboard/explore";
  if (slug === DORMITORY_MODULE_SLUG) return "/dashboard/dormitory";
  if (slug === ATTENDANCE_MODULE_SLUG) return "/dashboard/attendance";
  if (slug === BARBER_MODULE_SLUG) return "/dashboard/barber";
  if (slug === HOME_FINANCE_BASIC_MODULE_SLUG) return "/dashboard/home-finance";
  if (slug === CAR_WASH_MODULE_SLUG) return "/dashboard/car-wash";
  if (slug === MQTT_SERVICE_MODULE_SLUG) return "/dashboard/mqtt-service";
  if (slug === BUILDING_POS_MODULE_SLUG) return "/dashboard/building-pos";
  if (slug === VILLAGE_MODULE_SLUG) return "/dashboard/village";
  if (slug === PARKING_MODULE_SLUG) return "/dashboard/parking";
  if (slug === LAUNDRY_MODULE_SLUG) return "/dashboard/laundry";
  return `/dashboard/modules/${slug}`;
}

export const DASHBOARD_NAV_GROUP_LABEL: Record<DashboardNavGroupId, string> = {
  basic: "เมนูหลัก",
  finance: "การเงินและรายได้",
  services: "บริการทางธุรกิจ",
  property: "จัดการที่พักและอาคาร",
  admin: "จัดการระบบ",
};

/** เมนูคงที่ทั้งหมดอยู่กลุ่มพื้นฐาน — กลุ่มระบบใช้บริการมาจากโมดูลที่สมัคร/มีสิทธิ์ (ส่งจาก layout) */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/dashboard/profile", label: "โปรไฟล์" },
  { href: "/dashboard/plans", label: "แพ็กเกจ" },
  { href: "/dashboard/chat", label: "แชท" },
  { href: CHAT_AI_DASHBOARD_HREF, label: "เลขาส่วนตัว" },
  { href: "/dashboard/admin", label: "ศูนย์แอดมิน", adminOnly: true },
];

export type SubscribedModuleLink = {
  href: string;
  label: string;
  groupId: number;
  slug: string;
};

export function isSubscribedModuleLink(
  item: DashboardNavItem | SubscribedModuleLink,
): item is SubscribedModuleLink {
  return "groupId" in item && typeof (item as SubscribedModuleLink).groupId === "number";
}

export type DashboardNavGroup = {
  id: DashboardNavGroupId;
  label: string;
  items: (DashboardNavItem | SubscribedModuleLink)[];
};

/** เมนูพื้นฐานตามบทบาท */
export function basicNavForRole(role: DashboardNavRole): DashboardNavItem[] {
  return DASHBOARD_NAV.filter((item) => !item.adminOnly || role === "ADMIN");
}

/**
 * ประกอบ sidebar: พื้นฐาน + ระบบที่เปิดสิทธิ์ (จาก DB)
 * `subscribedModules` = slug + title ของแอปโมดูลที่ user Subscribe หรือทดลองอยู่
 */
export function buildDashboardNavGroups(
  role: DashboardNavRole,
  subscribedModules: { slug: string; title: string; groupId: number }[],
): DashboardNavGroup[] {
  const basicItems = basicNavForRole(role);
  const groups: DashboardNavGroup[] = [
    {
      id: "basic",
      label: DASHBOARD_NAV_GROUP_LABEL.basic,
      items: basicItems,
    },
  ];

  const basicResolved = new Set(basicItems.map((item) => resolveDashboardNavLinkHref(item.href)));
  const serviceLinks: SubscribedModuleLink[] = subscribedModules
    .map((m) => ({
      href: dashboardModuleHref(m.slug),
      label: m.title,
      groupId: m.groupId,
      slug: m.slug,
    }))
    .filter((item) => !basicResolved.has(resolveDashboardNavLinkHref(item.href)));

  if (serviceLinks.length > 0) {
    // จัดกลุ่มตาม slug/ประเภท (ระบุเป็น Set<string> เพื่อให้ .has(string) ไม่ติด Type Error)
    const financeSlugs = new Set<string>([HOME_FINANCE_BASIC_MODULE_SLUG]);
    const serviceSlugs = new Set<string>([
      BARBER_MODULE_SLUG,
      CAR_WASH_MODULE_SLUG,
      LAUNDRY_MODULE_SLUG,
      BUILDING_POS_MODULE_SLUG,
    ]);
    const propertySlugs = new Set<string>([
      DORMITORY_MODULE_SLUG,
      VILLAGE_MODULE_SLUG,
      PARKING_MODULE_SLUG,
    ]);
    const adminSlugs = new Set<string>([
      ATTENDANCE_MODULE_SLUG,
      MQTT_SERVICE_MODULE_SLUG,
      SYSTEM_MAP_CATALOG_SLUG,
    ]);

    const financeItems = serviceLinks.filter((l) => financeSlugs.has(l.slug));
    const businessItems = serviceLinks.filter((l) => serviceSlugs.has(l.slug));
    const propertyItems = serviceLinks.filter((l) => propertySlugs.has(l.slug));
    const systemItems = serviceLinks.filter((l) => adminSlugs.has(l.slug));
    const otherItems = serviceLinks.filter(
      (l) =>
        !financeSlugs.has(l.slug) &&
        !serviceSlugs.has(l.slug) &&
        !propertySlugs.has(l.slug) &&
        !adminSlugs.has(l.slug),
    );

    if (financeItems.length > 0) {
      groups.push({ id: "finance", label: DASHBOARD_NAV_GROUP_LABEL.finance, items: financeItems });
    }
    if (businessItems.length > 0 || otherItems.length > 0) {
      groups.push({
        id: "services",
        label: DASHBOARD_NAV_GROUP_LABEL.services,
        items: [...businessItems, ...otherItems],
      });
    }
    if (propertyItems.length > 0) {
      groups.push({ id: "property", label: DASHBOARD_NAV_GROUP_LABEL.property, items: propertyItems });
    }
    if (systemItems.length > 0) {
      groups.push({ id: "admin", label: DASHBOARD_NAV_GROUP_LABEL.admin, items: systemItems });
    }
  }

  return groups;
}

