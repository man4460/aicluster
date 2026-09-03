"use client";

import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { LmsModuleChrome } from "@/systems/lms/components/LmsModuleChrome";

export function LmsModuleShell({
  children,
  schoolName,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  schoolName?: string;
  trialExpiresLabel?: string | null;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 sm:gap-6")}>
      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      ) : null}
      <LmsModuleChrome schoolName={schoolName}>{children}</LmsModuleChrome>
    </div>
  );
}
