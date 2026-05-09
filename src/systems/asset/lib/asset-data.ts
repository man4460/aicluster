import { prisma } from "@/lib/prisma";
import type {
  AssetCondition,
  AssetMaintenanceStatus,
  AssetStatus,
} from "@/generated/prisma/enums";
import { calcStraightLineValue } from "@/systems/asset/lib/asset-types";

export type AssetScopeArgs = {
  ownerUserId: string;
  trialSessionId: string;
};

export type AssetDashboardData = {
  totalAssets: number;
  totalValue: number;
  currentValue: number;
  byStatus: Record<AssetStatus, number>;
  byCondition: Record<AssetCondition, number>;
  byCategory: Array<{ id: number; name: string; count: number; value: number }>;
  byDepartment: Array<{ id: number; name: string; count: number; value: number }>;
  alerts: {
    warrantyExpiring: Array<{
      id: number;
      assetCode: string;
      assetName: string;
      warrantyUntil: Date | null;
      daysLeft: number;
    }>;
    inRepair: Array<{
      id: bigint;
      maintenanceCode: string;
      assetCode: string;
      assetName: string;
      startDate: Date;
    }>;
    auditMismatch: Array<{
      id: bigint;
      auditCode: string;
      assetCode: string;
      assetName: string;
      auditDate: Date;
      note: string | null;
    }>;
  };
  recentActivity: Array<{
    kind: "transaction" | "maintenance" | "audit" | "disposal";
    id: string;
    code: string;
    title: string;
    detail: string;
    date: Date;
  }>;
  monthlyValue30d: Array<{
    monthLabel: string;
    purchaseValue: number;
    count: number;
  }>;
};

