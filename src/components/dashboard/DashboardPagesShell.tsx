"use client";

import { usePathname } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/cn";
import { isChatAiDashboardPath } from "@/lib/dashboard/chat-ai-href";

/** ต้องตรงกับ BarberModuleShell / LaundryModuleShell — kiosk เต็มจอ */
const BARBER_STAFF_KIOSK_PATH = "/dashboard/barber/staff";
const MASSAGE_STAFF_KIOSK_PATH = "/dashboard/massage/staff";
const LAUNDRY_STAFF_KIOSK_PATH = "/dashboard/laundry/staff";

export function DashboardPagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const staffKiosk =
    pathname === BARBER_STAFF_KIOSK_PATH ||
    pathname === LAUNDRY_STAFF_KIOSK_PATH ||
    pathname === MASSAGE_STAFF_KIOSK_PATH;
  const dashboardHome = pathname === "/dashboard";
  /** โมดูลร้านตัดผม — ลดขอบซ้ายขวาบนมือถือ (ไม่ซ้ำกับ Shell ชั้นนอก) */
  const barberModule =
    !staffKiosk && (pathname === "/dashboard/barber" || pathname.startsWith("/dashboard/barber/"));
  /** รับฝากซักผ้า — gutter เดียวกับบาร์เบอร์ */
  const laundryModule =
    !staffKiosk && (pathname === "/dashboard/laundry" || pathname.startsWith("/dashboard/laundry/"));
  const massageModule =
    !staffKiosk && (pathname === "/dashboard/massage" || pathname.startsWith("/dashboard/massage/"));
  /** บริการรับฝากจอดรถ — gutter เดียวกับบาร์เบอร์ (โมดูลมีเมนูล่าง — ไม่ซ้ำ padding ชั้นใน) */
  const parkingModule =
    pathname === "/dashboard/parking" || pathname.startsWith("/dashboard/parking/");
  const dashboardModules = pathname === "/dashboard/modules" || pathname.startsWith("/dashboard/modules/");
  const footballTurfModule =
    pathname === "/dashboard/football-turf" || pathname.startsWith("/dashboard/football-turf/");
  /** POS ร้านเครื่องดื่ม — ความกว้าง/ขอบซ้ายขวาเดียวกับสนามฟุตบอล */
  const drinkPosModule =
    pathname === "/dashboard/drink-pos" || pathname.startsWith("/dashboard/drink-pos/");
  /** POS ร้านอาหาร — ชุด gutter เดียวกับ drink-pos / สนามฟุตบอล */
  const buildingPosModule =
    pathname === "/dashboard/building-pos" || pathname.startsWith("/dashboard/building-pos/");
  /** ศูนย์แอดมิน — กว้างเต็มเหมือนสนามฟุตบอล (ไม่จำกัด max-w-6xl) */
  const adminHub =
    pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
  const basicWidePages =
    pathname === "/dashboard" ||
    pathname === "/dashboard/modules" ||
    pathname.startsWith("/dashboard/modules/") ||
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/") ||
    pathname === "/dashboard/plans" ||
    pathname.startsWith("/dashboard/plans/") ||
    pathname === "/dashboard/chat" ||
    pathname.startsWith("/dashboard/chat/") ||
    isChatAiDashboardPath(pathname);

  return (
    <PageContainer
      size={
        staffKiosk ||
        footballTurfModule ||
        drinkPosModule ||
        buildingPosModule ||
        adminHub ||
        basicWidePages
          ? "full"
          : "default"
      }
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        staffKiosk && "!mx-0 !max-w-none !w-full !px-0 !py-0",
        basicWidePages && "max-w-[1680px] lg:!px-8",
        (footballTurfModule || drinkPosModule || buildingPosModule || adminHub) &&
          "max-w-none !px-3 sm:!px-4 lg:!px-6",
        (barberModule || laundryModule || massageModule || parkingModule) && "max-md:!px-3 sm:!px-6",
      )}
    >
      {children}
    </PageContainer>
  );
}
