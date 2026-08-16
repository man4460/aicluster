"use client";

import { usePathname } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/cn";
import { isChatAiDashboardPath } from "@/lib/dashboard/chat-ai-href";

/** ต้องตรงกับ BarberModuleShell / LaundryModuleShell — kiosk เต็มจอ */
const BARBER_STAFF_KIOSK_PATH = "/dashboard/barber/staff";
const MASSAGE_STAFF_KIOSK_PATH = "/dashboard/massage/staff";
const LAUNDRY_STAFF_KIOSK_PATH = "/dashboard/laundry/staff";

/** รายชื่อ path หน้าโมดูลงานที่ต้องการเต็มจอ (เหมือนโรงแรม / สนามฟุตบอล / ร้านเครื่องดื่ม) — MASTER.md §11 */
const STAFF_KIOSK_PATHS = [
  BARBER_STAFF_KIOSK_PATH,
  MASSAGE_STAFF_KIOSK_PATH,
  LAUNDRY_STAFF_KIOSK_PATH,
] as const;

/** Module paths ที่ขยายเต็มความกว้างหน้าจอ (size=full + max-w-none + !px-0) */
const WIDE_MODULE_PREFIXES = [
  "/dashboard/football-turf",
  "/dashboard/drink-pos",
  "/dashboard/building-pos",
  "/dashboard/hotel-resort",
  "/dashboard/barber",
  "/dashboard/admin",
  "/dashboard/car-wash",
  "/dashboard/laundry",
  "/dashboard/massage",
  "/dashboard/spa",
  "/dashboard/rental",
  "/dashboard/refill",
  "/dashboard/loan",
  "/dashboard/mqtt-service",
  "/dashboard/line-integration",
  "/dashboard/coop",
  "/dashboard/booking",
  "/dashboard/analytics",
  "/dashboard/community-coop",
  "/dashboard/dormitory",
  "/dashboard/village",
  "/dashboard/ecommerce-store",
  "/dashboard/general-store-pos",
  "/dashboard/school-bank",
  "/dashboard/inventory",
  "/dashboard/asset",
  "/dashboard/doc-transmission",
  "/dashboard/educare",
  "/dashboard/smart-police",
  "/dashboard/parking",
  "/dashboard/media-registry",
  "/dashboard/prompt-library",
  "/dashboard/attendance",
  "/dashboard/loyalty-stamp",
  "/dashboard/appointment-queue",
  "/dashboard/wait-queue",
  "/dashboard/home-finance",
  "/dashboard/vault",
] as const;

/** Module paths ที่มี bottom dock — บังคับ !px-0 (ซ้ำกับ WIDE ได้ — กันพลาด) */
const DOCKED_MODULE_PREFIXES = [
  "/dashboard/laundry",
  "/dashboard/massage",
  "/dashboard/parking",
  "/dashboard/car-wash",
] as const;

const BASIC_WIDE_PATHS = [
  "/dashboard",
  "/dashboard/modules",
  "/dashboard/profile",
  "/dashboard/plans",
  "/dashboard/chat",
] as const;

function pathMatchesPrefixList(pathname: string, list: readonly string[]): boolean {
  return list.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function pathMatchesBasicWide(pathname: string): boolean {
  if (BASIC_WIDE_PATHS.includes(pathname as typeof BASIC_WIDE_PATHS[number])) return true;
  if (pathname === "/dashboard/modules" || pathname.startsWith("/dashboard/modules/")) return true;
  if (pathname.startsWith("/dashboard/profile/")) return true;
  if (pathname.startsWith("/dashboard/plans/")) return true;
  if (pathname.startsWith("/dashboard/chat/")) return true;
  if (isChatAiDashboardPath(pathname)) return true;
  return false;
}

export function DashboardPagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  const staffKiosk = (STAFF_KIOSK_PATHS as readonly string[]).includes(pathname);
  const wideModule = pathMatchesPrefixList(pathname, WIDE_MODULE_PREFIXES);
  const dockedModule = pathMatchesPrefixList(pathname, DOCKED_MODULE_PREFIXES) && !staffKiosk;
  const basicWidePages = pathMatchesBasicWide(pathname);
  const dashboardModules = pathname === "/dashboard/modules" || pathname.startsWith("/dashboard/modules/");
  const dashboardHome = pathname === "/dashboard";

  const drinkPosOrderPage =
    pathname === "/dashboard/drink-pos/order" || pathname.startsWith("/dashboard/drink-pos/order/");
  const buildingPosOrderPage =
    pathname === "/dashboard/building-pos/order" || pathname.startsWith("/dashboard/building-pos/order/");
  const posOrderDesktopFill = drinkPosOrderPage || buildingPosOrderPage;

  return (
    <PageContainer
      size={staffKiosk || wideModule || basicWidePages ? "full" : "default"}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        staffKiosk && "!mx-0 !max-w-none !w-full !px-0 !py-0",
        /**
         * หน้าบ้าน / modules / โปรไฟล์ / แพ็ก / แชท — !px-0 ทุก breakpoint
         * ขอบนอก = DashboardShell เดียวกับแถบ header ม่วง (max-w-[1680px] คอยจำกัดความกว้าง)
         */
        basicWidePages && "max-w-[1680px] !px-0",
        /**
         * โมดูลเต็มความกว้าง — ไม่ซ้อน px กับ DashboardShell
         * (Shell = px-3 sm:px-4 เดียวกับ wrapper ของแถบ header ม่วง)
         */
        wideModule && "max-w-none !px-0",
        dockedModule && "!px-0",
        posOrderDesktopFill && "lg:min-h-0 lg:overflow-hidden lg:!pt-2 lg:!pb-3",
        (dashboardModules || dashboardHome) && "max-w-[1680px]",
      )}
    >
      {children}
    </PageContainer>
  );
}
