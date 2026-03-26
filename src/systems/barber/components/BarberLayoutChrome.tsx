"use client";

import { usePathname } from "next/navigation";
import { BarberModuleHeader } from "./BarberModuleHeader";

export function BarberLayoutChrome({
  children,
  trialExpiresAtIso,
}: {
  children: React.ReactNode;
  trialExpiresAtIso?: string | null;
}) {
  const pathname = usePathname() ?? "";
  return (
    <>
      <BarberModuleHeader pathname={pathname} />
      {trialExpiresAtIso ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">โหมดทดลอง</span> — ข้อมูลในชุดนี้แยกจากข้อมูลจริงหลัง Subscribe
          วันหมดอายุ:{" "}
          {new Date(trialExpiresAtIso).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" · "}
          ดาวน์โหลด PDF/PNG โปสเตอร์ QR ถูกปิดในโหมดทดลอง
        </div>
      ) : null}
      {children}
    </>
  );
}
