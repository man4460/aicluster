import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/massage/bangkok-day";
import { getMassageRevenueBahtInRange } from "@/lib/massage/period-revenue";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { cn } from "@/lib/cn";
import {
  MassageDashboardHubClient,
  MassageDashboardTabToolbar,
} from "@/systems/massage/components/MassageDashboardHubClient";
import { MassageTodayBookings } from "@/systems/massage/components/MassageTodayBookings";
import {
  massageEnEyebrowLabelClass,
  massagePageStackClass,
  massageSectionNextClass,
  massageStatCardClass,
  massageStatGridClass,
  massageSurfaceRadiusClass,
} from "@/systems/massage/components/massage-ui-tokens";

function formatBaht(n: number) {
  return `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
}

/** เนื้อหาหน้าแดชบอร์ดร้านนวด — ใช้ทั้ง `/dashboard/massage` และลิงก์พนักงาน */
export async function MassageDashboardHome({
  className,
}: {
  className?: string;
} = {}) {
  const session = await getSession();
  if (!session) return null;

  const { start, end } = bangkokDayStartEnd();
  const scope = await getMassageDataScope(session.sub);

  const logs = await prisma.massageServiceLog.findMany({
    where: {
      ownerUserId: session.sub,
      trialSessionId: scope.trialSessionId,
      createdAt: { gte: start, lt: end },
    },
    select: {
      massageCustomerId: true,
      visitType: true,
    },
  });

  const uniqueCustomers = new Set(logs.map((l) => l.massageCustomerId)).size;
  const packageUses = logs.filter((l) => l.visitType === "PACKAGE_USE").length;
  const cashWalkIns = logs.filter((l) => l.visitType === "CASH_WALK_IN").length;

  const [subActive, revenue] = await Promise.all([
    prisma.massageCustomerSubscription.count({
      where: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
        status: "ACTIVE",
        remainingSessions: { gt: 0 },
      },
    }),
    getMassageRevenueBahtInRange(session.sub, start, end, scope.trialSessionId),
  ]);

  const overview = (
    <>
      <section className={massageSectionNextClass} aria-label="สถิติวันนี้">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2 sm:items-start sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className={massageEnEyebrowLabelClass}>TODAY&apos;S STATS</p>
            <h2 className="mt-0.5 text-lg font-black text-[#2e2a58] sm:text-xl">สถิติวันนี้</h2>
          </div>
          <Suspense
            fallback={
              <div className="h-11 w-44 shrink-0 animate-pulse rounded-[1.5rem] bg-white/30" aria-hidden />
            }
          >
            <MassageDashboardTabToolbar className="shrink-0" />
          </Suspense>
        </div>
        <div
          className={`mt-4 ${massageSurfaceRadiusClass} border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 shadow-sm`}
        >
          <p className="text-xs font-bold text-emerald-800/90">รายรับวันนี้</p>
          <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-emerald-950">
            {formatBaht(revenue.revenueTotalBaht)}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#66638c]">
            <span>
              เงินสด walk-in:{" "}
              <span className="font-bold tabular-nums text-[#2e2a58]">{formatBaht(revenue.revenueCashBaht)}</span>
            </span>
            <span className="hidden text-[#d8d6ec] sm:inline" aria-hidden>
              |
            </span>
            <span>
              ขายแพ็กใหม่:{" "}
              <span className="font-bold tabular-nums text-[#2e2a58]">
                {formatBaht(revenue.revenueNewPackageBaht)}
              </span>
            </span>
          </div>
        </div>
        <div className={`mt-4 ${massageStatGridClass}`}>
          <div className={massageStatCardClass}>
            <p className="text-xs font-bold text-[#8b87ad]">ลูกค้า (ไม่ซ้ำ)</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#2e2a58]">{uniqueCustomers}</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-bold text-[#8b87ad]">ใช้แพ็ก</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-emerald-700">{packageUses}</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-bold text-[#8b87ad]">เงินสด</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-amber-800">{cashWalkIns}</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-bold text-[#8b87ad]">เข้าใช้รวม</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#4d47b6]">{logs.length}</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-bold text-[#8b87ad]">แพ็กคงเหลือ</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-violet-800">{subActive}</p>
          </div>
        </div>
      </section>

      <MassageTodayBookings ownerId={session.sub} />
    </>
  );

  return (
    <div className={cn(massagePageStackClass, className)}>
      <MassageDashboardHubClient initialDateKey={bangkokDateKey()}>{overview}</MassageDashboardHubClient>
    </div>
  );
}
