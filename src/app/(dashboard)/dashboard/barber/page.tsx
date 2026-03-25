import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { getBarberRevenueBahtInRange } from "@/lib/barber/period-revenue";
import { PageHeader } from "@/components/ui/page-container";
import { BarberTodayBookings } from "@/systems/barber/components/BarberTodayBookings";

function formatBaht(n: number) {
  return `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
}

export default async function BarberDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const { start, end } = bangkokDayStartEnd();

  const logs = await prisma.barberServiceLog.findMany({
    where: {
      ownerUserId: session.sub,
      createdAt: { gte: start, lt: end },
    },
    select: {
      barberCustomerId: true,
      visitType: true,
    },
  });

  const uniqueCustomers = new Set(logs.map((l) => l.barberCustomerId)).size;
  const packageUses = logs.filter((l) => l.visitType === "PACKAGE_USE").length;
  const cashWalkIns = logs.filter((l) => l.visitType === "CASH_WALK_IN").length;

  const [subActive, revenue] = await Promise.all([
    prisma.barberCustomerSubscription.count({
      where: { ownerUserId: session.sub, status: "ACTIVE", remainingSessions: { gt: 0 } },
    }),
    getBarberRevenueBahtInRange(session.sub, start, end),
  ]);

  const statClass =
    "flex min-h-[100px] flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <div className="space-y-8">
      <PageHeader
        title="ร้านตัดผม"
        description="จองคิว เช็คอิน แพ็กเกจ และสถิติวันนี้"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/barber/bookings"
              className="rounded-xl border-2 border-[#0000BF] bg-white px-4 py-3 text-sm font-semibold text-[#0000BF] hover:bg-[#0000BF]/5"
            >
              จองคิว
            </Link>
            <Link
              href="/dashboard/barber/check-in"
              className="rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0000a6]"
            >
              เช็คอิน
            </Link>
          </div>
        }
      />

      <BarberTodayBookings ownerId={session.sub} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">สถิติวันนี้ (เวลาไทย)</h2>
        <div className="mb-4 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800/90">รายรับวันนี้</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-emerald-950">
            {formatBaht(revenue.revenueTotalBaht)}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>
              เงินสด walk-in:{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatBaht(revenue.revenueCashBaht)}
              </span>
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden>
              |
            </span>
            <span>
              จากการใช้แพ็ก:{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatBaht(revenue.revenuePackageBaht)}
              </span>
            </span>
          </div>
          {revenue.cashSumOk === false ? (
            <p className="mt-2 text-xs text-amber-800">
              ไม่สามารถรวมยอดเงินสดได้ — ตรวจสอบ migration คอลัมน์ amount_baht
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={statClass}>
            <p className="text-xs font-medium text-slate-500">ลูกค้า (ไม่ซ้ำ)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{uniqueCustomers}</p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium text-slate-500">ใช้แพ็กเกจ</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{packageUses}</p>
            <p className="text-[10px] text-slate-400">ครั้งที่หักจากแพ็ก</p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium text-slate-500">เงินสด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{cashWalkIns}</p>
            <p className="text-[10px] text-slate-400">Walk-in ที่บันทึก</p>
          </div>
          <div className={statClass}>
            <p className="text-xs font-medium text-slate-500">เข้าใช้บริการรวม</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#0000BF]">{logs.length}</p>
          </div>
          <div className={`${statClass} col-span-2 sm:col-span-1`}>
            <p className="text-xs font-medium text-slate-500">สมาชิกแพ็ก (เหลือครั้ง)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-violet-800">{subActive}</p>
            <p className="text-[10px] text-slate-400">สถานะใช้งาน &gt; 0 ครั้ง</p>
          </div>
        </div>
      </section>
    </div>
  );
}
