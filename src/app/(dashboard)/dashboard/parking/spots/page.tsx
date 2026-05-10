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
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] items-center justify-center rounded-2xl px-4 text-sm font-semibold",
              )}
            >
              ← ภาพรวม
            </Link>
          }
        />
        <div>
          <h2 className="text-sm font-semibold text-[#1e1b4b]">เพิ่มช่องใหม่</h2>
          <div className="mt-3">
            <ParkingAddSpotForm />
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="flex flex-col gap-3 p-5 sm:p-6">
        <AppSectionHeader tone="slate" title="รายการช่อง" description="ลิงก์ลูกค้าเช็คอิน · สถานะจอด" />
        <ul className="divide-y divide-slate-100">
          {spots.map((s) => {
            const active = s.sessions[0];
            const url = publicParkingCheckInUrl(s.checkInToken);
            return (
              <li
                key={s.id}
                className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/parking/spots/${s.id}`}
                    className="text-lg font-bold text-emerald-800 hover:underline"
                  >
                    {s.spotCode}
                  </Link>
                  {s.zoneLabel ? <p className="text-xs text-[#66638c]">{s.zoneLabel}</p> : null}
                  <p className="mt-1 font-mono text-[11px] text-[#66638c] break-all">{url}</p>
                  {active ? (
                    <p className="mt-1 text-xs font-medium text-amber-800">
                      กำลังจอด: {active.licensePlate} · เข้า {active.checkInAt.toLocaleString("th-TH")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-emerald-700">ว่าง</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/parking/spots/${s.id}`}
                  className="shrink-0 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  รายละเอียด →
                </Link>
              </li>
            );
          })}
        </ul>
      </AppDashboardSection>
    </div>
  );
}
