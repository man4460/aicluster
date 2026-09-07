"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  appSafeAreaGlassPageBottomPadClass,
  appSafeAreaGlassPageTopPadClass,
} from "./safe-area-tokens";

/**
 * หน้าแก้วสาธารณะ — รวม safe-area บน/ล่างในโทเค็นเดียว
 * พอร์ทัลที่หัว absolute ทับแบนเนอร์: ส่ง `className="!px-0 !pt-0 sm:!px-0"` แล้วเว้นสถานะที่หัวด้วย `appSafeAreaPortalHeaderClass`
 */
export const appPublicCheckInGlassPageClass = cn(
  "relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(ellipse_120%_80%_at_60%_-10%,_#ddd6fe_0%,_#ede9fe_30%,_#f5f3ff_60%,_#faf9ff_100%)] px-3 sm:px-4",
  appSafeAreaGlassPageBottomPadClass,
  appSafeAreaGlassPageTopPadClass,
);

/** พอร์ทัลเต็มจอ (หัว absolute) — ตัด pt ของหน้า */
export const appPublicPortalBleedPageClass = cn(appPublicCheckInGlassPageClass, "!px-0 !pt-0 sm:!px-0");

export const appPublicCheckInGlassCardClass = cn(
  "overflow-hidden rounded-[2rem] border border-white/60",
  "bg-gradient-to-br from-white/65 via-white/45 to-white/30",
  "shadow-[0_20px_48px_-24px_rgba(30,27,75,0.30)] backdrop-blur-xl",
  "ring-1 ring-inset ring-white/60",
);

export function AppPublicCheckInGlassPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(appPublicCheckInGlassPageClass, className)}>
      <div aria-hidden className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-indigo-300/15 blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full bg-violet-200/20 blur-3xl"
      />
      {children}
    </div>
  );
}
