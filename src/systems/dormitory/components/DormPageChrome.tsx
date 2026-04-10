"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** คอลัมน์หลักของหน้า — ระยะห่างเดียวกับโมดูลหมู่บ้าน */
export function DormPageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-full space-y-4 sm:space-y-6", className)}>{children}</div>;
}

/** การ์ดเนื้อหา — โทนเดียวกับ VillagePanelCard / app-surface */
export function DormPanelCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasHead = Boolean(title || description || action);
  return (
    <div className={cn("app-surface p-4 sm:p-5", className)}>
      {hasHead ? (
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold tracking-tight text-[#2e2a58]">{title}</h2> : null}
            {description ? <div className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function DormEmptyDashed({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c]">
      {children}
    </div>
  );
}
