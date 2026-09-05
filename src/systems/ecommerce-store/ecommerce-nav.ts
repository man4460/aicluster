export type EcommerceNavSection = "dashboard" | "finance" | "settings" | "manage";

export function deriveEcommerceSection(pathname: string): EcommerceNavSection {
  if (pathname.includes("/finance")) return "finance";
  if (pathname.includes("/settings")) return "settings";
  if (
    pathname.includes("/manage") ||
    pathname.includes("/products") ||
    pathname.includes("/customers")
  ) {
    return "manage";
  }
  return "dashboard";
}

export const ECOMMERCE_NAV_LINKS: {
  href: string;
  section: EcommerceNavSection;
  label: string;
}[] = [
  { href: "/dashboard/ecommerce-store", section: "dashboard", label: "แดชบอร์ด" },
  { href: "/dashboard/ecommerce-store/finance", section: "finance", label: "การเงิน" },
  { href: "/dashboard/ecommerce-store/manage", section: "manage", label: "การจัดการ" },
  { href: "/dashboard/ecommerce-store/settings", section: "settings", label: "ตั้งค่า" },
];
