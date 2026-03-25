export type DashboardNavRole = "USER" | "ADMIN";

export type DashboardNavGroupId = "basic" | "services";

import {
  BARBER_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
} from "@/lib/modules/config";

export type DashboardNavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

export function dashboardModuleHref(slug: string): string {
  if (slug === DORMITORY_MODULE_SLUG) return "/dashboard/dormitory";
  if (slug === BARBER_MODULE_SLUG) return "/dashboard/barber";
  if (slug === HOME_FINANCE_BASIC_MODULE_SLUG) return "/dashboard/home-finance";
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
  { href: "/dashboard/activity-logs", label: "ความเคลื่อนไหวระบบ" },
  { href: "/dashboard/plans", label: "แพ็กเกจ" },
  { href: "/dashboard/chat", label: "แชท" },
  { href: "/dashboard/admin/users", label: "จัดการผู้ใช้", adminOnly: true },
];

export type SubscribedModuleLink = {
  href: string;
  label: string;
};

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
 * `subscribedModules` = slug + title ของแอปโมดูลที่ user เข้าได้
 */
export function buildDashboardNavGroups(
  role: DashboardNavRole,
  subscribedModules: { slug: string; title: string }[],
): DashboardNavGroup[] {
  const basicItems = basicNavForRole(role);
  const groups: DashboardNavGroup[] = [
    {
      id: "basic",
      label: DASHBOARD_NAV_GROUP_LABEL.basic,
      items: basicItems,
    },
  ];

  const serviceItems: SubscribedModuleLink[] = subscribedModules.map((m) => ({
    href: dashboardModuleHref(m.slug),
    label: m.title,
  }));

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
  subscribedModules: { slug: string; title: string }[],
): { href: string; label: string }[] {
  const mods = subscribedModules.map((m) => ({
    href: dashboardModuleHref(m.slug),
    label: m.title,
  }));
  return [...basicNavForRole(role), ...mods];
}
