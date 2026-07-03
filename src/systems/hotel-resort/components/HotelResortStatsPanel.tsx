"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  hotelResortGradientTitleClass,
  hotelResortStatsDividerClass,
  hotelResortStatsHeaderClass,
  hotelResortStatsShellClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

export function HotelResortStatsPanel({
  title,
  children,
  className,
  gridClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  gridClassName?: string;
}) {
  return (
    <section aria-label={title} className={cn(hotelResortStatsShellClass, className)}>
      <div className="flex items-center gap-3">
        <h2 className={cn(hotelResortStatsHeaderClass, hotelResortGradientTitleClass)}>{title}</h2>
        <div className={hotelResortStatsDividerClass} aria-hidden />
      </div>
      <ul className={cn("list-none p-0", gridClassName)}>{children}</ul>
    </section>
  );
}
