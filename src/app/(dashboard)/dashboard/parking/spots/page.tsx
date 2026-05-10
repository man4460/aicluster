import type { Metadata } from "next";
import Link from "next/link";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingAddSpotForm } from "@/systems/parking/components/ParkingAddSpotForm";
import { publicParkingCheckInUrl } from "@/systems/parking/lib/public-checkin-url";
import { loadParkingSpotsWithActive } from "@/systems/parking/lib/load-dashboard";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { ParkingSpotsGridList } from "@/systems/parking/components/ParkingSpotsGridList";
import { parkingValetCardClass } from "@/systems/parking/parking-valet-ui";

export const metadata: Metadata = {
  title: "จัดการช่องจอด | บริการรับฝากจอดรถ",
};

export default async function ParkingSpotsPage() {
  const { site } = await requireParkingPage();
  const spots = await loadParkingSpotsWithActive(site.id);

  return (
    <div className="space-y-6">
      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="จัดการช่องจอด"
          description="เพิ่มช่อง แก้ลิงก์ QR หรือเช็คอินฝั่งพนักงานได้ที่รายละเอียดแต่ละช่อง"
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
        <div className={parkingValetCardClass}>
          <h2 className="text-sm font-black tracking-tight text-[#1e1b4b]">เพิ่มช่องใหม่</h2>
          <div className="mt-3">
            <ParkingAddSpotForm />
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          title="รายการช่อง"
          description="ลิงก์ลูกค้าเช็คอิน · สถานะจอด · มือถือ 1 คอลัมน์ · เดสก์ท็อป 2 คอลัมน์"
        />
        <ParkingSpotsGridList
          spots={spots.map((s) => {
            const active = s.sessions[0];
            return {
              id: s.id,
              spotCode: s.spotCode,
              zoneLabel: s.zoneLabel,
              checkInUrl: publicParkingCheckInUrl(s.checkInToken),
              activeSession: active
                ? { licensePlate: active.licensePlate, checkInAt: active.checkInAt }
                : null,
            };
          })}
        />
      </AppDashboardSection>
    </div>
  );
}
