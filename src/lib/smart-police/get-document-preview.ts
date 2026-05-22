import { prisma } from "@/lib/prisma";
import { buildSmartPoliceA4PreviewFromCase } from "@/lib/smart-police/document-a4-preview";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";

export async function getSmartPoliceDocumentPreview(
  ownerUserId: string,
  caseId: string,
  docId: string,
) {
  const row = await prisma.smartPoliceCase.findFirst({
    where: { id: caseId, ownerUserId },
    include: { parties: true, documents: true },
  });
  if (!row) return null;

  const docRow = row.documents.find((d) => d.id === docId);
  if (!docRow) return null;

  const profile = await getOrCreateSmartPoliceProfile(ownerUserId);
  const caseDetail = mapSmartPoliceCaseDetail(row);
  const document = caseDetail.documents.find((d) => d.id === docId);
  if (!document) return null;

  const { model, printHtml } = buildSmartPoliceA4PreviewFromCase({
    profile,
    caseDetail,
    document,
  });

  return { model, printHtml, caseDetail, profile };
}
