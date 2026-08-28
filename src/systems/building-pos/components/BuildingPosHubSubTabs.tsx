"use client";

import { Suspense } from "react";

/** แท็บย่อย hub — ปัจจุบันไม่มี (QR ย้ายไปตั้งค่า · การเงิน/เมนูจัดการในหน้าเอง) */
function BuildingPosHubSubTabsInner(_props: {
  variant: "standalone" | "embedded";
  className?: string;
}) {
  return null;
}

export function BuildingPosHubSubTabs(props?: { variant?: "standalone" | "embedded"; className?: string }) {
  const variant = props?.variant ?? "standalone";
  const className = props?.className;
  return (
    <Suspense fallback={null}>
      <BuildingPosHubSubTabsInner variant={variant} className={className} />
    </Suspense>
  );
}
