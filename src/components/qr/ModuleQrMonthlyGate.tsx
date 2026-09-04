"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ModuleMonthlyUpgradeCta } from "@/components/dashboard/ModuleMonthlyUpgradeCta";
import { cn } from "@/lib/cn";
import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";

type Props = {
  moduleSlug: string;
  children: ReactNode;
  className?: string;
  /** ถ้าส่งมาแล้ว ไม่ต้อง fetch */
  allowed?: boolean;
  title?: string;
};

/**
 * ห่อแผงลิงก์/QR — สายรายวันแสดงล็อก + ปุ่มอัปเกรด · รายเดือน/ฟรีแสดง children
 */
export function ModuleQrMonthlyGate({
  moduleSlug,
  children,
  className,
  allowed: allowedProp,
  title = "ลิงก์ QR",
}: Props) {
  const free = isDailyTokenExemptModuleSlug(moduleSlug);
  const [allowed, setAllowed] = useState<boolean | null>(
    allowedProp !== undefined ? allowedProp : free ? true : null,
  );

  const reload = useCallback(async () => {
    if (free) {
      setAllowed(true);
      return;
    }
    if (allowedProp !== undefined) {
      setAllowed(allowedProp);
      return;
    }
    try {
      const res = await fetch(
        `/api/subscription/qr-access?moduleSlug=${encodeURIComponent(moduleSlug)}`,
        { credentials: "include", cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as { allowed?: boolean };
      setAllowed(res.ok ? Boolean(data.allowed) : false);
    } catch {
      setAllowed(false);
    }
  }, [allowedProp, free, moduleSlug]);

  useEffect(() => {
    if (allowedProp !== undefined) {
      setAllowed(allowedProp);
      return;
    }
    if (free) {
      setAllowed(true);
      return;
    }
    void reload();
  }, [allowedProp, free, reload]);

  if (allowed === null) {
    return (
      <div
        className={cn(
          "rounded-[1.25rem] border border-[#e8e6fc] bg-white/80 px-4 py-8 text-center text-sm font-semibold text-[#66638c]",
          className,
        )}
        aria-busy
      >
        กำลังตรวจสิทธิ์ลิงก์ QR…
      </div>
    );
  }

  if (!allowed) {
    return (
      <ModuleMonthlyUpgradeCta
        moduleSlug={moduleSlug}
        className={className}
        benefit={
          title === "ลิงก์ QR"
            ? "ลิงก์และ QR ใช้ได้เฉพาะแพ็กรายเดือนของโมดูลนี้ — สายรายวันยังไม่เปิดสิทธิ์นี้"
            : `${title} — ใช้ได้เฉพาะแพ็กรายเดือนของโมดูลนี้ · สายรายวันยังไม่เปิดสิทธิ์นี้`
        }
        onUpgraded={() => {
          setAllowed(true);
          void reload();
        }}
      />
    );
  }

  return <>{children}</>;
}
