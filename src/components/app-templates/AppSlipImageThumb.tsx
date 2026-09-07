"use client";

import { AppImageThumb, type AppImageThumbProps } from "./AppImageThumb";

export type AppSlipImageThumbProps = Omit<AppImageThumbProps, "objectFit">;

/**
 * Template กลาง — รูปย่อสลิป / ใบเสร็จ / หลักฐานโอน
 * กรอบขนาดเดียวกับ AppImageThumb แต่ `object-contain` เห็นรูปครบไม่ตัดขอบ
 */
export function AppSlipImageThumb({
  alt = "สลิป",
  emptyLabel = "ไม่มีสลิป",
  ...props
}: AppSlipImageThumbProps) {
  return <AppImageThumb {...props} alt={alt} emptyLabel={emptyLabel} objectFit="contain" />;
}
