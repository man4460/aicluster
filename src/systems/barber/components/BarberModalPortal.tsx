"use client";

import { createPortal } from "react-dom";

/**
 * พอร์ทัลโมดัลโมดูลร้านตัดผมไปยัง `document.body`
 * — `position: fixed` จึงอิง viewport ของอุปกรณ์จริง ไม่ถูกคลุมด้วย overflow/transform ของการ์ดแม่
 */
export function BarberModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}
