import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokMonthStartEnd, bangkokYearStartEnd } from "@/lib/barber/bangkok-day";
import { bangkokDateKey } from "@/lib/time/bangkok";

type BarberLogWithCustomer = Prisma.BarberServiceLogGetPayload<{
  include: { customer: true; stylist: true };
}>;

/** ไม่ดึงรายการทั้งหมด — จำกัดภายในระบบเท่านั้น */
const LIST_CAP = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

/** เลขเดือน 1–12 หรือ `all` = รวมทุกเดือนในปีที่เลือก (สรุปทั้งปี เวลาไทย) */
function parseMonthParam(searchParams: URLSearchParams): number | "all" {
  const raw = (searchParams.get("month") ?? "").trim().toLowerCase();
  if (raw === "all") return "all";
  const key = bangkokDateKey();
  const defM = Number(key.split("-")[1]);
  const month = Number(raw);
  if (!Number.isFinite(month) || month < 1 || month > 12) return defM;
  return month;
}

/** ปีปฏิทินไทยที่มี log จริง — ไม่พึ่ง DATE_ADD ใน SQL (ลดปัญหา timezone / เวอร์ชัน MySQL) */
async function distinctBangkokYears(ownerId: string, trialSessionId: string): Promise<number[]> {
  const bounds = await prisma.barberServiceLog.aggregate({
    where: { ownerUserId: ownerId, trialSessionId },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });
  const minAt = bounds._min.createdAt;
  const maxAt = bounds._max.createdAt;
  if (!minAt || !maxAt) return [];

  const years = new Set<number>();
  const startKey = minAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const endKey = maxAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const start = new Date(`${startKey}T12:00:00+07:00`);
  const end = new Date(`${endKey}T12:00:00+07:00`);
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const y = Number(
      new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4),
    );
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

async function sumPackageRevenueBaht(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
  q: string,
): Promise<number> {
  const like = `%${q}%`;
  if (q.length === 0) {
    const row = await prisma.$queryRaw<[{ total: unknown }]>`
      SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4)) / NULLIF(bp.total_sessions, 0)), 0) AS total
      FROM barber_service_logs l
      INNER JOIN customer_subscriptions cs ON l.subscription_id = cs.id
      INNER JOIN barber_packages bp ON cs.package_id = bp.id
      WHERE l.owner_id = ${ownerId}
        AND l.trial_session_id = ${trialSessionId}
        AND l.visit_type = 'PACKAGE_USE'
        AND l.created_at >= ${start}
        AND l.created_at < ${end}
    `;
    return Number(row[0]?.total ?? 0);
  }
  const row = await prisma.$queryRaw<[{ total: unknown }]>`
    SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4)) / NULLIF(bp.total_sessions, 0)), 0) AS total
    FROM barber_service_logs l
    INNER JOIN customer_subscriptions cs ON l.subscription_id = cs.id
    INNER JOIN barber_packages bp ON cs.package_id = bp.id
    INNER JOIN barber_customers c ON l.barber_customer_id = c.id
    WHERE l.owner_id = ${ownerId}
      AND l.trial_session_id = ${trialSessionId}
      AND l.visit_type = 'PACKAGE_USE'
      AND l.created_at >= ${start}
      AND l.created_at < ${end}
      AND (c.phone LIKE ${like} OR COALESCE(c.name, '') LIKE ${like})
  `;
  return Number(row[0]?.total ?? 0);
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const monthParam = parseMonthParam(searchParams);

  const key = bangkokDateKey();
  const defY = Number(key.split("-")[0]);

  try {
    const dbYears = await distinctBangkokYears(ownerId, scope.trialSessionId);
    const yearParam = Number(searchParams.get("year"));

    const fromDb = dbYears.length > 0 ? dbYears : [];
    const availableYears = [...new Set([...fromDb, defY])].sort((a, b) => a - b);

    let year = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : defY;
    if (!availableYears.includes(year)) {
      year = availableYears[availableYears.length - 1]!;
    }

    const { start, end } =
      monthParam === "all"
        ? bangkokYearStartEnd(year)
        : bangkokMonthStartEnd(year, monthParam);

    const textFilter =
      q.length > 0
        ? {
            OR: [
              { customer: { phone: { contains: q } } },
              { customer: { name: { contains: q } } },
            ],
          }
        : {};

    const where = {
      ownerUserId: ownerId,
      trialSessionId: scope.trialSessionId,
      createdAt: { gte: start, lt: end },
      ...textFilter,
    };

    let revenuePackageBaht = 0;
    try {
      revenuePackageBaht = await sumPackageRevenueBaht(ownerId, scope.trialSessionId, start, end, q);
    } catch (e) {
      console.error("[barber/history] package revenue", e);
    }

    let revenueCashBaht = 0;
    let cashSumOk = true;
    const [totalVisits, packageUses, cashWalkIns, distinctCustomers] = await Promise.all([
      prisma.barberServiceLog.count({ where }),
      prisma.barberServiceLog.count({ where: { ...where, visitType: "PACKAGE_USE" } }),
      prisma.barberServiceLog.count({ where: { ...where, visitType: "CASH_WALK_IN" } }),
      prisma.barberServiceLog.groupBy({
        by: ["barberCustomerId"],
        where,
      }),
    ]);

    let logs: BarberLogWithCustomer[];
    try {
      logs = await prisma.barberServiceLog.findMany({
        where,
        include: { customer: true, stylist: true },
        orderBy: { createdAt: "desc" },
        take: LIST_CAP,
      });
    } catch (e) {
      console.error("[barber/history] findMany — fallback ถ้ายังไม่มีคอลัมน์ใหม่", e);
      const rows = await prisma.barberServiceLog.findMany({
        where,
        select: {
          id: true,
          ownerUserId: true,
          visitType: true,
          note: true,
          createdAt: true,
          subscriptionId: true,
          barberCustomerId: true,
          customer: true,
        },
        orderBy: { createdAt: "desc" },
        take: LIST_CAP,
      });
      logs = rows.map((r) => ({
        ...r,
        amountBaht: null,
        stylistId: null,
        stylist: null,
      })) as BarberLogWithCustomer[];
    }

    try {
      const cashSumRow = await prisma.barberServiceLog.aggregate({
        where: { ...where, visitType: "CASH_WALK_IN" },
        _sum: { amountBaht: true },
      });
      revenueCashBaht = Number(cashSumRow._sum.amountBaht ?? 0);
    } catch (e) {
      cashSumOk = false;
      console.error("[barber/history] cash sum (ตรวจสอบ migration คอลัมน์ amount_baht)", e);
    }

    const uniqueCustomers = distinctCustomers.length;
    const truncated = totalVisits > logs.length;
    const revenueTotalBaht = revenueCashBaht + revenuePackageBaht;

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        visitType: l.visitType,
        note: l.note,
        amountBaht: l.amountBaht != null ? String(l.amountBaht) : null,
        createdAt: l.createdAt.toISOString(),
        subscriptionId: l.subscriptionId,
        stylistName: l.stylist?.name ?? null,
        customer: {
          id: l.customer.id,
          phone: l.customer.phone,
          name: l.customer.name,
        },
      })),
      summary: {
        totalVisits,
        packageUses,
        cashWalkIns,
        uniqueCustomers,
        revenueCashBaht,
        revenuePackageBaht,
        revenueTotalBaht,
        cashRevenueComplete: cashSumOk,
      },
      meta: {
        year,
        month: monthParam === "all" ? "all" : monthParam,
        availableYears,
        truncated,
      },
    });
  } catch (e) {
    console.error("[barber/history]", e);
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
