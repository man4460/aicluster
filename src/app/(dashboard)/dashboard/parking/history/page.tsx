import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { parkingField } from "@/systems/parking/parking-ui";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

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
  const from = sp.from;
  const to = sp.to;

  const checkInRange: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) checkInRange.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) checkInRange.lte = d;
  }

  const where: Prisma.ParkingSessionWhereInput = {
    spot: { siteId: site.id },
    ...(q ? { licensePlate: { contains: q } } : {}),
    ...(status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED" ? { status } : {}),
    ...(Object.keys(checkInRange).length > 0 ? { checkInAt: checkInRange } : {}),
  };

  const sessions = await prisma.parkingSession.findMany({
    where,
    orderBy: { checkInAt: "desc" },
    take: 300,
    include: { spot: { select: { spotCode: true, zoneLabel: true } } },
  });

  return (
    <div className="space-y-6">
      <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
        <AppSectionHeader
          tone="slate"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="ประวัติการใช้บริการ"
          description="สืบค้นตามทะเบียน ช่วงเวลาเช็คอิน และสถานะ"
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

        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="block text-xs font-semibold text-slate-700">
              ทะเบียน
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              className={`${parkingField} mt-1`}
              placeholder="ค้นหา"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-slate-700">
              สถานะ
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className={`${parkingField} mt-1`}
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="ACTIVE">กำลังจอด</option>
              <option value="COMPLETED">เสร็จแล้ว</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>
          <div>
            <label htmlFor="from" className="block text-xs font-semibold text-slate-700">
              เช็คอินตั้งแต่
            </label>
            <input
              id="from"
              name="from"
              type="datetime-local"
              defaultValue={from ?? ""}
              className={`${parkingField} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-xs font-semibold text-slate-700">
              ถึง
            </label>
            <input
              id="to"
              name="to"
              type="datetime-local"
              defaultValue={to ?? ""}
              className={`${parkingField} mt-1`}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-105"
            >
              ค้นหา
            </button>
          </div>
        </form>
      </AppDashboardSection>

      <AppDashboardSection className="overflow-x-auto p-5 sm:p-6">
        <p className="text-xs text-[#66638c]">
          วันนี้ (Bangkok): {bangkokDateKey()} · แสดงสูงสุด 300 แถว
        </p>
        <table className="mt-4 min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2">เช็คอิน</th>
              <th className="px-2 py-2">ช่อง</th>
              <th className="px-2 py-2">ทะเบียน</th>
              <th className="px-2 py-2">สถานะ</th>
              <th className="px-2 py-2">เช็คเอาต์</th>
              <th className="px-2 py-2 text-right">ยอด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="text-slate-800">
                  <td className="px-2 py-2 whitespace-nowrap text-xs">
                    {s.checkInAt.toLocaleString("th-TH")}
                  </td>
                  <td className="px-2 py-2 font-medium">{s.spot.spotCode}</td>
                  <td className="px-2 py-2 font-mono text-xs">{s.licensePlate}</td>
                  <td className="px-2 py-2 text-xs">
                    {s.status === "ACTIVE"
                      ? "กำลังจอด"
                      : s.status === "COMPLETED"
                        ? "เสร็จ"
                        : "ยกเลิก"}
                    {s.selfCheckIn ? " · QR" : ""}
                  </td>
                  <td className="px-2 py-2 text-xs whitespace-nowrap">
                    {s.checkOutAt ? s.checkOutAt.toLocaleString("th-TH") : "—"}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-xs">
                    {s.amountDueBaht != null
                      ? `${Number(s.amountDueBaht).toLocaleString("th-TH")} บ.`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AppDashboardSection>
    </div>
  );
}
