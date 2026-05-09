import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";
import { DocRecordDetailClient } from "@/systems/doc-transmission/components/DocRecordDetailClient";
import { DOC_CATEGORY_BY_SLUG } from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

export default async function DocRecordDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const category = DOC_CATEGORY_BY_SLUG[slug];
  if (!category) notFound();

  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDocTransmissionDataScope(session.sub);

  if (!/^\d+$/.test(id)) notFound();
  const idBig = BigInt(id);

  const record = await prisma.docTransmissionRecord.findFirst({
    where: {
      id: idBig,
      ownerUserId: session.sub,
      trialSessionId: scope.trialSessionId,
      isDeleted: false,
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      timelineEntries: { orderBy: { occurredAt: "asc" } },
      attachmentRevisions: { orderBy: { versionNo: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!record) notFound();

  const departments = await prisma.docTransmissionDepartment.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true },
  });

  return (
    <DocRecordDetailClient
      categorySlug={slug}
      departments={departments}
      initialRecord={{
        id: record.id.toString(),
        category: record.category,
        academicYear: record.academicYear,
        docNumber: record.docNumber,
        runningSeq: record.runningSeq,
        subject: record.subject,
        person: record.person,
        department: record.department,
        recordDate: record.recordDate.toISOString(),
        dueDate: record.dueDate ? record.dueDate.toISOString() : null,
        status: record.status,
        priority: record.priority,
        assigneeName: record.assigneeName,
        assigneeDept: record.assigneeDept,
        attachmentUrl: record.attachmentUrl,
        attachmentName: record.attachmentName,
        publicShareToken: record.publicShareToken,
        publicShareEnabledAt: record.publicShareEnabledAt
          ? record.publicShareEnabledAt.toISOString()
          : null,
        trackingCode: record.trackingCode,
        note: record.note,
        timelineEntries: record.timelineEntries.map((t) => ({
          id: t.id.toString(),
          action: t.action,
          fromStatus: t.fromStatus,
          toStatus: t.toStatus,
          note: t.note,
          actorName: t.actorName,
          occurredAt: t.occurredAt.toISOString(),
        })),
        attachmentRevisions: record.attachmentRevisions.map((r) => ({
          id: r.id.toString(),
          fileUrl: r.fileUrl,
          fileName: r.fileName,
          fileSize: r.fileSize,
          versionNo: r.versionNo,
          uploadedByName: r.uploadedByName,
          createdAt: r.createdAt.toISOString(),
          note: r.note,
        })),
        auditLogs: record.auditLogs.map((a) => ({
          id: a.id.toString(),
          action: a.action,
          actorName: a.actorName,
          createdAt: a.createdAt.toISOString(),
        })),
      }}
    />
  );
}
