"use client";

import type { ReactNode } from "react";
import { PwaInstallProvider } from "@/components/pwa/pwa-install-context";

/** ห่อแอป — ไม่โชว์คู่มือ Add to Home Screen (ใช้ Capacitor APK แทน) */
export function PwaInstallShell({ children }: { children: ReactNode }) {
  return <PwaInstallProvider>{children}</PwaInstallProvider>;
}
