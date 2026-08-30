import type { Metadata } from "next";
import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey, formatBangkokTimeHm } from "@/lib/time/bangkok";
import { ParkingDashboardHubClient } from "@/systems/parking/components/ParkingDashboardHubClient";
import { ParkingDashboardTabToolbarSuspense } from "@/systems/parking/components/ParkingDashboardTabToolbar";
import {
  type ParkingCheckInLotRow,
  type ParkingCheckInSpotRow,
} from "@/systems/parking/components/ParkingStaffCheckInClient";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingStatCard } from "@/systems/parking/components/ParkingStatCard";
import { isParkingBookingVisibleOnSpotGrid } from "@/systems/parking/lib/booking-window";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { parkingSpotDetailHref } from "@/systems/parking/parking-module-nav";
import {
  parkingSpotTile,
  parkingSpotTileBooked,
  parkingSpotTileOccupied,
} from "@/systems/parking/parking-ui";

export const metadata: Metadata = {
  title: "แดชบอร์ด | บริการรับฝากจอดรถ",
};

function formatBookingTimeRange(start: Date, end: Date | null): string {
  const startHm = formatBangkokTimeHm(start);
  if (!end) return startHm;
  const endHm = formatBangkokTimeHm(end);
  if (bangkokDateKey(start) === bangkokDateKey(end)) return `${startHm}–${endHm}`;
  return `${start.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })} – ${end.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })}`;
}

