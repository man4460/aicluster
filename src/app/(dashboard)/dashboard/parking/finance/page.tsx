import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma/client";
import { AppDashboardSection } from "@/components/app-templates";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { ParkingHistoryFilterSection } from "@/systems/parking/components/ParkingHistoryFilterSection";
import { ParkingHistoryFilteredSummary } from "@/systems/parking/components/ParkingHistoryFilteredSummary";
import { ParkingHistorySessionList } from "@/systems/parking/components/ParkingHistorySessionList";
import { ParkingPageStack } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingStatCard } from "@/systems/parking/components/ParkingStatCard";
import {
  parkingFinanceStatTailClass,
  parkingFinanceStatsGridClass,
} from "@/systems/parking/parking-ui-tokens";

export const metadata: Metadata = {
  title: "การเงิน | บริการรับฝากจอดรถ",
};

type Props = {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }>;
};

export default async function ParkingFinancePage({ searchParams }: Props) {
  const { site } = await requireParkingPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().replace(/\s+/g, "");
  const status = sp.status ?? "ALL";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const monthKey = bangkokMonthKey();
  const today = bangkokDateKey();

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

  const monthStart = new Date(`${monthKey}-01T00:00:00+07:00`);
  const nextMonth =
    monthKey.slice(5, 7) === "12"
      ? `${Number(monthKey.slice(0, 4)) + 1}-01`
      : `${monthKey.slice(0, 4)}-${String(Number(monthKey.slice(5, 7)) + 1).padStart(2, "0")}`;
  const monthEnd = new Date(`${nextMonth}-01T00:00:00+07:00`);

  const [sessions, statusGroups, sums, monthPaid, monthDue, activeNow] = await Promise.all([
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
    prisma.parkingSession.aggregate({
      where: {
        spot: { siteId: site.id },
        status: "COMPLETED",
        checkOutAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountPaidBaht: true },
      _count: { _all: true },
    }),
    prisma.parkingSession.aggregate({
      where: {
        spot: { siteId: site.id },
        status: "COMPLETED",
        checkOutAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountDueBaht: true },
    }),
    prisma.parkingSession.count({
      where: { spot: { siteId: site.id }, status: "ACTIVE" },
    }),
  ]);

  const countFor = (s: "ACTIVE" | "COMPLETED" | "CANCELLED") =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;

  const totalFiltered = statusGroups.reduce((acc, g) => acc + g._count._all, 0);
  const sumDueBaht = Number(sums._sum.amountDueBaht ?? 0);
  const sumPaidBaht = Number(sums._sum.amountPaidBaht ?? 0);
  const monthRevenue = Number(monthPaid._sum.amountPaidBaht ?? 0);
  const monthBilled = Number(monthDue._sum.amountDueBaht ?? 0);
  const netHint = monthRevenue;

  return (
    <ParkingPageStack>
      <div className={parkingFinanceStatsGridClass}>
        <ParkingStatCard
          title="รายรับเดือนนี้"
          value={monthRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          tone="emerald"
          subtitle={`บาท · ${monthPaid._count._all} รอบที่ชำระ`}
        />
        <ParkingStatCard
          title="ยอดเรียกเก็บเดือนนี้"
          value={monthBilled.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          tone="violet"
          subtitle="บาท (ตามบิลตอนเช็คเอาต์)"
        />
        <ParkingStatCard
          title="กำลังจอด / สุทธิเดือนนี้"
          value={`${activeNow} · ${netHint.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`}
          tone="indigo"
          subtitle={`วันนี้ ${today} · สุทธิ ≈ รายรับ`}
          className={parkingFinanceStatTailClass}
        />
      </div>

      <ParkingHistoryFilterSection
        key={`${q}|${status}|${from}|${to}`}
        q={q}
        status={status}
        from={from}
        to={to}
        basePath="/dashboard/parking/finance"
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
          ประวัติรอบจอด · กรองตามทะเบียน / สถานะ / ช่วงเช็คอิน
          {totalFiltered > 300
            ? ` · แสดงล่าสุด 300 รายการจากทั้งหมด ${totalFiltered.toLocaleString("th-TH")} รายการที่ตรงการกรอง`
            : ` · แสดง ${sessions.length.toLocaleString("th-TH")} รายการ`}
        </p>
        <ParkingHistorySessionList sessions={sessions} />
      </AppDashboardSection>
    </ParkingPageStack>
  );
}
