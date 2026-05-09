import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Public read-only endpoint — ไม่ต้อง auth ใช้ token เป็นกุญแจ */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16 || token.length > 64) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
  }

  const record = await prisma.docTransmissionRecord.findFirst({
    where: { publicShareToken: token, isDeleted: false },
    include: {
      department: { select: { name: true, code: true } },
      timelineEntries: { orderBy: { occurredAt: "asc" } },
    },
  });
  if (!record) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  // ตรวจ owner-level: ปิด share ทั้งระบบ → 403
  const setting = await prisma.docTransmissionSettings.findFirst({
    where: { ownerUserId: record.ownerUserId, trialSessionId: record.trialSessionId },
    select: { publicShareEnabled: true, orgName: true },
  });
  if (setting && !setting.publicShareEnabled) {
    return NextResponse.json({ error: "องค์กรปิดการแชร์ลิงก์ภายนอก" }, { status: 403 });
  }

  return NextResponse.json({
    record: {
      id: record.id.toString(),
      category: record.category,
      academicYear: record.academicYear,
      docNumber: record.docNumber,
      subject: record.subject,
      person: record.person,
      department: record.department,
      recordDate: record.recordDate,
      dueDate: record.dueDate,
      status: record.status,
      priority: record.priority,
      assigneeName: record.assigneeName,
      assigneeDept: record.assigneeDept,
      attachmentUrl: record.attachmentUrl,
      attachmentName: record.attachmentName,
      trackingCode: record.trackingCode,
      note: record.note,
      timelineEntries: record.timelineEntries.map((t) => ({
        id: t.id.toString(),
        action: t.action,
        note: t.note,
        actorName: t.actorName,
        occurredAt: t.occurredAt,
      })),
    },
    org: {
      name: setting?.orgName ?? null,
    },
  });
}