export default async function ParkingDashboardPage() {
  const { site, session, scope } = await requireParkingPage();
  const now = new Date();
  const dayStart = new Date(`${bangkokDateKey()}T00:00:00+07:00`);
  const dayEnd = new Date(`${bangkokDateKey()}T23:59:59.999+07:00`);

  const sites = await prisma.parkingSite.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    select: { id: true, name: true, isActive: true },
  });
  const siteIds = sites.length > 0 ? sites.map((s) => s.id) : [site.id];

  const [spots, activeCount, todayCompleted, scheduledBookings] = await Promise.all([
    prisma.parkingSpot.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      include: {
        site: { select: { id: true, name: true, pricingMode: true, dailyRateBaht: true, monthlyRateBaht: true } },
        sessions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { checkInAt: "desc" },
        },
      },
    }),
    prisma.parkingSession.count({
      where: { spot: { siteId: { in: siteIds } }, status: "ACTIVE" },
    }),
    prisma.parkingSession.count({
      where: {
        spot: { siteId: { in: siteIds } },
        status: "COMPLETED",
        checkOutAt: { gte: dayStart, lte: now },
      },
    }),
    prisma.parkingBooking.findMany({
      where: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
        status: "SCHEDULED",
        spotId: { not: null },
        scheduledStart: { lte: dayEnd },
        OR: [{ scheduledEnd: null }, { scheduledEnd: { gte: dayStart } }],
      },
      select: {
        id: true,
        spotId: true,
        licensePlate: true,
        customerName: true,
        customerPhone: true,
        scheduledStart: true,
        scheduledEnd: true,
        packageName: true,
      },
    }),
  ]);

  const bookingBySpotId = new Map<number, (typeof scheduledBookings)[number]>();
  for (const b of scheduledBookings) {
    if (b.spotId == null) continue;
    if (!isParkingBookingVisibleOnSpotGrid(b.scheduledStart, b.scheduledEnd, now)) continue;
    const existing = bookingBySpotId.get(b.spotId);
    if (!existing || b.scheduledStart < existing.scheduledStart) {
      bookingBySpotId.set(b.spotId, b);
    }
  }

  const checkInLots: ParkingCheckInLotRow[] = sites.map((l) => ({
    id: l.id,
    name: l.name,
    isActive: l.isActive,
  }));

  const checkInSpots: ParkingCheckInSpotRow[] = spots.map((s) => {
    const active = s.sessions[0];
    return {
      id: s.id,
      siteId: s.site.id,
      siteName: s.site.name,
      spotCode: s.spotCode,
      zoneLabel: s.zoneLabel,
      pricingMode: s.site.pricingMode,
      dailyRateBaht: s.site.dailyRateBaht != null ? Number(s.site.dailyRateBaht) : null,
      monthlyRateBaht: s.site.monthlyRateBaht != null ? Number(s.site.monthlyRateBaht) : null,
      activeSession: active
        ? {
            id: active.id,
            licensePlate: active.licensePlate,
            checkInAt: active.checkInAt.toISOString(),
            customerName: active.customerName,
            customerPhone: active.customerPhone,
            selfCheckIn: active.selfCheckIn,
            shuttleFrom: active.shuttleFrom,
            shuttleTo: active.shuttleTo,
            shuttleNote: active.shuttleNote,
          }
        : null,
    };
  });

  const modeTh =
    site.pricingMode === "MONTHLY" ? "รายเดือน" : site.pricingMode === "DAILY" ? "เหมารายวัน" : "รายชั่วโมง";
  const rateTh =
    site.pricingMode === "MONTHLY"
      ? site.monthlyRateBaht != null
        ? `${Number(site.monthlyRateBaht).toLocaleString("th-TH")} บาท/เดือน`
        : "ยังไม่ตั้งราคา"
      : site.pricingMode === "DAILY"
        ? site.dailyRateBaht != null
          ? `${Number(site.dailyRateBaht).toLocaleString("th-TH")} บาท/วัน`
          : "ยังไม่ตั้งราคา"
        : site.hourlyRateBaht != null
          ? `${Number(site.hourlyRateBaht).toLocaleString("th-TH")} บาท/ชม.`
          : "ยังไม่ตั้งราคา";

  const overview = (
    <ParkingPageStack>
      <ParkingPanelCard
        title="แดชบอร์ด"
        description={`${modeTh} · ${rateTh} · ภาพรวมลานจอดวันนี้`}
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={<ParkingDashboardTabToolbarSuspense className="w-full sm:w-auto" />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <ParkingStatCard
            title="กำลังจอด"
            value={activeCount.toLocaleString("en-US")}
            tone="indigo"
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeLinejoin="round" />
              </svg>
            }
          />
          <ParkingStatCard
            title="เช็คเอาต์วันนี้"
            value={todayCompleted.toLocaleString("en-US")}
            tone="emerald"
            className="col-span-2 sm:col-span-1"
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 18V6" />
              </svg>
            }
          />
        </div>
      </ParkingPanelCard>

      <ParkingPanelCard title="สถานะช่องจอด" description="ว่าง · มีการจอง · มีรถจอด — แตะช่องเพื่อเช็คอินหรือเช็คเอาต์">
        {spots.length === 0 ? (
          <AppEmptyState tone="glass">ยังไม่มีช่องจอด — เพิ่มได้ที่เมนูการจัดการ → ลานจอด</AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {spots.map((s) => {
              const active = s.sessions[0];
              const occupied = Boolean(active);
              const booking = !occupied ? bookingBySpotId.get(s.id) ?? null : null;
              const booked = Boolean(booking);
              const upcoming = booking ? booking.scheduledStart > now : false;
              const tileClass = occupied
                ? parkingSpotTileOccupied
                : booked
                  ? parkingSpotTileBooked
                  : "";
              return (
                <li key={s.id}>
                  <Link
                    href={parkingSpotDetailHref(s.id)}
                    className={`${parkingSpotTile} ${tileClass}`}
                  >
                    <p className="text-center text-xl font-black tabular-nums text-[#1e1b4b] transition-colors group-hover:text-[#5b61ff]">
                      {s.spotCode}
                    </p>
                    <p className="mt-1 text-center text-[11px] font-medium text-[#66638c]">
                      {s.site.name}
                      {s.zoneLabel ? ` · ${s.zoneLabel}` : ""}
                    </p>
                    <div className="mt-2 flex flex-1 flex-col items-center justify-end gap-1 border-t border-white/60 pt-2">
                      {occupied ? (
                        <>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-200/90">
                            มีรถจอด
                          </span>
                          <span className="text-center text-[11px] font-semibold tabular-nums text-[#2e2a58]">
                            {active!.licensePlate}
                          </span>
                          <span className="text-[10px] text-[#66638c]">
                            {active!.selfCheckIn ? "เช็คอินเอง" : "พนักงาน"}
                          </span>
                        </>
                      ) : booked && booking ? (
                        <>
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-900 ring-1 ring-violet-200/90">
                            {upcoming ? "มีการจอง" : "ถึงเวลาจอง"}
                          </span>
                          <span className="text-center text-[11px] font-semibold tabular-nums text-[#2e2a58]">
                            {booking.licensePlate}
                          </span>
                          {booking.customerName ? (
                            <span className="max-w-full truncate text-center text-[10px] text-[#66638c]">
                              {booking.customerName}
                            </span>
                          ) : null}
                          <span className="text-center text-[10px] font-medium tabular-nums text-[#5f5a8a]">
                            {formatBookingTimeRange(booking.scheduledStart, booking.scheduledEnd)}
                          </span>
                          {booking.packageName ? (
                            <span className="max-w-full truncate text-center text-[10px] text-[#66638c]">
                              {booking.packageName}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200/90">
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
      </ParkingPanelCard>
    </ParkingPageStack>
  );

  return (
    <ParkingDashboardHubClient checkInLots={checkInLots} checkInSpots={checkInSpots}>
      {overview}
    </ParkingDashboardHubClient>
  );
}

