"use client";

import type { ButtonHTMLAttributes } from "react";

/** ปุ่มโมดูล drink-pos — กัน hydration mismatch จาก extension (fdprocessedid ฯลฯ) */
export function DrinkPosButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
