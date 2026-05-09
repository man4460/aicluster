import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  subject: z.string().trim().min(1).max(500).optional(),
  docNumber: z.string().trim().min(1).max(60).optional(),
  academicYear: z
    .string()
    .trim()
    .max(8)
    .regex(/^\d{4}$/u)
    .optional(),
  person: z.string().trim().max(255).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  recordDate: z.string().trim().optional(),
  dueDate: z.string().trim().nullable().optional(),
  status: z.enum(["NORMAL", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["NORMAL", "URGENT", "IMMEDIATE"]).optional(),
  assigneeName: z.string().trim().max(160).nullable().optional(),
  assigneeDept: z.string().trim().max(160).nullable().optional(),
  note: z.string().trim().max(4000).nullable().optional(),
});

function toBigInt(idStr: string): bigint | null {
  try {
    if (!/^\d+$/.test(idStr)) return null;
    return BigInt(idStr);
  } catch {
    return null;
  }
}

function parseDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const record = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
    include: {
      department: { select: { id: true, name: true, code: true } },
      timelineEntries: { orderBy: { occurredAt: "asc" } },
      attachmentRevisions: { orderBy: { versionNo: "desc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!record) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  return NextResponse.json({
    record: {
      ...record,
      id: record.id.toString(),
      timelineEntries: record.timelineEntries.map((t) => ({
        ...t,
        id: t.id.toString(),
        recordId: t.recordId.toString(),
      })),
      attachmentRevisions: record.attachmentRevisions.map((r) => ({
        ...r,
        id: r.id.toString(),
        recordId: r.recordId.toString(),
      })),
      auditLogs: record.auditLogs.map((a) => ({
        ...a,
        id: a.id.toString(),
        recordId: a.recordId?.toString() ?? null,
      })),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  if (parsed.data.departmentId) {
    const dept = await prisma.docTransmissionDepartment.findFirst({
      where: { id: parsed.data.departmentId, ownerUserId, trialSessionId },
      select: { id: true },
    });
    if (!dept) return NextResponse.json({ error: "ไม่พบหน่วยงาน" }, { status: 400 });
  }

  const data: Prisma.DocTransmissionRecordUpdateInput = {};
  if (parsed.data.subject !== undefined) data.subject = parsed.data.subject;
  if (parsed.data.docNumber !== undefined) data.docNumber = parsed.data.docNumber;
  if (parsed.data.academicYear !== undefined) data.academicYear = parsed.data.academicYear;
  if (parsed.data.person !== undefined) data.person = parsed.data.person;
  if (parsed.data.departmentId !== undefined) {
    data.department = parsed.data.departmentId
      ? { connect: { id: parsed.data.departmentId } }
      : { disconnect: true };
  }
  const recordDate = parseDate(parsed.data.recordDate);
  if (recordDate !== undefined) {
    if (recordDate === null) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }
    data.recordDate = recordDate;
  }
  const dueDate = parseDate(parsed.data.dueDate);
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.assigneeName !== undefined) data.assigneeName = parsed.data.assigneeName;
  if (parsed.data.assigneeDept !== undefined) data.assigneeDept = parsed.data.assigneeDept;
  if (parsed.data.note !== undefined) data.note = parsed.data.note;

  const statusChanged =
    parsed.data.status !== undefined && parsed.data.status !== existing.status;
  if (statusChanged && parsed.data.status) {
    data.status = parsed.data.status;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.docTransmissionRecord.update({
      where: { id: idBig },
      data,
    });
    if (statusChanged && parsed.data.status) {
      await tx.docTransmissionTimelineEntry.create({
        data: {
          recordId: idBig,
          ownerUserId,
          trialSessionId,
          action: "STATUS_CHANGED",
          fromStatus: existing.status,
          toStatus: parsed.data.status,
          actorUserId,
          actorName,
        },
      });
      await tx.docTransmissionAuditLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          recordId: idBig,
          action: "STATUS_CHANGE",
          actorUserId,
          actorName,
          snapshot: {
            before: { status: existing.status },
            after: { status: parsed.data.status },
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.docTransmissionAuditLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          recordId: idBig,
          action: "UPDATE",
          actorUserId,
          actorName,
          snapshot: {
            patch: parsed.data,
          } as Prisma.InputJsonValue,
        },
      });
    }
    return u;
  });

  return NextResponse.json({ record: { ...updated, id: updated.id.toString() } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true, docNumber: true, subject: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.docTransmissionRecord.update({
      where: { id: idBig },
      data: { isDeleted: true },
    });
    await tx.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: idBig,
        action: "DELETE",
        actorUserId,
        actorName,
        snapshot: {
          deleted: { docNumber: existing.docNumber, subject: existing.subject },
        } as Prisma.InputJsonValue,
      },
    });
  });
  return NextResponse.json({ ok: true });
}