export async function loadAssetDashboard(scope: AssetScopeArgs): Promise<AssetDashboardData> {
  const where = {
    ownerUserId: scope.ownerUserId,
    trialSessionId: scope.trialSessionId,
    isDeleted: false,
  } as const;

  const [
    assets,
    categories,
    departments,
    activeMaintenances,
    recentTransactions,
    recentMaintenances,
    recentAudits,
    recentDisposals,
    auditMismatches,
  ] = await Promise.all([
    prisma.asset.findMany({
      where,
      select: {
        id: true,
        assetCode: true,
        assetName: true,
        categoryId: true,
        departmentId: true,
        purchaseDate: true,
        purchasePrice: true,
        depreciationYears: true,
        warrantyUntil: true,
        status: true,
        condition: true,
        createdAt: true,
      },
    }),
    prisma.assetCategory.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.assetDepartment.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.assetMaintenance.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        status: "IN_PROGRESS",
      },
      select: {
        id: true,
        maintenanceCode: true,
        startDate: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    prisma.assetTransaction.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: {
        id: true,
        transactionCode: true,
        type: true,
        transactionDate: true,
        toHolderName: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
    }),
    prisma.assetMaintenance.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: {
        id: true,
        maintenanceCode: true,
        startDate: true,
        type: true,
        status: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    prisma.assetAudit.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: {
        id: true,
        auditCode: true,
        auditDate: true,
        status: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { auditDate: "desc" },
      take: 5,
    }),
    prisma.assetDisposal.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
      select: {
        id: true,
        disposalCode: true,
        disposalDate: true,
        method: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { disposalDate: "desc" },
      take: 5,
    }),
    prisma.assetAudit.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        status: { in: ["MISMATCH", "MISSING"] },
      },
      select: {
        id: true,
        auditCode: true,
        auditDate: true,
        note: true,
        asset: { select: { assetCode: true, assetName: true } },
      },
      orderBy: { auditDate: "desc" },
      take: 5,
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const depMap = new Map(departments.map((d) => [d.id, d.name]));

  const byStatus: Record<AssetStatus, number> = {
    AVAILABLE: 0,
    IN_USE: 0,
    BORROWED: 0,
    IN_REPAIR: 0,
    DISPOSED: 0,
  };
  const byCondition: Record<AssetCondition, number> = {
    GOOD: 0,
    FAIR: 0,
    POOR: 0,
    BROKEN: 0,
  };
  const byCategoryMap = new Map<number | "uncat", { name: string; count: number; value: number }>();
  const byDepartmentMap = new Map<number | "undept", { name: string; count: number; value: number }>();
  const monthly = new Map<string, { count: number; purchaseValue: number }>();

  let totalValue = 0;
  let currentValue = 0;
  const now = new Date();

  for (const a of assets) {
    byStatus[a.status]++;
    byCondition[a.condition]++;
    const price = Number(a.purchasePrice ?? 0);
    totalValue += price;
    const cv = calcStraightLineValue({
      purchasePrice: price,
      purchaseDate: a.purchaseDate,
      depreciationYears: a.depreciationYears,
      asOf: now,
    });
    currentValue += cv;

    const catKey = a.categoryId ?? "uncat";
    const catName = a.categoryId ? catMap.get(a.categoryId) ?? "—" : "ไม่ระบุหมวด";
    const cat = byCategoryMap.get(catKey) ?? { name: catName, count: 0, value: 0 };
    cat.count++;
    cat.value += price;
    byCategoryMap.set(catKey, cat);

    const depKey = a.departmentId ?? "undept";
    const depName = a.departmentId ? depMap.get(a.departmentId) ?? "—" : "ไม่ระบุแผนก";
    const dep = byDepartmentMap.get(depKey) ?? { name: depName, count: 0, value: 0 };
    dep.count++;
    dep.value += price;
    byDepartmentMap.set(depKey, dep);

    if (a.purchaseDate) {
      const d = a.purchaseDate;
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const m = monthly.get(ym) ?? { count: 0, purchaseValue: 0 };
      m.count++;
      m.purchaseValue += price;
      monthly.set(ym, m);
    }
  }

  const byCategory = [...byCategoryMap.entries()]
    .map(([id, v]) => ({
      id: typeof id === "number" ? id : 0,
      name: v.name,
      count: v.count,
      value: v.value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const byDepartment = [...byDepartmentMap.entries()]
    .map(([id, v]) => ({
      id: typeof id === "number" ? id : 0,
      name: v.name,
      count: v.count,
      value: v.value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const monthlyValue30d = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([ym, v]) => {
      const [y, m] = ym.split("-");
      const label = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" }).format(
        new Date(Number(y), Number(m) - 1, 1),
      );
      return { monthLabel: label, count: v.count, purchaseValue: v.purchaseValue };
    });

  // Warranty alerts (within 60 days)
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const warrantyExpiring = assets
    .filter((a) => a.warrantyUntil)
    .map((a) => {
      const diff = (a.warrantyUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return {
        id: a.id,
        assetCode: a.assetCode,
        assetName: a.assetName,
        warrantyUntil: a.warrantyUntil,
        daysLeft: Math.ceil(diff),
      };
    })
    .filter((w) => w.daysLeft >= -7 && w.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
  void sixtyDaysMs;

  const inRepair = activeMaintenances.map((m) => ({
    id: m.id,
    maintenanceCode: m.maintenanceCode,
    assetCode: m.asset.assetCode,
    assetName: m.asset.assetName,
    startDate: m.startDate,
  }));

  const auditMismatch = auditMismatches.map((a) => ({
    id: a.id,
    auditCode: a.auditCode,
    assetCode: a.asset.assetCode,
    assetName: a.asset.assetName,
    auditDate: a.auditDate,
    note: a.note,
  }));

  // Recent activity (merged feed)
  type Feed = AssetDashboardData["recentActivity"][number];
  const feed: Feed[] = [];
  for (const t of recentTransactions) {
    feed.push({
      kind: "transaction",
      id: `t-${t.id.toString()}`,
      code: t.transactionCode,
      title: `${t.type} · ${t.asset.assetName}`,
      detail: t.toHolderName ? `→ ${t.toHolderName}` : t.asset.assetCode,
      date: t.transactionDate,
    });
  }
  for (const m of recentMaintenances) {
    feed.push({
      kind: "maintenance",
      id: `m-${m.id.toString()}`,
      code: m.maintenanceCode,
      title: `ซ่อม · ${m.asset.assetName}`,
      detail: `${m.type} · ${maintenanceStatusLabel(m.status)}`,
      date: m.startDate,
    });
  }
  for (const a of recentAudits) {
    feed.push({
      kind: "audit",
      id: `a-${a.id.toString()}`,
      code: a.auditCode,
      title: `ตรวจนับ · ${a.asset.assetName}`,
      detail: a.status,
      date: a.auditDate,
    });
  }
  for (const d of recentDisposals) {
    feed.push({
      kind: "disposal",
      id: `d-${d.id.toString()}`,
      code: d.disposalCode,
      title: `จำหน่ายออก · ${d.asset.assetName}`,
      detail: d.method,
      date: d.disposalDate,
    });
  }
  feed.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    totalAssets: assets.length,
    totalValue,
    currentValue,
    byStatus,
    byCondition,
    byCategory,
    byDepartment,
    alerts: {
      warrantyExpiring,
      inRepair,
      auditMismatch,
    },
    recentActivity: feed.slice(0, 10),
    monthlyValue30d,
  };
}

function maintenanceStatusLabel(s: AssetMaintenanceStatus): string {
  if (s === "IN_PROGRESS") return "กำลังซ่อม";
  if (s === "COMPLETED") return "เสร็จสิ้น";
  return "ยกเลิก";
}
