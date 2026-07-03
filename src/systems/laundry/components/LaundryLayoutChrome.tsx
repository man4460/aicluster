"use client";



import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";

import { LaundryModuleChrome } from "@/systems/laundry/components/LaundryModuleChrome";



/** Chrome ชั้นโมดูล — แถบทดลอง + หัวเมนู + dock */

export function LaundryLayoutChrome({

  children,

  trialExpiresLabel,

}: {

  children: React.ReactNode;

  trialExpiresLabel: string | null;

}) {

  return (

    <LaundryModuleChrome>

      {trialExpiresLabel ?

        <TrialSandboxStrip>

          ทดลอง · หมด {trialExpiresLabel} · ข้อมูลแยกจากจริง

        </TrialSandboxStrip>

      : null}

      {children}

    </LaundryModuleChrome>

  );

}

