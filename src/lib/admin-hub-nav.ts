/** รายการแท็บในศูนย์แอดมิน — ลำดับ = ลำดับในแถบเมนู / dock */

export type AdminHubIconKey =
  | "overview"
  | "users"
  | "activity"
  | "mqtt"
  | "cooldowns"
  | "cards";

export type AdminHubNavItem = {
  href: string;
  label: string;
  /** ป้ายสั้นใน dock มือถือ */
  dockLabel: string;
  description: string;
  icon: AdminHubIconKey;
};

export const ADMIN_HUB_OVERVIEW: AdminHubNavItem = {
  href: "/dashboard/admin",
  label: "ภาพรวม",
  dockLabel: "ภาพรวม",
  description: "ทางลัดไปทุกเครื่องมือ — จัดการผู้ใช้ บันทึกระบบ และรูปการ์ด",
  icon: "overview",
};

export const ADMIN_HUB_NAV_ITEMS: AdminHubNavItem[] = [
  {
    href: "/dashboard/admin/users",
    label: "จัดการผู้ใช้",
    dockLabel: "ผู้ใช้",
    description: "สิทธิ์ บทบาท และสถานะบัญชีในระบบ",
    icon: "users",
  },
  {
    href: "/dashboard/admin/activity-logs",
    label: "ความเคลื่อนไหวระบบ",
    dockLabel: "กิจกรรม",
    description: "ตรวจบันทึกการใช้งานและเหตุการณ์สำคัญ",
    icon: "activity",
  },
  {
    href: "/dashboard/admin/mqtt",
    label: "สถานะ MQTT",
    dockLabel: "MQTT",
    description: "การเชื่อมต่อ ข้อความ และสุขภาพบริการแบบเรียลไทม์",
    icon: "mqtt",
  },
  {
    href: "/dashboard/admin/module-cooldowns",
    label: "ปลดล็อค Subscribe",
    dockLabel: "ปลดล็อค",
    description: "จัดการคูลดาวน์การสมัครโมดูลของผู้ใช้",
    icon: "cooldowns",
  },
  {
    href: "/dashboard/admin/module-cards",
    label: "รูปการ์ดระบบ",
    dockLabel: "การ์ด",
    description: "อัปโหลดและจัดการภาพการ์ดบนแดชบอร์ดหลัก",
    icon: "cards",
  },
];

/** ลำดับเมนูทั้งหมดรวมภาพรวม — ใช้เรนเดอร์ dock / แถบเดสก์ท็อป */
export const ADMIN_HUB_MENU_ORDER: AdminHubNavItem[] = [ADMIN_HUB_OVERVIEW, ...ADMIN_HUB_NAV_ITEMS];
