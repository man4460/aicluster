import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  smartPoliceDaysSinceReceived,
  smartPoliceIsOverdue,
} from "@/lib/smart-police/case-ops";
import { summarizePartyNamesByRole } from "@/lib/smart-police/serialize";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const ownerUserId = gate.ctx.ownerUserId;
  const [totalCases, openCases, inProgress, closed, docAgg, printSum, recent, activeCases] =
    await Promise.all([
      prisma.smartPoliceCase.count({ where: { ownerUserId } }),
      prisma.smartPoliceCase.count({ where: { ownerUserId, status: "OPEN" } }),
      prisma.smartPoliceCase.count({ where: { ownerUserId, status: "IN_PROGRESS" } }),
      prisma.smartPoliceCase.count({ where: { ownerUserId, status: "CLOSED" } }),
      prisma.smartPoliceDocument.groupBy({
        by: ["kind"],
        where: { case: { ownerUserId } },
        _count: { _all: true },
      }),
      prisma.smartPoliceCase.aggregate({
        where: { ownerUserId },
        _sum: { printCount: true },
      }),
      prisma.smartPoliceCase.findMany({
        where: { ownerUserId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          priority: true,
          receivedAt: true,
          sentToProsecutorAt: true,
          updatedAt: true,
          parties: { select: { role: true, fullName: true, sortOrder: true } },
          _count: { select: { documents: true } },
        },
      }),
      prisma.smartPoliceCase.findMany({
        where: { ownerUserId, status: { in: ["OPEN", "IN_PROGRESS"] } },
        select: {
          priority: true,
          receivedAt: true,
          sentToProsecutorAt: true,
        },
      }),
    ]);

  let overdueCount = 0;
  let urgentCount = 0;
  let notSentToProsecutor = 0;
  for (const c of activeCases) {
    const days = smartPoliceDaysSinceReceived(c.receivedAt);
    if (smartPoliceIsOverdue(c.priority, days)) overdueCount += 1;
    if (c.priority === "URGENT" || c.priority === "HIGH") urgentCount += 1;
    if (!c.sentToProsecutorAt) notSentToProsecutor += 1;
  }

  return NextResponse.json({
    summary: {
      totalCases,
      openCases,
      inProgress,
      closed,
      totalPrints: printSum._sum.printCount ?? 0,
      overdueCount,
      urgentCount,
      notSentToProsecutor,
    },
    documentsByKind: docAgg.map((r) => ({
      kind: r.kind,
      count: r._count._all,
    })),
    recentCases: recent.map((c) => {
      const daysSinceReceived = smartPoliceDaysSinceReceived(c.receivedAt);
      return {
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        priority: c.priority,
        daysSinceReceived,
        overdue: smartPoliceIsOverdue(c.priority, daysSinceReceived),
        complainantName: summarizePartyNamesByRole(c.parties, "COMPLAINANT"),
        suspectName: summarizePartyNamesByRole(c.parties, "SUSPECT"),
        sentToProsecutorAt: c.sentToProsecutorAt?.toISOString() ?? null,
        documentCount: c._count.documents,
        updatedAt: c.updatedAt.toISOString(),
      };
    }),
  });
}
