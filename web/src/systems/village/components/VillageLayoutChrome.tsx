"use client";

import { VillageModuleHeader } from "./VillageModuleHeader";

export function VillageLayoutChrome({
  children,
  trialExpiresAtIso,
}: {
  children: React.ReactNode;
  trialExpiresAtIso?: string | null;
}) {
  return (
    <>
      <VillageModuleHeader />
      {trialExpiresAtIso ? (
        <div className="app-banner mb-4 rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold">โหมดทดลอง</span> — ข้อมูลในชุดนี้แยกจากข้อมูลจริงหลัง Subscribe วันหมดอายุ:{" "}
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
