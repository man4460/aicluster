/** รายการแท็บในศูนย์แอดมิน — ลำดับ = ลำดับในแถบเมนู / dock */

export type AdminHubIconKey =
  | "overview"
  | "users"
  | "tryLinks"
  | "cards"
  | "cooldowns"
  | "planFeatures"
  | "activity"
  | "mqtt";

export type AdminHubNavItem = {
  href: string;
  label: string;
  /** ป้ายสั้นใน dock มือถือ */
  dockLabel: string;
  description: string;
  icon: AdminHubIconKey;
};

export const ADMIN_HUB_HEADER_COLLAPSE_KEY = "mawell-admin-hub-header-collapsed";
export const ADMIN_HUB_HEADER_COLLAPSE_EVENT = "mawell-admin-hub-header-collapse";
export const ADMIN_HUB_DISPLAY_NAME = "ศูนย์แอดมิน";

export function isAdminHubPath(pathname: string): boolean {
  return pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
}

export function readAdminHubHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_HUB_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminHubHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ADMIN_HUB_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(ADMIN_HUB_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

export const ADMIN_HUB_OVERVIEW: AdminHubNavItem = {
  href: "/dashboard/admin",
  label: "ภาพรวม",
  dockLabel: "ภาพรวม",
  description: "ทางลัดไปทุกเครื่องมือแอดมิน",
  icon: "overview",
};

/**
 * ลำดับใช้งานจริง: ผู้ใช้ · ลิงก์ทดลอง · การ์ด มาก่อน
 * แล้วค่อยคูลดาวน์ · บันทึก · MQTT
 */
export const ADMIN_HUB_NAV_ITEMS: AdminHubNavItem[] = [
  {
    href: "/dashboard/admin/users",
    label: "ผู้ใช้",
    dockLabel: "ผู้ใช้",
    description: "สิทธิ์ บทบาท และสถานะบัญชี",
    icon: "users",
  },
  {
    href: "/dashboard/admin/module-try-links",
    label: "ลิงก์ทดลอง",
    dockLabel: "ลิงก์",
    description: "คัดลอกลิงก์หรือ QR ให้ลูกค้าทดลองโมดูล",
    icon: "tryLinks",
  },
  {
    href: "/dashboard/admin/module-cards",
    label: "รูปการ์ด",
    dockLabel: "การ์ด",
    description: "ภาพการ์ดบนแดชบอร์ดและแคตตาล็อก",
    icon: "cards",
  },
  {
    href: "/dashboard/admin/module-cooldowns",
    label: "ปลดล็อค",
    dockLabel: "ปลดล็อค",
    description: "คูลดาวน์การสมัครโมดูลของผู้ใช้",
    icon: "cooldowns",
  },
  {
    href: "/dashboard/admin/plan-features",
    label: "เงื่อนไขแพ็ก",
    dockLabel: "เงื่อนไข",
    description: "เปิด/ปิดโควต้าแถว พิมพ์สลิป อัปโหลดสลิป/เอกสาร",
    icon: "planFeatures",
  },
  {
    href: "/dashboard/admin/activity-logs",
    label: "กิจกรรม",
    dockLabel: "กิจกรรม",
    description: "บันทึกการใช้งานและเหตุการณ์สำคัญ",
    icon: "activity",
  },
  {
    href: "/dashboard/admin/mqtt",
    label: "MQTT",
    dockLabel: "MQTT",
    description: "สถานะการเชื่อมต่อแบบเรียลไทม์",
    icon: "mqtt",
  },
];

/** ลำดับเมนูทั้งหมดรวมภาพรวม — ใช้เรนเดอร์ dock / แถบเดสก์ท็อป */
export const ADMIN_HUB_MENU_ORDER: AdminHubNavItem[] = [ADMIN_HUB_OVERVIEW, ...ADMIN_HUB_NAV_ITEMS];

export function isAdminHubNavActive(pathname: string, href: string): boolean {
  return href === "/dashboard/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
