import { DashboardPagesShell } from "@/components/dashboard/DashboardPagesShell";

/**
 * ความกว้างและ padding เท่ากันทุกหน้าใต้ /dashboard/*
 * ใช้ flex เพื่อให้หน้าแชทขยายความสูงได้
 * หน้า `/dashboard/barber/staff` — ไม่มี gutter ชั้นนอก (เต็มพื้นที่โหมด kiosk)
 */
export default function DashboardPagesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardPagesShell>{children}</DashboardPagesShell>;
}
