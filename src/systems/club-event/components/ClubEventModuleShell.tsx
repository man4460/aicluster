"use client";

import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { ClubEventModuleChrome } from "@/systems/club-event/components/ClubEventModuleChrome";

export function ClubEventModuleShell({
  children,
  clubName,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  clubName?: string;
  trialExpiresLabel?: string | null;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 sm:gap-6")}>
      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      ) : null}
      <ClubEventModuleChrome clubName={clubName}>{children}</ClubEventModuleChrome>
    </div>
  );
}
