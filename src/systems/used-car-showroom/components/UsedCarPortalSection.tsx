"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  usedCarShowroomPortalPageBodyClass,
  usedCarShowroomPortalPageSubtitleClass,
  usedCarShowroomPortalPageTitleClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";

export function UsedCarPortalSection({
  id,
  title,
  titleId,
  subtitle,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: string;
  titleId?: string;
  subtitle?: string | null;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined);

  return (
    <section id={id} className={cn("scroll-mt-16", className)} aria-labelledby={headingId}>
      <h2 id={headingId} className={usedCarShowroomPortalPageTitleClass}>
        {title}
      </h2>
      <div className={cn(usedCarShowroomPortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={usedCarShowroomPortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
