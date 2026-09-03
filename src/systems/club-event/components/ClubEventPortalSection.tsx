"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  clubEventPortalPageBodyClass,
  clubEventPortalPageSubtitleClass,
  clubEventPortalPageTitleClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventPortalSection({
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
      <h2 id={headingId} className={clubEventPortalPageTitleClass}>
        {title}
      </h2>
      <div className={cn(clubEventPortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={clubEventPortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
