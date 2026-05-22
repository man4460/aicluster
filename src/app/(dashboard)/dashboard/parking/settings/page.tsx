import type { Metadata } from "next";
import Link from "next/link";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingSiteSettingsForm } from "@/systems/parking/components/ParkingSiteSettingsForm";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่าลานจอด | บริการรับฝากจอดรถ",
};

const backLinkClass = cn(
  appTemplateOutlineButtonClass,
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
);

export default async function ParkingSettingsPage() {
  const { site } = await requireParkingPage();

  return (
    <ParkingPageStack>
      <ParkingPanelCard
        title="ตั้งค่าลานจอด"
        description="ชื่อลาน โหมดคิดเงิน และราคา — ใช้ตั้งแต่เช็คอินถัดไป"
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={
          <Link href="/dashboard/parking" aria-label="กลับภาพรวมลานจอด" className={backLinkClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 sm:hidden" aria-hidden>
              <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
            </svg>
            <span className="hidden sm:inline">← ภาพรวม</span>
          </Link>
        }
      >
        <ParkingSiteSettingsForm
          initialName={site.name}
          initialMode={site.pricingMode}
          initialHourly={site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null}
          initialDaily={site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null}
        />
      </ParkingPanelCard>
    </ParkingPageStack>
  );
}
