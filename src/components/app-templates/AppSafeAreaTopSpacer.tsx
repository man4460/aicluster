import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { appSafeAreaTopSpacerClass } from "@/components/app-templates/safe-area-tokens";

/**
 * แถบเว้นส่วนหัวสถานะมือถือ (เวลา · แบต · ไวไฟ)
 * วางเป็นลูกแรกของ sticky / fixed / absolute header
 */
export function AppSafeAreaTopSpacer({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(appSafeAreaTopSpacerClass, className)} aria-hidden>
      {children}
    </div>
  );
}
