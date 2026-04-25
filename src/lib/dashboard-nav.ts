export type DashboardNavRole = "USER" | "ADMIN";

export type DashboardNavGroupId = "basic" | "services";

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
} from "@/lib/modules/config";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";
import { CHAT_AI_DASHBOARD_HREF, resolveDashboardNavLinkHref } from "@/lib/dashboard/chat-ai-href";

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
  return `/dashboard/modules/${slug}`;
}

export const DASHBOARD_NAV_GROUP_LABEL: Record<DashboardNavGroupId, string> = {
  basic: "กลุ่มพื้นฐาน",
  services: "กลุ่มระบบใช้บริการ",
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
};

export function isSubscribedModuleLink(
  item: DashboardNavItem | SubscribedModuleLink,
): item is SubscribedModuleLink {
  return "groupId" in item && typeof (item as SubscribedModuleLink).groupId === "number";
}

export type DashboardNavGroup = {
  id: DashboardNavGroupId;
  label: string;
  items: DashboardNavItem[] | SubscribedModuleLink[];
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
  const serviceItems: SubscribedModuleLink[] = subscribedModules
    .map((m) => ({
      href: dashboardModuleHref(m.slug),
      label: m.title,
      groupId: m.groupId,
    }))
    .filter((item) => !basicResolved.has(resolveDashboardNavLinkHref(item.href)));

  if (serviceItems.length > 0) {
    groups.push({
      id: "services",
      label: DASHBOARD_NAV_GROUP_LABEL.services,
      items: serviceItems,
    });
  }

  return groups;
}

/** รายการแบนเรียงเดียว (รวมลิงก์โมดูล) */
export function navForRole(
  role: DashboardNavRole,
  subscribedModules: { slug: string; title: string; groupId: number }[],
): { href: string; label: string }[] {
  const mods = subscribedModules.map((m) => ({
    href: dashboardModuleHref(m.slug),
    label: m.title,
  }));
  return [...basicNavForRole(role), ...mods];
}
