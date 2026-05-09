import { Prisma } from "@/generated/prisma/client";
import type { DocCategory, DocPriority, DocStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DOC_CATEGORIES } from "@/systems/doc-transmission/lib/doc-types";

export type DocDashboardData = {
  totalAll: number;
  withAttachment: number;
  sharedCount: number;
  overdueCount: number;
  byCategory: Record<DocCategory, number>;
  byStatus: Record<DocStatus, number>;
  byPriority: Record<DocPriority, number>;
  recent: Array<{
    id: string;
    category: DocCategory;
    docNumber: string;
    subject: string;
    status: DocStatus;
    priority: DocPriority;
    recordDate: Date;
    person: string | null;
    departmentName: string | null;
    trackingCode: string;
  }>;
  overdue: Array<{
    id: string;
    category: DocCategory;
    docNumber: string;
    subject: string;
    status: DocStatus;
    dueDate: Date | null;
    person: string | null;
  }>;
  daily: Array<{ date: string; count: number }>;
};

export async function loadDocDashboard(args: {
  ownerUserId: string;
  trialSessionId: string;
  academicYear?: string | null;
}): Promise<DocDashboardData> {
  const baseWhere: Prisma.DocTransmissionRecordWhereInput = {
    ownerUserId: args.ownerUserId,
    trialSessionId: args.trialSessionId,
    isDeleted: false,
    ...(args.academicYear ? { academicYear: args.academicYear } : {}),
  };

  const [byCategoryRows, byStatusRows, byPriorityRows, recent, overdue, totalAll, withAttachment, sharedCount, overdueCount] =
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
        take: 8,
        include: { department: { select: { name: true, code: true } } },
      }),
      prisma.docTransmissionRecord.findMany({
        where: {
          ...baseWhere,
          status: { in: ["NORMAL", "IN_PROGRESS"] },
          dueDate: { not: null, lt: new Date() },
        },
        orderBy: [{ dueDate: "asc" }],
        take: 8,
      }),
      prisma.docTransmissionRecord.count({ where: baseWhere }),
      prisma.docTransmissionRecord.count({
        where: { ...baseWhere, attachmentUrl: { not: null } },
      }),
      prisma.docTransmissionRecord.count({
        where: { ...baseWhere, publicShareToken: { not: null } },
      }),
      prisma.docTransmissionRecord.count({
        where: {
          ...baseWhere,
          status: { in: ["NORMAL", "IN_PROGRESS"] },
          dueDate: { not: null, lt: new Date() },
        },
      }),
    ]);

  const byCategory: Record<DocCategory, number> = {
    ORDERS: 0,
    MEMOS: 0,
    INCOMING: 0,
    OUTGOING: 0,
    CIRCULARS: 0,
  };
  for (const c of DOC_CATEGORIES) {
    byCategory[c] = byCategoryRows.find((r) => r.category === c)?._count._all ?? 0;
  }

  const byStatus: Record<DocStatus, number> = {
    NORMAL: 0,
    IN_PROGRESS: 0,
    DONE: 0,
    CANCELED: 0,
  };
  for (const s of byStatusRows) byStatus[s.status] = s._count._all;

  const byPriority: Record<DocPriority, number> = {
    NORMAL: 0,
    URGENT: 0,
    IMMEDIATE: 0,
  };
  for (const p of byPriorityRows) byPriority[p.priority] = p._count._all;

  // 30-day buckets — daily count
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

  return {
    totalAll,
    withAttachment,
    sharedCount,
    overdueCount,
    byCategory,
    byStatus,
    byPriority,
    daily,
    recent: recent.map((r) => ({
      id: r.id.toString(),
      category: r.category,
      docNumber: r.docNumber,
      subject: r.subject,
      status: r.status,
      priority: r.priority,
      recordDate: r.recordDate,
      person: r.person,
      departmentName: r.department?.name ?? null,
      trackingCode: r.trackingCode,
    })),
    overdue: overdue.map((r) => ({
      id: r.id.toString(),
      category: r.category,
      docNumber: r.docNumber,
      subject: r.subject,
      status: r.status,
      dueDate: r.dueDate,
      person: r.person,
    })),
  };
}
