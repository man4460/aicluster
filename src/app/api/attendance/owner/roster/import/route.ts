import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { parseAttendanceRosterImportFile } from "@/lib/attendance/roster-import";
import { normalizeAttendanceBranchCode } from "@/lib/attendance/branch-ensure";
import { clampShiftIndex } from "@/lib/attendance/shift";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

async function shiftCountForOwner(ownerUserId: string, trialSessionId: string): Promise<number> {
  const loc = await prisma.attendanceLocation.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { shifts: true } } },
  });
  return loc?._count.shifts ?? 0;
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "ต้องส่งไฟล์" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "เลือกไฟล์ Excel (.xls) หรือ CSV" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 2MB" }, { status: 400 });
  }

  const nShifts = await shiftCountForOwner(ctx.billingUserId, scope.trialSessionId);
  if (nShifts === 0) {
    return NextResponse.json(
      { error: "ยังไม่มีกะในระบบ — ตั้งค่าเวลากะที่เมนูตั้งค่าเช็คอินก่อน" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseAttendanceRosterImportFile(buf, file.name, nShifts);
  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return NextResponse.json({ error: parsed.errors[0], errors: parsed.errors }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const rowErrors: string[] = [...parsed.errors];

  const branchRows = await prisma.attendanceBranch.findMany({
    where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
    select: { id: true, code: true },
  });
  const branchByCode = new Map(branchRows.map((b) => [normalizeAttendanceBranchCode(b.code), b.id]));

  try {
    for (const row of parsed.rows) {
      const rosterShiftIndex = clampShiftIndex(row.rosterShiftIndex, nShifts);
      let homeBranchId: number | null | undefined;
      if (row.branchCode) {
        const bid = branchByCode.get(normalizeAttendanceBranchCode(row.branchCode));
        if (bid == null) {
          rowErrors.push(`เบอร์ ${row.phone}: ไม่พบรหัสสาขา «${row.branchCode}»`);
          continue;
        }
        homeBranchId = bid;
      } else {
        homeBranchId = null;
      }

      const existing = await prisma.attendanceRosterEntry.findFirst({
        where: {
          ownerUserId: ctx.billingUserId,
          trialSessionId: scope.trialSessionId,
          phone: row.phone,
        },
      });
      if (existing) {
        await prisma.attendanceRosterEntry.update({
          where: { id: existing.id },
          data: {
            displayName: row.displayName,
            rosterShiftIndex,
            isActive: row.isActive,
            homeBranchId,
          },
        });
        updated++;
      } else {
        await prisma.attendanceRosterEntry.create({
          data: {
            ownerUserId: ctx.billingUserId,
            trialSessionId: scope.trialSessionId,
            displayName: row.displayName,
            phone: row.phone,
            rosterShiftIndex,
            isActive: row.isActive,
            homeBranchId,
          },
        });
        created++;
      }
    }
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    throw e;
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    total: parsed.rows.length,
    errors: rowErrors.length > 0 ? rowErrors : undefined,
    message: `นำเข้าแล้ว — เพิ่ม ${created} · อัปเดต ${updated}${rowErrors.length ? ` · มีคำเตือน ${rowErrors.length} รายการ` : ""}`,
  });
}
