"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ClubEventPortalSectionTitleIcon,
  type ClubPortalSectionIconKey,
} from "@/systems/club-event/lib/portal-section-icons";
import {
  clubEventPortalPageBodyClass,
  clubEventPortalPageSubtitleClass,
  clubEventPortalPageTitleClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventPortalSection({
  id,
  title,
  titleId,
  titleIcon,
  subtitle,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: string;
  titleId?: string;
  /** ไอคอนหัวข้อ — ชื่อคีย์หรือ ReactNode */
  titleIcon?: ClubPortalSectionIconKey | ReactNode;
  subtitle?: string | null;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined);
  const iconNode =
    typeof titleIcon === "string" ? (
      <ClubEventPortalSectionTitleIcon name={titleIcon} />
    ) : (
      titleIcon
    );

  return (
    <section id={id} className={cn("scroll-mt-16", className)} aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={cn(clubEventPortalPageTitleClass, "flex items-center gap-2.5 sm:gap-3")}
      >
        {iconNode ?? null}
        <span className="min-w-0">{title}</span>
      </h2>
      <div className={cn(clubEventPortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={clubEventPortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
