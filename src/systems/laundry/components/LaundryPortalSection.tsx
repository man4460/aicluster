"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  laundryPortalPageBodyClass,
  laundryPortalPageSubtitleClass,
  laundryPortalPageTitleClass,
} from "@/systems/laundry/lib/ui-tokens";

export function LaundryPortalSection({
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
      <h2 id={headingId} className={laundryPortalPageTitleClass}>
        {title}
      </h2>
      <div className={cn(laundryPortalPageBodyClass, bodyClassName)}>
        {subtitle ?
          <p className={laundryPortalPageSubtitleClass}>{subtitle}</p>
        : null}
        {children}
      </div>
    </section>
  );
}
