"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { aqCardSurfaceRadiusClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";
import { AppointmentQueueBoardClient } from "@/systems/appointment-queue/components/AppointmentQueueBoardClient";
import { AppointmentQueueScheduleClient } from "@/systems/appointment-queue/components/AppointmentQueueScheduleClient";
import { AppointmentQueueServicesClient } from "@/systems/appointment-queue/components/AppointmentQueueServicesClient";
import { AppointmentQueueSettingsClient } from "@/systems/appointment-queue/components/AppointmentQueueSettingsClient";
import type { AppointmentQueueDashboardDto } from "@/systems/appointment-queue/lib/load-dashboard";
import type { AppointmentQueueServiceRow } from "@/systems/appointment-queue/lib/load-services";

export type AppointmentQueueTabKey = "overview" | "queue" | "schedule" | "services" | "settings";

const TAB_KEYS = new Set<string>(["overview", "queue", "schedule", "services", "settings"]);

function parseTab(raw: string | null): AppointmentQueueTabKey {
  if (raw && TAB_KEYS.has(raw)) return raw as AppointmentQueueTabKey;
  return "overview";
}

/** ลิงก์ไปแท็บตารางเวลา — วางคู่ปุ่มจัดการคิวบนการ์ดคิววันนี้ */
export function AppointmentQueueScheduleLink({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard/appointment-queue?tab=schedule"
      aria-label="ตารางเวลา"
      className={cn(
        appTemplateOutlineButtonClass,
        "min-h-[40px] min-w-[40px] rounded-xl sm:min-w-0 sm:px-4",
        className,
      )}
    >
      <svg
        className="h-5 w-5 sm:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </svg>
      <span className="hidden sm:inline">ตารางเวลา</span>
    </Link>
  );
}

type HubInnerProps = {
  initialDateKey: string;
  ownerId: string;
  trialSessionId: string;
  initialBoard: AppointmentQueueDashboardDto;
  initialServices: AppointmentQueueServiceRow[];
  settingsInitial: React.ComponentProps<typeof AppointmentQueueSettingsClient>["initial"];
  children: React.ReactNode;
};

function AppointmentQueueDashboardHubTabs({
  initialDateKey,
  ownerId,
  trialSessionId,
  initialBoard,
  initialServices,
  settingsInitial,
  children,
}: HubInnerProps) {
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <AppointmentQueueBoardClient
          ownerId={ownerId}
          trialSessionId={trialSessionId}
          initial={initialBoard}
          services={initialServices}
        />
      ) : null}
      {tab === "schedule" ? (
        <AppointmentQueueScheduleClient embedded initialDateKey={initialDateKey} />
      ) : null}
      {tab === "services" ? (
        <AppointmentQueueServicesClient embedded initial={initialServices} />
      ) : null}
      {tab === "settings" ? (
        <AppointmentQueueSettingsClient initial={settingsInitial} />
      ) : null}
    </div>
  );
}

function HubTabsFallback() {
  return (
    <div className="space-y-4" aria-busy>
      <div className={cn("h-16 animate-pulse bg-white/25", aqCardSurfaceRadiusClass)} />
    </div>
  );
}

export function AppointmentQueueDashboardHubClient(props: HubInnerProps) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <AppointmentQueueDashboardHubTabs {...props} />
    </Suspense>
  );
}
