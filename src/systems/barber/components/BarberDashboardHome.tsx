import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { getBarberRevenueBahtInRange } from "@/lib/barber/period-revenue";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { cn } from "@/lib/cn";
import {
  BarberDashboardHeaderTrailing,
  BarberDashboardHubClient,
} from "@/systems/barber/components/BarberDashboardHubClient";
import { BarberTodayBookings } from "@/systems/barber/components/BarberTodayBookings";
import {
  barberHeaderEnLabelClass,
  barberPageStackClass,
  barberSectionNextClass,
  barberStatCardClass,
} from "@/systems/barber/components/barber-ui-tokens";

function formatBaht(n: number) {
  return `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
}

/** เนื้อหาหน้าแดชบอร์ดร้านตัดผม — ใช้ทั้ง `/dashboard/barber` และลิงก์พนักงาน */
export async function BarberDashboardHome({
  className,
}: {
  className?: string;
} = {}) {
  const session = await getSession();
  if (!session) return null;

  const { start, end } = bangkokDayStartEnd();
  const scope = await getBarberDataScope(session.sub);

  const logs = await prisma.barberServiceLog.findMany({
    where: {
      ownerUserId: session.sub,
      trialSessionId: scope.trialSessionId,
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
      where: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
        status: "ACTIVE",
        remainingSessions: { gt: 0 },
      },
    }),
    getBarberRevenueBahtInRange(session.sub, start, end, scope.trialSessionId),
  ]);

  const overview = (
    <>
      <section className={barberSectionNextClass} aria-label="สถิติวันนี้">
        <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn(barberHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
              TODAY&apos;S STATS
            </p>
            <h2 className="text-lg font-bold text-[#2e2a58]">สถิติวันนี้</h2>
          </div>
          <Suspense
            fallback={
              <div className="h-10 w-full max-w-md animate-pulse rounded-[1.25rem] bg-white/30 sm:w-72" aria-hidden />
            }
          >
            <BarberDashboardHeaderTrailing className="w-full sm:w-auto" />
          </Suspense>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div
            className={cn(
              barberStatCardClass,
              "relative col-span-2 min-h-0 justify-start overflow-hidden border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/50 p-3 sm:p-3.5 lg:col-span-1",
            )}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-300/45 via-teal-200/30 to-transparent blur-2xl"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800/90">รายรับวันนี้</p>
            <p className="mt-1 bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 bg-clip-text text-xl font-black tabular-nums tracking-tight text-transparent sm:text-2xl">
              {formatBaht(revenue.revenueTotalBaht)}
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-[#66638c]">
              เงินสด {formatBaht(revenue.revenueCashBaht)}
              <span className="mx-1 text-[#d8d6ec]" aria-hidden>
                ·
              </span>
              แพ็กใหม่ {formatBaht(revenue.revenueNewPackageBaht)}
            </p>
            {revenue.cashSumOk === false ? (
              <p className="mt-1 text-[10px] text-amber-800">รวมเงินสดไม่ได้ — ตรวจ amount_baht</p>
            ) : null}
          </div>

          <div
            className={cn(
              barberStatCardClass,
              "relative min-h-0 overflow-hidden border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/45 p-3 sm:p-3.5",
            )}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-sky-500 via-blue-500 to-indigo-500"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-sky-300/40 via-indigo-200/30 to-transparent blur-2xl"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-800/80">ลูกค้า</p>
            <p className="mt-1 bg-gradient-to-br from-sky-700 via-blue-600 to-indigo-700 bg-clip-text text-xl font-black tabular-nums text-transparent sm:text-2xl">
              {uniqueCustomers}
            </p>
            <p className="mt-1 text-[10px] text-[#66638c]">
              เข้าใช้รวม <span className="font-bold tabular-nums text-indigo-600">{logs.length}</span>
            </p>
          </div>

          <div
            className={cn(
              barberStatCardClass,
              "relative min-h-0 overflow-hidden border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/45 p-3 sm:p-3.5",
            )}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 via-amber-500 to-orange-500"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-amber-300/40 via-orange-200/30 to-transparent blur-2xl"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-900/80">ใช้แพ็ก / เงินสด</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-xl font-black tabular-nums text-transparent sm:text-2xl">
                {packageUses}
              </p>
              <span className="text-[#d8d6ec]" aria-hidden>
                /
              </span>
              <p className="bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-xl font-black tabular-nums text-transparent sm:text-2xl">
                {cashWalkIns}
              </p>
            </div>
            <p className="mt-1 text-[10px] text-[#66638c]">หักแพ็ก · Walk-in</p>
          </div>

          <div
            className={cn(
              barberStatCardClass,
              "relative min-h-0 overflow-hidden border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/45 p-3 sm:p-3.5 max-lg:col-span-2",
            )}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-violet-300/40 via-fuchsia-200/30 to-transparent blur-2xl"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-800/80">แพ็กคงเหลือ</p>
            <p className="mt-1 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-xl font-black tabular-nums text-transparent sm:text-2xl">
              {subActive}
            </p>
            <p className="mt-1 text-[10px] text-[#66638c]">สมาชิกมียอดใช้ได้</p>
          </div>
        </div>
      </section>

      <BarberTodayBookings initialDateKey={bangkokDateKey()} />
    </>
  );

  return (
    <div className={cn(barberPageStackClass, className)}>
      <BarberDashboardHubClient initialDateKey={bangkokDateKey()}>{overview}</BarberDashboardHubClient>
    </div>
  );
}
