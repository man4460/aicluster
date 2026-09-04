"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  proResumePortalPageBodyClass,
  proResumePortalPageSubtitleClass,
  proResumePortalPageTitleClass,
} from "@/systems/pro-resume/lib/ui-tokens";

export function ProResumePortalSection({
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
      <h2 id={headingId} className={proResumePortalPageTitleClass}>
        {title}
      </h2>
      <div className={cn(proResumePortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={proResumePortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
