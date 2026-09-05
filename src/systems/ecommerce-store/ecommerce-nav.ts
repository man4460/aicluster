export type EcommerceNavSection = "dashboard" | "settings" | "products" | "customers";

export function deriveEcommerceSection(pathname: string): EcommerceNavSection {
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/products")) return "products";
  if (pathname.includes("/customers")) return "customers";
  return "dashboard";
}

export const ECOMMERCE_NAV_LINKS: {
  href: string;
  section: EcommerceNavSection;
  label: string;
}[] = [
  { href: "/dashboard/ecommerce-store", section: "dashboard", label: "แดชบอร์ด" },
  { href: "/dashboard/ecommerce-store/products", section: "products", label: "สินค้า" },
  { href: "/dashboard/ecommerce-store/customers", section: "customers", label: "ลูกค้า" },
  { href: "/dashboard/ecommerce-store/settings", section: "settings", label: "ตั้งค่า" },
];
