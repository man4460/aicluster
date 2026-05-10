import type { Metadata } from "next";
import Link from "next/link";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingSiteSettingsForm } from "@/systems/parking/components/ParkingSiteSettingsForm";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่าลานจอด | บริการรับฝากจอดรถ",
};

export default async function ParkingSettingsPage() {
  const { site } = await requireParkingPage();

  return (
    <div className="space-y-6">
      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="ตั้งค่าลานจอด"
          description="ชื่อลาน โหมดคิดเงิน และราคา — ใช้ตั้งแต่เช็คอินถัดไป"
          action={
            <Link
              href="/dashboard/parking"
              aria-label="กลับภาพรวมลานจอด"
              title="ภาพรวม"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-4 text-sm font-semibold sm:min-w-0",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="h-5 w-5 sm:hidden"
                aria-hidden
              >
                <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
              </svg>
              <span className="hidden sm:inline">← ภาพรวม</span>
            </Link>
          }
        />
        <ParkingSiteSettingsForm
          initialName={site.name}
          initialMode={site.pricingMode}
          initialHourly={site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null}
          initialDaily={site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null}
        />
      </AppDashboardSection>
    </div>
  );
}
