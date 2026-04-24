"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { isTokenExemptPath } from "@/lib/dashboard/token-policy";

type Props = {
  /** ผ่านการเช็คโทเคน / งวดรายเดือนแล้ว */
  allowDashboard: boolean;
  role: "USER" | "ADMIN";
  children: React.ReactNode;
};

/**
 * ไม่เรนเดอร์เนื้อหาแดชบอร์ดจริงถ้าต้องไป refill — กัน flash ของ children ก่อน useEffect redirect
 * เงื่อนไขต้องตรงกับ useEffect (pathname จาก request เดียวกับ SSR รอบแรก → ไม่ hydrate mismatch)
 */
export function TokenGate({ allowDashboard, role, children }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const redirectStartedRef = useRef(false);

  const mustRedirectToRefill =
    role !== "ADMIN" && !allowDashboard && !isTokenExemptPath(pathname);

  useEffect(() => {
    if (role === "ADMIN") return;
    if (allowDashboard) return;
    if (isTokenExemptPath(pathname)) {
      redirectStartedRef.current = false;
      return;
    }
    if (redirectStartedRef.current) return;
    redirectStartedRef.current = true;
    router.replace("/dashboard/refill");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useRouter() ไม่ stable ใส่ router ใน deps อาจยิง replace วน
  }, [allowDashboard, role, pathname]);

  useEffect(() => {
    if (allowDashboard || role === "ADMIN") {
      redirectStartedRef.current = false;
    }
  }, [allowDashboard, role]);

  if (mustRedirectToRefill) {
    return (
      <div
        className="min-h-0 min-w-0 flex-1 bg-white"
        aria-busy="true"
        aria-label="กำลังเปลี่ยนเส้นทาง"
      />
    );
  }

  return <>{children}</>;
}
