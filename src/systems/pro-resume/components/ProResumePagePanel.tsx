"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  proResumeCardIconTileClass,
  type ProResumeCardTone,
} from "@/systems/pro-resume/lib/card-tones";
import {
  proResumePanelClass,
  proResumePanelDividerClass,
  proResumePanelSectionClass,
} from "@/systems/pro-resume/lib/ui-tokens";

export function ProResumePagePanel({
  title,
  titleIcon,
  titleTone = "sky",
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  titleIcon?: ReactNode;
  titleTone?: ProResumeCardTone;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(proResumePanelClass, className)}>
      <div className={cn(proResumePanelSectionClass, "print:hidden")}>
        <div className="flex flex-row items-start justify-between gap-3 sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            {titleIcon ? (
              <span className={proResumeCardIconTileClass(titleTone)} aria-hidden>
                {titleIcon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
              {subtitle ? (
                <p className="mt-0.5 hidden text-xs font-medium text-[#66638c] sm:block">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {action ? (
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">{action}</div>
          ) : null}
        </div>
      </div>
      {children ? (
        <>
          <div className={proResumePanelDividerClass} />
          <div className={cn(proResumePanelSectionClass, "min-w-0 space-y-4")}>{children}</div>
        </>
      ) : null}
    </div>
  );
}
