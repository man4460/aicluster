"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";

/** หัวการ์ดคลิกแล้วขยายเนื้อหา — ใช้หน้าช่องจอด (พนักงาน / QR ลูกค้า) */
export function ParkingExpandableDashboardSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reactId = useId();
  const panelId = `parking-expand-panel-${reactId}`;
  const headingId = `parking-expand-h-${reactId}`;

  return (
    <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
      <button
        type="button"
        className={cn(
          "flex w-full rounded-[1.25rem] border border-white/45 bg-white/25 px-4 py-3 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)] backdrop-blur-md transition hover:bg-white/35 sm:px-5 sm:py-3.5",
        )}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={headingId}
        onClick={() => setOpen((v) => !v)}
      >
        <AppSectionHeader
          tone="slate"
          title={title}
          titleId={headingId}
          description={description}
          className="pointer-events-none flex w-full min-w-0 flex-row items-start justify-between gap-3 sm:items-center"
          action={
            <svg
              className={cn(
                "h-5 w-5 shrink-0 text-[#4d47b6] transition-transform duration-200",
                open ? "rotate-180" : "rotate-0",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          actionWrapClassName="pointer-events-none shrink-0 self-start pt-0.5 sm:pt-0"
        />
      </button>

      {open ? (
        <div id={panelId} role="region" aria-labelledby={headingId}>
          {children}
        </div>
      ) : null}
    </AppDashboardSection>
  );
}
