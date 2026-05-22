import type { Metadata } from "next";
import Link from "next/link";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ParkingAddSpotForm } from "@/systems/parking/components/ParkingAddSpotForm";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { publicParkingCheckInUrl } from "@/systems/parking/lib/public-checkin-url";
import { loadParkingSpotsWithActive } from "@/systems/parking/lib/load-dashboard";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { ParkingSpotsGridList } from "@/systems/parking/components/ParkingSpotsGridList";
import { parkingValetInnerCardClass } from "@/systems/parking/parking-ui-tokens";

export const metadata: Metadata = {
  title: "จัดการช่องจอด | บริการรับฝากจอดรถ",
};

const backLinkClass = cn(
  appTemplateOutlineButtonClass,
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
);

export default async function ParkingSpotsPage() {
  const { site } = await requireParkingPage();
  const spots = await loadParkingSpotsWithActive(site.id);

  return (
    <ParkingPageStack>
      <ParkingPanelCard
        title="จัดการช่องจอด"
        description="เพิ่มช่อง แก้ลิงก์ QR หรือเช็คอินฝั่งพนักงานได้ที่รายละเอียดแต่ละช่อง"
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
        <div className={parkingValetInnerCardClass}>
          <h3 className="text-sm font-black tracking-tight text-[#1e1b4b]">เพิ่มช่องใหม่</h3>
          <div className="mt-3">
            <ParkingAddSpotForm />
          </div>
        </div>
      </ParkingPanelCard>

      <ParkingPanelCard
        title="รายการช่อง"
        description="ลิงก์ลูกค้าเช็คอิน · สถานะจอด · มือถือ 1 คอลัมน์ · เดสก์ท็อป 2 คอลัมน์"
      >
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
      </ParkingPanelCard>
    </ParkingPageStack>
  );
}
