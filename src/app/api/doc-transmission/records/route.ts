import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";
import {
  generateUniqueTrackingCode,
  getOrCreateDocSettings,
  nextRunningSeq,
  pickPrefixes,
  prefixForCategory,
  resolveDocNumber,
} from "@/systems/doc-transmission/lib/doc-helpers";
import { DOC_CATEGORIES, defaultThaiAcademicYear } from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  category: z.enum(["ORDERS", "MEMOS", "INCOMING", "OUTGOING", "CIRCULARS"]),
  academicYear: z
    .string()
    .trim()
    .max(8)
    .regex(/^\d{4}$/u, "ปีต้องเป็นเลข 4 หลัก")
    .optional(),
  /** ถ้าไม่ส่ง → ระบบ auto จาก running */
  docNumber: z.string().trim().max(60).optional(),
  subject: z.string().trim().min(1).max(500),
  person: z.string().trim().max(255).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  recordDate: z.string().trim().min(1),
  dueDate: z.string().trim().nullable().optional(),
  status: z.enum(["NORMAL", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["NORMAL", "URGENT", "IMMEDIATE"]).optional(),
  assigneeName: z.string().trim().max(160).nullable().optional(),
  assigneeDept: z.string().trim().max(160).nullable().optional(),
  attachmentUrl: z.string().trim().max(512).nullable().optional(),
  attachmentName: z.string().trim().max(255).nullable().optional(),
  attachmentSize: z.number().int().nonnegative().optional(),
  note: z.string().trim().max(4000).nullable().optional(),
});

const QuerySchema = z.object({
  category: z.enum(["ORDERS", "MEMOS", "INCOMING", "OUTGOING", "CIRCULARS"]).optional(),
  academicYear: z.string().trim().max(8).optional(),
  status: z.enum(["NORMAL", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["NORMAL", "URGENT", "IMMEDIATE"]).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(200).optional(),
  /** ISO date inclusive */
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  /** เริ่มที่ 1 */
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "พารามิเตอร์ไม่ถูกต้อง" }, { status: 400 });
  }
  const q = parsed.data;

  const where: Prisma.DocTransmissionRecordWhereInput = {
    ownerUserId,
    trialSessionId,
    isDeleted: false,
  };
  if (q.category) where.category = q.category;
  if (q.academicYear) where.academicYear = q.academicYear;
  if (q.status) where.status = q.status;
  if (q.priority) where.priority = q.priority;
  if (q.departmentId) where.departmentId = q.departmentId;
  const dateFrom = parseDate(q.dateFrom ?? null);
  const dateTo = parseDate(q.dateTo ?? null);
  if (dateFrom || dateTo) {
    where.recordDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }
  if (q.q) {
    const term = q.q.trim();
    where.OR = [
      { subject: { contains: term } },
      { docNumber: { contains: term } },
      { person: { contains: term } },
      { assigneeName: { contains: term } },
      { trackingCode: { contains: term } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.docTransmissionRecord.count({ where }),
    prisma.docTransmissionRecord.findMany({
      where,
      orderBy: [{ recordDate: "desc" }, { id: "desc" }],
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);

  return NextResponse.json({
    items: items.map((r) => ({
      ...r,
      id: r.id.toString(),
    })),
    total,
    page: q.page,
    pageSize: q.pageSize,
  });
}

export async function POST(req: Request) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const recordDate = parseDate(data.recordDate);
  if (!recordDate) {
    return NextResponse.json({ error: "วันที่เอกสารไม่ถูกต้อง" }, { status: 400 });
  }
  const dueDate = parseDate(data.dueDate ?? null);

  if (!DOC_CATEGORIES.includes(data.category)) {
    return NextResponse.json({ error: "หมวดเอกสารไม่ถูกต้อง" }, { status: 400 });
  }

  const setting = await getOrCreateDocSettings(ownerUserId, trialSessionId);
  const academicYear = data.academicYear?.trim() || setting.defaultYear || defaultThaiAcademicYear();
  const prefixes = pickPrefixes(setting);
  const prefix = prefixForCategory(prefixes, data.category);

  // ตรวจ department ว่าอยู่ในขอบเขตเดียวกัน
  if (data.departmentId) {
    const dept = await prisma.docTransmissionDepartment.findFirst({
      where: { id: data.departmentId, ownerUserId, trialSessionId },
      select: { id: true },
    });
    if (!dept) {
      return NextResponse.json({ error: "ไม่พบหน่วยงาน" }, { status: 400 });
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const seq = await nextRunningSeq(tx, {
        ownerUserId,
        trialSessionId,
        category: data.category,
        academicYear,
      });
      const trackingCode = await generateUniqueTrackingCode(tx, {
        ownerUserId,
        trialSessionId,
        trackPrefix: prefixes.track,
        category: data.category,
        seq,
      });
      const docNumber = resolveDocNumber({
        prefix,
        year: academicYear,
        seq,
        override: data.docNumber ?? null,
      });

      const record = await tx.docTransmissionRecord.create({
        data: {
          ownerUserId,
          trialSessionId,
          category: data.category,
          academicYear,
          runningSeq: seq,
          docNumber,
          subject: data.subject,
          person: data.person ?? null,
          departmentId: data.departmentId ?? null,
          recordDate,
          dueDate,
          status: data.status ?? "NORMAL",
          priority: data.priority ?? "NORMAL",
          assigneeName: data.assigneeName ?? null,
          assigneeDept: data.assigneeDept ?? null,
          attachmentUrl: data.attachmentUrl ?? null,
          attachmentName: data.attachmentName ?? null,
          trackingCode,
          note: data.note ?? null,
        },
      });

      // ลง revision แรกถ้ามีไฟล์
      if (data.attachmentUrl && data.attachmentName) {
        await tx.docTransmissionAttachmentRevision.create({
          data: {
            recordId: record.id,
            ownerUserId,
            trialSessionId,
            fileUrl: data.attachmentUrl,
            fileName: data.attachmentName,
            fileSize: data.attachmentSize ?? null,
            mimeType: "application/pdf",
            versionNo: 1,
            uploadedByUserId: actorUserId,
            uploadedByName: actorName,
          },
        });
      }

      // ลง timeline CREATED
      await tx.docTransmissionTimelineEntry.create({
        data: {
          recordId: record.id,
          ownerUserId,
          trialSessionId,
          action: "CREATED",
          actorUserId,
          actorName,
        },
      });

      // audit log
      await tx.docTransmissionAuditLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          recordId: record.id,
          action: "CREATE",
          actorUserId,
          actorName,
          snapshot: {
            after: {
              category: record.category,
              docNumber: record.docNumber,
              subject: record.subject,
              status: record.status,
            },
          } as Prisma.InputJsonValue,
        },
      });

      return record;
    });

    return NextResponse.json({
      record: { ...created, id: created.id.toString() },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "เลขที่หนังสือซ้ำ — ลองอีกครั้งหรือกรอกเลขที่เอง" },
        { status: 409 },
      );
    }
    console.error("[doc-transmission/records POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
