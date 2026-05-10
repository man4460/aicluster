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
import { ParkingStatCard } from "@/systems/parking/components/ParkingStatCard";
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
                title="ตั้งค่า"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:min-w-0 sm:px-4 sm:text-sm",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5 sm:hidden"
                  aria-hidden
                >
                  <path
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .65.37 1.25.97 1.55z"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="hidden sm:inline">ตั้งค่า</span>
              </Link>
              <Link
                href="/dashboard/parking/spots"
                aria-label="จัดการช่องจอด"
                title="ช่องจอด"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:min-w-0 sm:px-4 sm:text-sm",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5 sm:hidden"
                  aria-hidden
                >
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">ช่องจอด</span>
              </Link>
              <Link
                href="/dashboard/parking/history"
                aria-label="ประวัติการใช้บริการ"
                title="ประวัติ"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-3 text-xs font-semibold sm:min-h-[42px] sm:min-w-0 sm:px-4 sm:text-sm",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5 sm:hidden"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">ประวัติ</span>
              </Link>
            </div>
          }
        />

        <div className="space-y-3 border-t border-slate-200/70 pt-4">
          <div className="flex items-center justify-between px-0.5 sm:px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สถิติลาน</h3>
            <div className="ml-4 h-px flex-1 bg-slate-200/90" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <ParkingStatCard
              title="กำลังจอด"
              value={stats.activeCount.toLocaleString("en-US")}
              tone="indigo"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />
            <ParkingStatCard
              title="ช่องทั้งหมด"
              value={spots.length.toLocaleString("en-US")}
              tone="slate"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeLinejoin="round" />
                </svg>
              }
            />
            <ParkingStatCard
              title="เช็คเอาต์วันนี้"
              value={stats.todayCompleted.toLocaleString("en-US")}
              tone="emerald"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
              }
            />
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
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {spots.map((s) => {
              const active = s.sessions[0];
              const occupied = Boolean(active);
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/parking/spots/${s.id}`}
                    className={`${parkingSpotTile} ${occupied ? parkingSpotTileOccupied : ""}`}
                  >
                    <p className="text-center text-xl font-bold tabular-nums text-[#1e1b4b] group-hover:text-[#5b61ff]">
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
