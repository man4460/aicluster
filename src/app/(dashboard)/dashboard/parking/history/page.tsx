import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/ui/page-container";
import { prisma } from "@/lib/prisma";
import { parkingBtnSecondary, parkingCard } from "@/systems/parking/parking-ui";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ประวัติการใช้งาน | ระบบเช่าที่จอดรถ",
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
    <div className="space-y-8">
      <PageHeader
        title="ประวัติการใช้บริการ"
        description="สืบค้นตามทะเบียน ช่วงเวลาเช็คอิน และสถานะ"
        action={
          <Link href="/dashboard/parking" className={parkingBtnSecondary}>
            ← ผังที่จอด
          </Link>
        }
      />

      <section className={`${parkingCard} p-5`}>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="block text-xs font-semibold text-slate-700">
              ทะเบียน
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              ค้นหา
            </button>
          </div>
        </form>
      </section>

      <section className={`${parkingCard} overflow-x-auto p-5`}>
        <p className="text-xs text-slate-500">
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
      </section>
    </div>
  );
}
