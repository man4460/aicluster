import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { parkingBtnSecondary, parkingCard } from "@/systems/parking/parking-ui";
import { ParkingAddSpotForm } from "@/systems/parking/components/ParkingAddSpotForm";
import { publicParkingCheckInUrl } from "@/systems/parking/lib/public-checkin-url";
import { loadParkingSpotsWithActive } from "@/systems/parking/lib/load-dashboard";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "จัดการช่องจอด | ระบบเช่าที่จอดรถ",
};

export default async function ParkingSpotsPage() {
  const { site } = await requireParkingPage();
  const spots = await loadParkingSpotsWithActive(site.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="จัดการช่องจอด"
        description="เพิ่มช่อง แก้ลิงก์ QR หรือเช็คอินฝั่งพนักงานได้ที่รายละเอียดแต่ละช่อง"
        action={
          <Link href="/dashboard/parking" className={parkingBtnSecondary}>
            ← ผังที่จอด
          </Link>
        }
      />

      <section className={`${parkingCard} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900">เพิ่มช่องใหม่</h2>
        <div className="mt-4">
          <ParkingAddSpotForm />
        </div>
      </section>

      <section className={`${parkingCard} p-5`}>
        <h2 className="text-base font-semibold text-slate-900">รายการช่อง</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {spots.map((s) => {
            const active = s.sessions[0];
            const url = publicParkingCheckInUrl(s.checkInToken);
            return (
              <li key={s.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href={`/dashboard/parking/spots/${s.id}`}
                    className="text-lg font-bold text-[#0000BF] hover:underline"
                  >
                    {s.spotCode}
                  </Link>
                  {s.zoneLabel ? <p className="text-xs text-slate-500">{s.zoneLabel}</p> : null}
                  <p className="mt-1 font-mono text-[11px] text-slate-500 break-all">{url}</p>
                  {active ? (
                    <p className="mt-1 text-xs font-medium text-amber-800">
                      กำลังจอด: {active.licensePlate} · เข้า{" "}
                      {active.checkInAt.toLocaleString("th-TH")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-700">ว่าง</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/parking/spots/${s.id}`}
                  className="shrink-0 text-sm font-semibold text-slate-700 hover:text-[#0000BF]"
                >
                  รายละเอียด →
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
