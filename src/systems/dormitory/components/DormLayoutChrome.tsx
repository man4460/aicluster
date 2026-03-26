"use client";

import { usePathname } from "next/navigation";
import { DormModuleHeader } from "./DormModuleHeader";

export function DormLayoutChrome({
  children,
  trialExpiresAtIso,
}: {
  children: React.ReactNode;
  /** โหมดทดลอง — วันหมดอายุ (ISO) */
  trialExpiresAtIso?: string | null;
}) {
  const pathname = usePathname() ?? "";
  return (
    <>
      <DormModuleHeader pathname={pathname} />
      {trialExpiresAtIso ? (
        <div className="app-banner mb-4 rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold">โหมดทดลอง</span> — ข้อมูลในชุดนี้แยกจากข้อมูลจริงหลัง Subscribe
          วันหมดอายุ:{" "}
          {new Date(trialExpiresAtIso).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      ) : null}
      {children}
    </>
  );
}
