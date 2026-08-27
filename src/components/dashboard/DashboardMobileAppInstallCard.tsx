"use client";

import { LandingAndroidInstallGuide } from "@/app/landing/LandingAndroidInstallGuide";
import { cn } from "@/lib/cn";

/** การ์ดติดตั้งแอปมือถือ — หน้าแดชบอร์ดหลักหลังล็อกอิน */
export function DashboardMobileAppInstallCard({ className }: { className?: string }) {
  return (
    <section
      id="download-app"
      className={cn(
        "app-surface scroll-mt-24 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5",
        className,
      )}
    >
      <LandingAndroidInstallGuide variant="section" />
    </section>
  );
}
