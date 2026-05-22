"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { parkingValetInnerCardClass } from "@/systems/parking/parking-ui-tokens";

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
    <ParkingPanelCard className="gap-3">
      <button
        type="button"
        className={cn(
          parkingValetInnerCardClass,
          "flex w-full px-4 py-3 text-left transition hover:bg-white/60 sm:px-5 sm:py-3.5",
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
                "h-5 w-5 shrink-0 text-[#5b61ff] transition-transform duration-200",
                open ? "rotate-180" : "rotate-0",
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
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
    </ParkingPanelCard>
  );
}
