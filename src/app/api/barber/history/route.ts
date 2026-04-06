import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokRangeForCalendarFilter } from "@/lib/barber/bangkok-day";
import { resolveBarberHistoryCalendarFromSearchParams } from "@/lib/barber/history-calendar-query";

type BarberLogWithCustomer = Prisma.BarberServiceLogGetPayload<{
  include: { customer: true; stylist: true };
}>;

/** ไม่ดึงรายการทั้งหมด — จำกัดภายในระบบเท่านั้น */
const LIST_CAP = 120;

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

async function sumNewPackageSalesBaht(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
  q: string,
): Promise<number> {
  const like = `%${q}%`;
  if (q.length === 0) {
    const row = await prisma.$queryRaw<[{ total: unknown }]>`
      SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4))), 0) AS total
      FROM customer_subscriptions cs
      INNER JOIN barber_packages bp ON cs.package_id = bp.id
      WHERE cs.owner_id = ${ownerId}
        AND cs.trial_session_id = ${trialSessionId}
        AND cs.created_at >= ${start}
        AND cs.created_at < ${end}
    `;
    return Number(row[0]?.total ?? 0);
  }
  const row = await prisma.$queryRaw<[{ total: unknown }]>`
    SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4))), 0) AS total
    FROM customer_subscriptions cs
    INNER JOIN barber_packages bp ON cs.package_id = bp.id
    INNER JOIN barber_customers c ON cs.barber_customer_id = c.id
    WHERE cs.owner_id = ${ownerId}
      AND cs.trial_session_id = ${trialSessionId}
      AND cs.created_at >= ${start}
      AND cs.created_at < ${end}
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

  try {
    const { year, month: monthParam, day: dayParam, availableYears } =
      await resolveBarberHistoryCalendarFromSearchParams(ownerId, scope.trialSessionId, searchParams);

    const { start, end } = bangkokRangeForCalendarFilter(year, monthParam, dayParam);

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
    let revenueNewPackageBaht = 0;
    try {
      revenuePackageBaht = await sumPackageRevenueBaht(ownerId, scope.trialSessionId, start, end, q);
    } catch (e) {
      console.error("[barber/history] package revenue", e);
    }
    try {
      revenueNewPackageBaht = await sumNewPackageSalesBaht(ownerId, scope.trialSessionId, start, end, q);
    } catch (e) {
      console.error("[barber/history] new package sales revenue", e);
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
          receiptImageUrl: true,
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
    /** รายรับรวม = เงินสด + ขายแพ็กใหม่ — ไม่นับมูลค่าหักแพ็กต่อครั้ง (รับรู้ตอนขายแพ็กแล้ว) */
    const revenueTotalBaht = revenueCashBaht + revenueNewPackageBaht;

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        visitType: l.visitType,
        note: l.note,
        amountBaht: l.amountBaht != null ? String(l.amountBaht) : null,
        receiptImageUrl: l.receiptImageUrl ?? null,
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
        revenueNewPackageBaht,
        revenueTotalBaht,
        cashRevenueComplete: cashSumOk,
      },
      meta: {
        year,
        month: monthParam === "all" ? "all" : monthParam,
        day: monthParam === "all" ? "all" : dayParam === "all" ? "all" : dayParam,
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
