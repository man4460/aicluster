import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";
import { DOC_CATEGORIES } from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const url = new URL(req.url);
  const academicYear = url.searchParams.get("year")?.trim() || undefined;

  const baseWhere: Prisma.DocTransmissionRecordWhereInput = {
    ownerUserId,
    trialSessionId,
    isDeleted: false,
    ...(academicYear ? { academicYear } : {}),
  };

  const [byCategory, byStatus, byPriority, recent, overdue, totalAll, withAttachment, sharedCount] =
    await Promise.all([
      prisma.docTransmissionRecord.groupBy({
        by: ["category"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.docTransmissionRecord.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.docTransmissionRecord.groupBy({
        by: ["priority"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.docTransmissionRecord.findMany({
        where: baseWhere,
        orderBy: [{ createdAt: "desc" }],
        take: 10,
        include: { department: { select: { name: true, code: true } } },
      }),
      prisma.docTransmissionRecord.findMany({
        where: {
          ...baseWhere,
          status: { in: ["NORMAL", "IN_PROGRESS"] },
          dueDate: { not: null, lt: new Date() },
        },
        orderBy: [{ dueDate: "asc" }],
        take: 10,
        include: { department: { select: { name: true, code: true } } },
      }),
      prisma.docTransmissionRecord.count({ where: baseWhere }),
      prisma.docTransmissionRecord.count({
        where: { ...baseWhere, attachmentUrl: { not: null } },
      }),
      prisma.docTransmissionRecord.count({
        where: { ...baseWhere, publicShareToken: { not: null } },
      }),
    ]);

  // ข้อมูล timeline 30 วันล่าสุด — count ต่อวัน
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const timelineRows = await prisma.docTransmissionRecord.findMany({
    where: { ...baseWhere, recordDate: { gte: since } },
    select: { recordDate: true },
  });
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const r of timelineRows) {
    const key = r.recordDate.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const daily = Array.from(dailyMap, ([date, count]) => ({ date, count }));

  return NextResponse.json({
    totalAll,
    withAttachment,
    sharedCount,
    byCategory: DOC_CATEGORIES.map((cat) => ({
      category: cat,
      count: byCategory.find((b) => b.category === cat)?._count._all ?? 0,
    })),
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })),
    byPriority: byPriority.map((b) => ({ priority: b.priority, count: b._count._all })),
    daily,
    recent: recent.map((r) => ({ ...r, id: r.id.toString() })),
    overdue: overdue.map((r) => ({ ...r, id: r.id.toString() })),
  });
}
