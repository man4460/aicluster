"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  proResumeCardIconTileClass,
  type ProResumeCardTone,
} from "@/systems/pro-resume/lib/card-tones";
import {
  proResumePortalPageBodyClass,
  proResumePortalPageSubtitleClass,
  proResumePortalPageTitleClass,
} from "@/systems/pro-resume/lib/ui-tokens";

export function ProResumePortalSection({
  id,
  title,
  titleId,
  titleIcon,
  titleTone = "sky",
  subtitle,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: string;
  titleId?: string;
  titleIcon?: ReactNode;
  titleTone?: ProResumeCardTone;
  subtitle?: string | null;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined);

  return (
    <section id={id} className={cn("scroll-mt-16", className)} aria-labelledby={headingId}>
      <div className="flex min-w-0 items-center gap-2.5">
        {titleIcon ? (
          <span className={proResumeCardIconTileClass(titleTone, "md")} aria-hidden>
            {titleIcon}
          </span>
        ) : null}
        <h2 id={headingId} className={cn(proResumePortalPageTitleClass, "min-w-0")}>
          {title}
        </h2>
      </div>
      <div className={cn(proResumePortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={proResumePortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
