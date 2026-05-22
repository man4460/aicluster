export type SmartPoliceMainKey = "overview" | "cases" | "templates" | "reports" | "settings";

export const smartPoliceMainMenuItems: {
  key: SmartPoliceMainKey;
  href: string;
  label: string;
  includes?: readonly string[];
}[] = [
  { key: "overview", href: "/dashboard/smart-police", label: "ภาพรวม" },
  {
    key: "cases",
    href: "/dashboard/smart-police/cases",
    label: "คดี",
    includes: ["/dashboard/smart-police/cases"],
  },
  { key: "templates", href: "/dashboard/smart-police/templates", label: "แม่แบบ" },
  { key: "reports", href: "/dashboard/smart-police/reports", label: "รายงาน" },
  {
    key: "settings",
    href: "/dashboard/smart-police/settings",
    label: "ตั้งค่า",
    includes: ["/dashboard/smart-police/settings"],
  },
];

export function smartPoliceMainKeyFromPathname(pathname: string): SmartPoliceMainKey {
  if (pathname.startsWith("/dashboard/smart-police/cases")) return "cases";
  if (pathname.startsWith("/dashboard/smart-police/templates")) return "templates";
  if (pathname.startsWith("/dashboard/smart-police/reports")) return "reports";
  if (pathname.startsWith("/dashboard/smart-police/settings")) return "settings";
  return "overview";
}
