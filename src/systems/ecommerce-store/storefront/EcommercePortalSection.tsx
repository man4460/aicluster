"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ecommerceStorePortalPageBodyClass,
  ecommerceStorePortalPageSubtitleClass,
  ecommerceStorePortalPageTitleClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

export function EcommercePortalSection({
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
      <h2 id={headingId} className={ecommerceStorePortalPageTitleClass}>
        {title}
      </h2>
      <div className={cn(ecommerceStorePortalPageBodyClass, bodyClassName)}>
        {subtitle ? <p className={ecommerceStorePortalPageSubtitleClass}>{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}
