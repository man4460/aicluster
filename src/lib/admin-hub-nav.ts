/** รายการแท็บในศูนย์แอดมิน — ลำดับ = ลำดับในแถบเมนู */
export type AdminHubNavItem = {
  href: string;
  label: string;
};

export const ADMIN_HUB_NAV_ITEMS: AdminHubNavItem[] = [
  { href: "/dashboard/admin/users", label: "จัดการผู้ใช้" },
  { href: "/dashboard/admin/activity-logs", label: "ความเคลื่อนไหวระบบ" },
  { href: "/dashboard/admin/mqtt", label: "สถานะ MQTT" },
  { href: "/dashboard/admin/module-cooldowns", label: "ปลดล็อค Subscribe" },
  { href: "/dashboard/admin/module-cards", label: "รูปการ์ดระบบ" },
];
