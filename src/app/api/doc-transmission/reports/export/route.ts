import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";
import {
  DOC_CATEGORY_BY_KEY,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
} from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const academicYear = url.searchParams.get("year") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;

  const where: Prisma.DocTransmissionRecordWhereInput = {
    ownerUserId,
    trialSessionId,
    isDeleted: false,
  };
  if (category && ["ORDERS", "MEMOS", "INCOMING", "OUTGOING", "CIRCULARS"].includes(category)) {
    where.category = category as Prisma.DocTransmissionRecordWhereInput["category"];
  }
  if (academicYear) where.academicYear = academicYear;
  if (status && ["NORMAL", "IN_PROGRESS", "DONE", "CANCELED"].includes(status)) {
    where.status = status as Prisma.DocTransmissionRecordWhereInput["status"];
  }
  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    where.recordDate = {
      ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
    };
  }

  const items = await prisma.docTransmissionRecord.findMany({
    where,
    orderBy: [{ recordDate: "desc" }, { id: "desc" }],
    include: { department: { select: { name: true } } },
  });

  const headers = [
    "หมวดเอกสาร",
    "ปี",
    "เลขที่",
    "เรื่อง",
    "บุคคล/หน่วยงาน",
    "หน่วยงาน(แผนก)",
    "วันที่",
    "กำหนดเสร็จ",
    "สถานะ",
    "ความเร่งด่วน",
    "ผู้รับมอบ",
    "หน่วยงานผู้รับ",
    "Tracking",
    "Public link",
    "ไฟล์แนบ",
    "หมายเหตุ",
    "สร้างเมื่อ",
  ];

  const lines = items.map((r) =>
    [
      DOC_CATEGORY_BY_KEY[r.category]?.title ?? r.category,
      r.academicYear,
      r.docNumber,
      r.subject,
      r.person ?? "",
      r.department?.name ?? "",
      r.recordDate.toISOString().slice(0, 10),
      r.dueDate ? r.dueDate.toISOString().slice(0, 10) : "",
      DOC_STATUS_BY_KEY[r.status]?.label ?? r.status,
      DOC_PRIORITY_BY_KEY[r.priority]?.label ?? r.priority,
      r.assigneeName ?? "",
      r.assigneeDept ?? "",
      r.trackingCode,
      r.publicShareToken ? `/share/doc-transmission/${r.publicShareToken}` : "",
      r.attachmentName ?? "",
      r.note ?? "",
      r.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );

  // BOM สำหรับ Excel ภาษาไทย
  const csv = "\uFEFF" + [headers.join(","), ...lines].join("\n");
  const filename = `doc-transmission-${Date.now()}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
