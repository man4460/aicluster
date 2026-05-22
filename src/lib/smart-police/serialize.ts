import type { Prisma } from "@/generated/prisma/client";
import type { SmartPoliceCaseDetail, SmartPoliceCaseListItem } from "@/lib/smart-police/types";

type CaseWithCounts = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  status: SmartPoliceCaseDetail["status"];
  incidentAt: Date | null;
  incidentPlace: string | null;
  summary: string | null;
  printCount: number;
  updatedAt: Date;
  _count?: { parties: number; documents: number };
};

export function mapSmartPoliceCaseListItem(row: CaseWithCounts): SmartPoliceCaseListItem {
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    title: row.title,
    caseType: row.caseType,
    status: row.status,
    incidentAt: row.incidentAt?.toISOString() ?? null,
    documentCount: row._count?.documents ?? 0,
    partyCount: row._count?.parties ?? 0,
    printCount: row.printCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapSmartPoliceCaseDetail(
  row: Prisma.SmartPoliceCaseGetPayload<{
    include: { parties: true; documents: true };
  }>,
): SmartPoliceCaseDetail {
  return {
    ...mapSmartPoliceCaseListItem({
      ...row,
      _count: { parties: row.parties.length, documents: row.documents.length },
    }),
    incidentPlace: row.incidentPlace,
    summary: row.summary,
    parties: row.parties
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        role: p.role,
        fullName: p.fullName,
        age: p.age,
        nationality: p.nationality,
        idCard: p.idCard,
        address: p.address,
        phone: p.phone,
        sortOrder: p.sortOrder,
      })),
    documents: row.documents
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        title: d.title,
        content: d.content,
        partyId: d.partyId,
        wordFileUrl: d.wordFileUrl,
        wordFileName: d.wordFileName,
        printCount: d.printCount,
        lastPrintedAt: d.lastPrintedAt?.toISOString() ?? null,
        sortOrder: d.sortOrder,
        updatedAt: d.updatedAt.toISOString(),
      })),
  };
}
