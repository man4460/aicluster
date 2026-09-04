"use client";

import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { ProResumeModuleChrome } from "@/systems/pro-resume/components/ProResumeModuleChrome";

export function ProResumeModuleShell({
  children,
  displayName,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  displayName?: string;
  trialExpiresLabel?: string | null;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 sm:gap-6")}>
      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง
        </TrialSandboxStrip>
      ) : null}
      <ProResumeModuleChrome displayName={displayName}>{children}</ProResumeModuleChrome>
    </div>
  );
}
