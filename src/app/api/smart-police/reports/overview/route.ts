import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const ownerUserId = gate.ctx.ownerUserId;
  const [totalCases, openCases, inProgress, closed, docAgg, printSum, recent] = await Promise.all([
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
        updatedAt: true,
        _count: { select: { documents: true } },
      },
    }),
  ]);

  return NextResponse.json({
    summary: {
      totalCases,
      openCases,
      inProgress,
      closed,
      totalPrints: printSum._sum.printCount ?? 0,
    },
    documentsByKind: docAgg.map((r) => ({
      kind: r.kind,
      count: r._count._all,
    })),
    recentCases: recent.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      status: c.status,
      documentCount: c._count.documents,
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}
