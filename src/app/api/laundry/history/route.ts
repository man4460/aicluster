import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { bangkokRangeForCalendarFilter } from "@/lib/barber/bangkok-day";
import {
  barberFinanceRangeBounds,
  barberFinanceRangeToCalendarFilter,
  parseBarberFinanceRange,
} from "@/lib/barber/finance-range";
import {
  parseHistoryDayParam,
  parseHistoryMonthParam,
} from "@/lib/barber/history-calendar-query";
import { bangkokDateKey } from "@/lib/time/bangkok";

type LaundryLogWithCustomer = Prisma.LaundryServiceLogGetPayload<{
  include: {
    customer: true;
    subscription: { include: { package: { select: { name: true; description: true } } } };
  };
}>;

const LIST_CAP = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeLaundrySlipUrl(
  stored: string | null | undefined,
  requestOrigin: string,
): string | null {
  if (!stored?.trim()) return null;
  const u = stored.trim();
  if (u.startsWith("/uploads/laundry/")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const p = new URL(u);
      if (p.pathname.startsWith("/uploads/laundry/")) {
        return requestOrigin ? new URL(p.pathname, requestOrigin).pathname : p.pathname;
      }
      return u;
    } catch {
      return u;
    }
  }
  return u;
}

async function distinctBangkokYearsForLaundryOwner(
  ownerId: string,
  trialSessionId: string,
): Promise<number[]> {
  const bounds = await prisma.laundryServiceLog.aggregate({
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

async function resolveLaundryHistoryCalendarFromSearchParams(
  ownerId: string,
  trialSessionId: string,
  searchParams: URLSearchParams,
) {
  const key = bangkokDateKey();
  const defY = Number(key.split("-")[0]);

  const dbYears = await distinctBangkokYearsForLaundryOwner(ownerId, trialSessionId);
  const availableYears = [...new Set([...(dbYears.length > 0 ? dbYears : []), defY])].sort(
    (a, b) => a - b,
  );

  const financeRange = parseBarberFinanceRange(searchParams.get("range"));
  if (financeRange) {
    const from = (searchParams.get("from") ?? "").trim();
    const to = (searchParams.get("to") ?? "").trim();
    const bounds = barberFinanceRangeBounds(financeRange, from, to);
    const cal = barberFinanceRangeToCalendarFilter(financeRange, from, to);
    return {
      year: cal.year,
      month: cal.month,
      day: cal.day,
      availableYears,
      financeRange,
      rangeLabel: bounds.label,
      start: bounds.start,
      end: bounds.end,
    };
  }

  const monthParam = parseHistoryMonthParam(searchParams);
  const yearParam = Number(searchParams.get("year"));
  let year = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : defY;
  if (!availableYears.includes(year)) {
    year = availableYears[availableYears.length - 1]!;
  }

  const dayParam = parseHistoryDayParam(searchParams, year, monthParam);
  const { start, end } = bangkokRangeForCalendarFilter(year, monthParam, dayParam);
  let rangeLabel = String(year);
  if (monthParam === "all") rangeLabel = `ปี ${year}`;
  else if (dayParam === "all") rangeLabel = `เดือน ${monthParam}/${year}`;
  else rangeLabel = `${dayParam}/${monthParam}/${year}`;

  return {
    year,
    month: monthParam,
    day: dayParam,
    availableYears,
    financeRange: null as ReturnType<typeof parseBarberFinanceRange>,
    rangeLabel,
    start,
    end,
  };
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
      SELECT COALESCE(SUM(CAST(lp.base_price AS DECIMAL(14, 4)) / NULLIF(lp.total_sessions, 0)), 0) AS total
      FROM laundry_service_logs l
      INNER JOIN laundry_customer_subscriptions cs ON l.subscription_id = cs.id
      INNER JOIN laundry_packages lp ON cs.package_id = lp.id
      WHERE l.owner_id = ${ownerId}
        AND l.trial_session_id = ${trialSessionId}
        AND l.visit_type = 'PACKAGE_USE'
        AND l.created_at >= ${start}
        AND l.created_at < ${end}
    `;
    return Number(row[0]?.total ?? 0);
  }
  const row = await prisma.$queryRaw<[{ total: unknown }]>`
    SELECT COALESCE(SUM(CAST(lp.base_price AS DECIMAL(14, 4)) / NULLIF(lp.total_sessions, 0)), 0) AS total
    FROM laundry_service_logs l
    INNER JOIN laundry_customer_subscriptions cs ON l.subscription_id = cs.id
    INNER JOIN laundry_packages lp ON cs.package_id = lp.id
    INNER JOIN laundry_customers c ON l.laundry_customer_id = c.id
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
      SELECT COALESCE(SUM(CAST(lp.base_price AS DECIMAL(14, 4))), 0) AS total
      FROM laundry_customer_subscriptions cs
      INNER JOIN laundry_packages lp ON cs.package_id = lp.id
      WHERE cs.owner_id = ${ownerId}
        AND cs.trial_session_id = ${trialSessionId}
        AND cs.created_at >= ${start}
        AND cs.created_at < ${end}
    `;
    return Number(row[0]?.total ?? 0);
  }
  const row = await prisma.$queryRaw<[{ total: unknown }]>`
    SELECT COALESCE(SUM(CAST(lp.base_price AS DECIMAL(14, 4))), 0) AS total
    FROM laundry_customer_subscriptions cs
    INNER JOIN laundry_packages lp ON cs.package_id = lp.id
    INNER JOIN laundry_customers c ON cs.laundry_customer_id = c.id
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
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const requestOrigin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  try {
    const {
      year,
      month: monthParam,
      day: dayParam,
      availableYears,
      financeRange,
      rangeLabel,
      start,
      end,
    } = await resolveLaundryHistoryCalendarFromSearchParams(ownerId, scope.trialSessionId, searchParams);

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
      console.error("[laundry/history] package revenue", e);
    }
    try {
      revenueNewPackageBaht = await sumNewPackageSalesBaht(ownerId, scope.trialSessionId, start, end, q);
    } catch (e) {
      console.error("[laundry/history] new package sales revenue", e);
    }

    let revenueCashBaht = 0;
    let cashSumOk = true;
    const [totalVisits, packageUses, packageSales, cashWalkIns, distinctCustomers] = await Promise.all([
      prisma.laundryServiceLog.count({ where }),
      prisma.laundryServiceLog.count({ where: { ...where, visitType: "PACKAGE_USE" } }),
      prisma.laundryServiceLog.count({ where: { ...where, visitType: "PACKAGE_SALE" } }),
      prisma.laundryServiceLog.count({ where: { ...where, visitType: "CASH_WALK_IN" } }),
      prisma.laundryServiceLog.groupBy({
        by: ["laundryCustomerId"],
        where,
      }),
    ]);

    let logs: LaundryLogWithCustomer[];
    try {
      logs = await prisma.laundryServiceLog.findMany({
        where,
        include: {
          customer: true,
          subscription: { include: { package: { select: { name: true, description: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: LIST_CAP,
      });
    } catch (e) {
      console.error("[laundry/history] findMany — fallback ถ้ายังไม่มีคอลัมน์ใหม่", e);
      const rows = await prisma.laundryServiceLog.findMany({
        where,
        select: {
          id: true,
          ownerUserId: true,
          visitType: true,
          note: true,
          createdAt: true,
          subscriptionId: true,
          laundryCustomerId: true,
          receiptImageUrl: true,
          customer: true,
          subscription: { include: { package: { select: { name: true, description: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: LIST_CAP,
      });
      logs = rows.map((r) => ({
        ...r,
        amountBaht: null,
        paymentMethod: null,
        revenueCategoryId: null,
      })) as LaundryLogWithCustomer[];
    }

    try {
      const cashSumRow = await prisma.laundryServiceLog.aggregate({
        where: { ...where, visitType: "CASH_WALK_IN" },
        _sum: { amountBaht: true },
      });
      revenueCashBaht = Number(cashSumRow._sum.amountBaht ?? 0);
    } catch (e) {
      cashSumOk = false;
      console.error("[laundry/history] cash sum (ตรวจสอบ migration คอลัมน์ amount_baht)", e);
    }

    const uniqueCustomers = distinctCustomers.length;
    const truncated = totalVisits > logs.length;
    const revenueTotalBaht = revenueCashBaht + revenueNewPackageBaht;

    return NextResponse.json({
      logs: logs.map((l) => {
        const pkgName =
          l.subscription?.package?.name?.trim() ||
          (l.visitType === "PACKAGE_USE" || l.visitType === "PACKAGE_SALE" ? l.note?.trim() : null) ||
          null;
        const pkgDesc = l.subscription?.package?.description?.trim() || null;
        return {
          id: l.id,
          visitType: l.visitType,
          note: l.note,
          packageName: pkgName,
          packageDescription: pkgDesc,
          amountBaht: l.amountBaht != null ? String(l.amountBaht) : null,
          receiptImageUrl: normalizeLaundrySlipUrl(l.receiptImageUrl, requestOrigin),
          paymentMethod: l.paymentMethod ?? null,
          createdAt: l.createdAt.toISOString(),
          subscriptionId: l.subscriptionId,
          customer: {
            id: l.customer.id,
            phone: l.customer.phone,
            name: l.customer.name,
            taxInvoiceEnabled: Boolean(l.customer.taxInvoiceEnabled),
            billingName: l.customer.billingName ?? "",
            taxId: l.customer.taxId ?? "",
            taxAddress: l.customer.taxAddress ?? "",
            taxBranch: l.customer.taxBranch ?? "",
          },
        };
      }),
      summary: {
        totalVisits,
        packageUses,
        packageSales,
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
        range: financeRange,
        rangeLabel,
        from: start.toISOString(),
        to: end.toISOString(),
      },
    });
  } catch (e) {
    console.error("[laundry/history]", e);
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
