"use client";

import type { ReactNode } from "react";
import { PwaInstallGuideModals } from "@/components/pwa/PwaInstallGuideModals";
import { PwaInstallProvider } from "@/components/pwa/pwa-install-context";

/** ห่อแอปทั้งหมด — state ติดตั้งแอปร่วมกัน (เทียบ MelodyWebapp) */
export function PwaInstallShell({ children }: { children: ReactNode }) {
  return (
    <PwaInstallProvider>
      {children}
      <PwaInstallGuideModals />
    </PwaInstallProvider>
  );
}
