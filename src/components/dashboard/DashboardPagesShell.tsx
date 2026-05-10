"use client";

import { usePathname } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { cn } from "@/lib/cn";

/** ต้องตรงกับ BarberModuleShell / LaundryModuleShell — kiosk เต็มจอ */
const BARBER_STAFF_KIOSK_PATH = "/dashboard/barber/staff";
const LAUNDRY_STAFF_KIOSK_PATH = "/dashboard/laundry/staff";

export function DashboardPagesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const staffKiosk = pathname === BARBER_STAFF_KIOSK_PATH || pathname === LAUNDRY_STAFF_KIOSK_PATH;
  /** โมดูลร้านตัดผม — ลดขอบซ้ายขวาบนมือถือ (ไม่ซ้ำกับ Shell ชั้นนอก) */
  const barberModule =
    !staffKiosk && (pathname === "/dashboard/barber" || pathname.startsWith("/dashboard/barber/"));
  /** รับฝากซักผ้า — gutter เดียวกับบาร์เบอร์ */
  const laundryModule =
    !staffKiosk && (pathname === "/dashboard/laundry" || pathname.startsWith("/dashboard/laundry/"));
  /** บริการรับฝากจอดรถ — gutter เดียวกับบาร์เบอร์ (โมดูลมีเมนูล่าง — ไม่ซ้ำ padding ชั้นใน) */
  const parkingModule =
    pathname === "/dashboard/parking" || pathname.startsWith("/dashboard/parking/");

  return (
    <PageContainer
      size={staffKiosk ? "full" : "default"}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        staffKiosk && "!mx-0 !max-w-none !w-full !px-0 !py-0",
        (barberModule || laundryModule || parkingModule) && "max-md:!px-3 sm:!px-6",
      )}
    >
      {children}
    </PageContainer>
  );
}
