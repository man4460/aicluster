import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import {
  parkingBtnSecondary,
  parkingCard,
  parkingSpotTile,
  parkingSpotTileOccupied,
} from "@/systems/parking/parking-ui";
import { loadParkingSessionStats, loadParkingSpotsWithActive } from "@/systems/parking/lib/load-dashboard";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ระบบเช่าที่จอดรถ | MAWELL Buffet",
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
    <div className="space-y-8">
      <PageHeader
        title="ระบบเช่าที่จอดรถ"
        description={`ผังช่องจอด · ${site.name} · ${modeTh} · ${rateTh} · ลูกค้าเช็คอินด้วย QR ต่อช่อง`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/parking/settings" className={parkingBtnSecondary}>
              ตั้งราคา / ชื่อลาน
            </Link>
            <Link href="/dashboard/parking/spots" className={parkingBtnSecondary}>
              จัดการช่อง
            </Link>
            <Link href="/dashboard/parking/history" className={parkingBtnSecondary}>
              ประวัติการใช้บริการ
            </Link>
          </div>
        }
      />

      <section className={`${parkingCard} p-5`}>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">สถานการณ์วันนี้</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">กำลังจอด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#0000BF]">{stats.activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">ช่องทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{spots.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">เช็คเอาต์วันนี้ (Bangkok)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{stats.todayCompleted}</p>
          </div>
        </div>
      </section>

      <section className={`${parkingCard} p-5`}>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">ช่องจอด</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          คลิกช่องเพื่อเปิดลิงก์ QR เช็คอิน หรือเช็คอิน/เช็คเอาต์ฝั่งพนักงาน
        </p>
        {spots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            ยังไม่มีช่อง — ไปที่ &quot;จัดการช่อง&quot; เพื่อเพิ่ม
          </p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {spots.map((s) => {
              const active = s.sessions[0];
              const occupied = Boolean(active);
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/parking/spots/${s.id}`}
                    className={`${parkingSpotTile} ${occupied ? parkingSpotTileOccupied : ""}`}
                  >
                    <p className="text-center text-xl font-bold tabular-nums text-slate-900 group-hover:text-[#0000BF]">
                      {s.spotCode}
                    </p>
                    {s.zoneLabel ? (
                      <p className="mt-1 text-center text-[11px] text-slate-500">{s.zoneLabel}</p>
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
                          <span className="text-[10px] text-slate-500">
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
      </section>
    </div>
  );
}
