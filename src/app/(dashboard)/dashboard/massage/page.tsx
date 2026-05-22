import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/massage/bangkok-day";
import { getMassageRevenueBahtInRange } from "@/lib/massage/period-revenue";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  MassageDashboardHubClient,
  MassageDashboardTabToolbar,
} from "@/systems/massage/components/MassageDashboardHubClient";
import { MassageTodayBookings } from "@/systems/massage/components/MassageTodayBookings";
import {
  massagePageStackClass,
  massageSectionNextClass,
  massageStatCardClass,
} from "@/systems/massage/components/massage-ui-tokens";

function formatBaht(n: number) {
  return `${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
}

export default async function MassageDashboardPage() {
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
            <h2 className="text-lg font-bold text-[#2e2a58]">สถิติวันนี้</h2>
            <p className="mt-1 hidden text-xs text-[#66638c] sm:block">
              เวลาไทย · รายรับ + ครั้งใช้บริการ
            </p>
          </div>
          <Suspense
            fallback={
              <div className="h-11 w-44 shrink-0 animate-pulse rounded-[1.25rem] bg-white/30" aria-hidden />
            }
          >
            <MassageDashboardTabToolbar className="shrink-0" />
          </Suspense>
        </div>
        <div className="mt-4 rounded-[2rem] border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800/90">รายรับวันนี้</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-emerald-950">
            {formatBaht(revenue.revenueTotalBaht)}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#66638c]">
            <span>
              เงินสด walk-in:{" "}
              <span className="font-semibold tabular-nums text-[#2e2a58]">{formatBaht(revenue.revenueCashBaht)}</span>
            </span>
            <span className="hidden text-[#d8d6ec] sm:inline" aria-hidden>
              |
            </span>
            <span>
              ขายแพ็กใหม่:{" "}
              <span className="font-semibold tabular-nums text-[#2e2a58]">
                {formatBaht(revenue.revenueNewPackageBaht)}
              </span>
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[#66638c]">
            นับเฉพาะเงินสด + ขายแพ็กใหม่ · หักแพ็กไม่เพิ่มรายรับ
          </p>
          {revenue.cashSumOk === false ? (
            <p className="mt-2 text-xs text-amber-800">รวมเงินสดไม่ได้ — ตรวจคอลัมน์ amount_baht</p>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={massageStatCardClass}>
            <p className="text-xs font-medium text-[#8b87ad]">ลูกค้า (ไม่ซ้ำ)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#2e2a58]">{uniqueCustomers}</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-medium text-[#8b87ad]">ใช้แพ็ก</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{packageUses}</p>
            <p className="text-[10px] text-[#8b87ad]">หักจากแพ็ก</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-medium text-[#8b87ad]">เงินสด</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{cashWalkIns}</p>
            <p className="text-[10px] text-[#8b87ad]">Walk-in</p>
          </div>
          <div className={massageStatCardClass}>
            <p className="text-xs font-medium text-[#8b87ad]">เข้าใช้รวม</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#4d47b6]">{logs.length}</p>
          </div>
          <div className={`${massageStatCardClass} col-span-2 sm:col-span-1`}>
            <p className="text-xs font-medium text-[#8b87ad]">แพ็กคงเหลือ</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-violet-800">{subActive}</p>
            <p className="text-[10px] text-[#8b87ad]">มียอดคงเหลือ</p>
          </div>
        </div>
      </section>

      <MassageTodayBookings ownerId={session.sub} />
    </>
  );

  return (
    <div className={massagePageStackClass}>
      <MassageDashboardHubClient initialDateKey={bangkokDateKey()}>{overview}</MassageDashboardHubClient>
    </div>
  );
}
