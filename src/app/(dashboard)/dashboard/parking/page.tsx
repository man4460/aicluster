import type { Metadata } from "next";
import Link from "next/link";
import {
  AppDashboardSection,
  AppSectionHeader,
  AppEmptyState,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  parkingSpotTile,
  parkingSpotTileOccupied,
} from "@/systems/parking/parking-ui";
import { loadParkingSessionStats, loadParkingSpotsWithActive } from "@/systems/parking/lib/load-dashboard";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "บริการรับฝากจอดรถ | MAWELL",
};

export default async function ParkingDashboardPage() {
  const { site } = await requireParkingPage();
  const spots = await loadParkingSpotsWithActive(site.id);
  const stats = await loadParkingSessionStats(site.id);

  const modeTh = site.pricingMode === "DAILY" ? "เหมารายวัน" : "รายชั่วโมง";
  const rateTh =
    site.pricingMode === "DAILY"
      ? site.dailyRateBaht != null
        ? `${Number(site.dailyRateBaht).toLocaleString("th-TH")} บาท/วัน`
        : "ยังไม่ตั้งราคา"
      : site.hourlyRateBaht != null
        ? `${Number(site.hourlyRateBaht).toLocaleString("th-TH")} บาท/ชม.`
        : "ยังไม่ตั้งราคา";

  return (
    <div className="space-y-6">
      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="ภาพรวมลาน"
          description={`${modeTh} · ${rateTh} · ลูกค้าเช็คอินด้วย QR ต่อช่อง`}
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/parking/settings"
                aria-label="ตั้งค่าลานจอด"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:px-4 sm:text-sm",
                )}
              >
                ตั้งค่า
              </Link>
              <Link
                href="/dashboard/parking/spots"
                aria-label="จัดการช่องจอด"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:px-4 sm:text-sm",
                )}
              >
                ช่องจอด
              </Link>
              <Link
                href="/dashboard/parking/history"
                aria-label="ประวัติการใช้บริการ"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:px-4 sm:text-sm",
                )}
              >
                ประวัติ
              </Link>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-slate-200/40">
            <p className="text-xs font-semibold text-[#66638c]">กำลังจอด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#1e1b4b]">{stats.activeCount}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-slate-200/40">
            <p className="text-xs font-semibold text-[#66638c]">ช่องทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#1e1b4b]">{spots.length}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-slate-200/40">
            <p className="text-xs font-semibold text-[#66638c]">เช็คเอาต์วันนี้ (Bangkok)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{stats.todayCompleted}</p>
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          title="ช่องจอด"
          description="คลิกช่องเพื่อเปิด QR เช็คอิน หรือจัดการเช็คอิน / เช็คเอาต์ฝั่งพนักงาน"
        />

        {spots.length === 0 ? (
          <AppEmptyState>
            ยังไม่มีช่องจอด — เพิ่มได้ที่เมนูช่องจอดหรือตั้งค่าลาน
          </AppEmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {spots.map((s) => {
              const active = s.sessions[0];
              const occupied = Boolean(active);
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/parking/spots/${s.id}`}
                    className={`${parkingSpotTile} ${occupied ? parkingSpotTileOccupied : ""}`}
                  >
                    <p className="text-center text-xl font-bold tabular-nums text-slate-900 group-hover:text-emerald-800">
                      {s.spotCode}
                    </p>
                    {s.zoneLabel ? (
                      <p className="mt-1 text-center text-[11px] text-[#66638c]">{s.zoneLabel}</p>
                    ) : null}
                    <div className="mt-2 flex flex-1 flex-col items-center justify-end gap-1 border-t border-slate-200/60 pt-2">
                      {occupied ? (
                        <>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-200">
                            มีรถจอด
                          </span>
                          <span className="text-center text-[11px] font-semibold tabular-nums text-slate-800">
                            {active!.licensePlate}
                          </span>
                          <span className="text-[10px] text-[#66638c]">
                            {active!.selfCheckIn ? "เช็คอินเอง" : "พนักงาน"}
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                          ว่าง
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}
