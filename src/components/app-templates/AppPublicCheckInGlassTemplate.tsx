"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const appPublicCheckInGlassPageClass =
  "relative min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(ellipse_120%_80%_at_60%_-10%,_#ddd6fe_0%,_#ede9fe_30%,_#f5f3ff_60%,_#faf9ff_100%)] px-4 pb-20 pt-8 sm:pt-12";

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
