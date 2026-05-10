import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { AppDashboardSection } from "@/components/app-templates";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { ParkingHistoryFilterSection } from "@/systems/parking/components/ParkingHistoryFilterSection";
import { ParkingHistoryFilteredSummary } from "@/systems/parking/components/ParkingHistoryFilteredSummary";
import { ParkingHistorySessionList } from "@/systems/parking/components/ParkingHistorySessionList";

export const metadata: Metadata = {
  title: "ประวัติการใช้งาน | บริการรับฝากจอดรถ",
};

type Props = {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }>;
};

export default async function ParkingHistoryPage({ searchParams }: Props) {
  const { site } = await requireParkingPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().replace(/\s+/g, "");
  const status = sp.status ?? "ALL";
  const from = sp.from ?? "";
  const to = sp.to ?? "";

  const checkInRange: { gte?: Date; lte?: Date } = {};
  if (from.trim()) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) checkInRange.gte = d;
  }
  if (to.trim()) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) checkInRange.lte = d;
  }

  const where: Prisma.ParkingSessionWhereInput = {
    spot: { siteId: site.id },
    ...(q ? { licensePlate: { contains: q } } : {}),
    ...(status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED" ? { status } : {}),
    ...(Object.keys(checkInRange).length > 0 ? { checkInAt: checkInRange } : {}),
  };

  const [sessions, statusGroups, sums] = await Promise.all([
    prisma.parkingSession.findMany({
      where,
      orderBy: { checkInAt: "desc" },
      take: 300,
      include: { spot: { select: { spotCode: true, zoneLabel: true } } },
    }),
    prisma.parkingSession.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.parkingSession.aggregate({
      where,
      _sum: {
        amountDueBaht: true,
        amountPaidBaht: true,
      },
    }),
  ]);

  const countFor = (s: "ACTIVE" | "COMPLETED" | "CANCELLED") =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;

  const totalFiltered = statusGroups.reduce((acc, g) => acc + g._count._all, 0);
  const sumDueBaht = Number(sums._sum.amountDueBaht ?? 0);
  const sumPaidBaht = Number(sums._sum.amountPaidBaht ?? 0);

  return (
    <div className="space-y-6">
      <ParkingHistoryFilterSection
        key={`${q}|${status}|${from}|${to}`}
        q={q}
        status={status}
        from={from}
        to={to}
      />

      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <ParkingHistoryFilteredSummary
          total={totalFiltered}
          activeCount={countFor("ACTIVE")}
          completedCount={countFor("COMPLETED")}
          cancelledCount={countFor("CANCELLED")}
          sumDueBaht={sumDueBaht}
          sumPaidBaht={sumPaidBaht}
        />
        <p className="text-xs text-[#66638c]">
          วันนี้ (Bangkok): {bangkokDateKey()}
          {totalFiltered > 300
            ? ` · แสดงล่าสุด 300 รายการจากทั้งหมด ${totalFiltered.toLocaleString("th-TH")} รายการที่ตรงการกรอง`
            : ` · แสดง ${sessions.length.toLocaleString("th-TH")} รายการ`}
          · มือถือ 1 คอลัมน์ · เดสก์ท็อป 2 คอลัมน์
        </p>
        <ParkingHistorySessionList sessions={sessions} />
      </AppDashboardSection>
    </div>
  );
}
