"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isTokenExemptPath } from "@/lib/dashboard/token-policy";

type Props = {
  /** ผ่านการเช็คโทเคน / งวดรายเดือนแล้ว */
  allowDashboard: boolean;
  role: "USER" | "ADMIN";
  children: React.ReactNode;
};

/**
 * ห้ามซ่อน children บนเซิร์ฟเวอร์แล้วแสดงบนไคลเอนต์ต่างกัน — จะทำให้ React hydration error
 * ใช้ redirect ใน useEffect แทน
 */
export function TokenGate({ allowDashboard, role, children }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    if (role === "ADMIN") return;
    if (allowDashboard) return;
    if (isTokenExemptPath(pathname)) return;
    router.replace("/dashboard/refill");
  }, [allowDashboard, role, pathname, router]);

  return <>{children}</>;
}
