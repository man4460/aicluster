"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ClubEventPortalSectionTitleIcon,
  isClubPortalSectionIconKey,
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
  headerAction,
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
  /** เนื้อหาด้านขวาของหัวข้อ (เช่น ปุ่มลิงก์) */
  headerAction?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined);
  const iconNode =
    typeof titleIcon === "string" && isClubPortalSectionIconKey(titleIcon) ? (
      <ClubEventPortalSectionTitleIcon name={titleIcon} />
    ) : typeof titleIcon === "string" ? null : (
      titleIcon
    );

  const hasBody =
    Boolean(subtitle) || (children !== undefined && children !== null && children !== false);

  return (
    <section id={id} className={cn("scroll-mt-16", className)} aria-labelledby={headingId}>
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <h2
          id={headingId}
          className={cn(clubEventPortalPageTitleClass, "flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3")}
        >
          {iconNode ?? null}
          <span className="min-w-0">{title}</span>
        </h2>
        {headerAction ? (
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 sm:pt-0.5">
            {headerAction}
          </div>
        ) : null}
      </div>
      {hasBody ? (
        <div className={cn(clubEventPortalPageBodyClass, bodyClassName)}>
          {subtitle ? <p className={clubEventPortalPageSubtitleClass}>{subtitle}</p> : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}
