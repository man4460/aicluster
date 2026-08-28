import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { isPrismaSchemaMismatchError, isPrismaClientValidationSyncError, PRISMA_FULL_SYNC_HINT_TH, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { isValidRosterPhotoUrl } from "@/lib/attendance/roster-photo-url";
import { parseFaceDescriptorBank } from "@/lib/attendance/face-descriptor";
import { clampShiftIndex, formatShiftSlotLabel } from "@/lib/attendance/shift";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

async function shiftCountForOwner(ownerUserId: string, trialSessionId: string): Promise<number> {
  const loc = await prisma.attendanceLocation.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { shifts: true } } },
  });
  return loc?._count.shifts ?? 0;
}

const postSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  phone: z.string().min(9).max(20),
  rosterShiftIndex: z.number().int().min(0).max(4).optional(),
  photoUrl: z.union([z.string().max(512), z.null()]).optional(),
  /** null = ทุกสาขา · number = สาขาประจำ */
  homeBranchId: z.union([z.number().int().positive(), z.null()]).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  try {
    const [rows, loc, branches] = await Promise.all([
      prisma.attendanceRosterEntry.findMany({
        where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
        orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
        take: 2500,
        include: {
          homeBranch: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.attendanceLocation.findFirst({
        where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
        orderBy: { sortOrder: "asc" },
        include: { shifts: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.attendanceBranch.findMany({
        where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId, isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const shiftSlots = (loc?.shifts ?? []).map((s, i) => ({
      index: i,
      label: `กะ ${i + 1} (${formatShiftSlotLabel(s)})`,
    }));

    return NextResponse.json({
      shiftSlots,
      branches,
      entries: rows.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        phone: r.phone,
        isActive: r.isActive,
        rosterShiftIndex: typeof r.rosterShiftIndex === "number" ? r.rosterShiftIndex : 0,
        homeBranchId: r.homeBranchId ?? null,
        homeBranchName: r.homeBranch?.name ?? null,
        homeBranchCode: r.homeBranch?.code ?? null,
        photoUrl: r.photoUrl ?? null,
        faceEnrolled: Boolean(r.faceDescriptorJson),
        faceEnrolledAt: r.faceEnrolledAt?.toISOString() ?? null,
        faceSampleCount: parseFaceDescriptorBank(r.faceDescriptorJson)?.length ?? 0,
        fingerprintSlot: r.fingerprintSlot ?? null,
        fingerprintEnrolledAt: r.fingerprintEnrolledAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance roster GET] schema mismatch", e);
      return NextResponse.json(
        { error: PRISMA_SYNC_HINT_TH, shiftSlots: [], branches: [], entries: [] },
        { status: 503 },
      );
    }
    if (isPrismaClientValidationSyncError(e)) {
      console.error("[attendance roster GET] client out of sync", e);
      return NextResponse.json(
        { error: PRISMA_FULL_SYNC_HINT_TH, shiftSlots: [], branches: [], entries: [] },
        { status: 503 },
      );
    }
    console.error("[attendance roster GET]", e);
    return NextResponse.json({ error: "โหลดรายชื่อไม่สำเร็จ — ลองรีเฟรชหรือรีสตาร์ทเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });

  const nShifts = await shiftCountForOwner(ctx.billingUserId, scope.trialSessionId);
  if (nShifts === 0) {
    return NextResponse.json(
      { error: "ยังไม่มีกะในระบบ — ตั้งค่าเวลากะที่เมนูตั้งค่าเช็คอินก่อน" },
      { status: 400 },
    );
  }
  const rosterShiftIndex = clampShiftIndex(parsed.data.rosterShiftIndex ?? 0, nShifts);

  if (parsed.data.homeBranchId != null) {
    const okBranch = await prisma.attendanceBranch.count({
      where: {
        id: parsed.data.homeBranchId,
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (okBranch === 0) {
      return NextResponse.json({ error: "สาขาประจำไม่ถูกต้อง" }, { status: 400 });
    }
  }

  let photoUrl: string | null | undefined;
  if (parsed.data.photoUrl !== undefined) {
    if (parsed.data.photoUrl === null) {
      photoUrl = null;
    } else {
      const t = parsed.data.photoUrl.trim();
      photoUrl = t === "" ? null : t;
      if (photoUrl !== null && !isValidRosterPhotoUrl(photoUrl)) {
        return NextResponse.json({ error: "ลิงก์รูปไม่ถูกต้อง" }, { status: 400 });
      }
    }
  }

  try {
    const row = await prisma.attendanceRosterEntry.create({
      data: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
        displayName: parsed.data.displayName,
        phone,
        isActive: true,
        rosterShiftIndex,
        ...(parsed.data.homeBranchId !== undefined ? { homeBranchId: parsed.data.homeBranchId } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      },
    });
    return NextResponse.json({
      entry: {
        id: row.id,
        displayName: row.displayName,
        phone: row.phone,
        isActive: row.isActive,
        rosterShiftIndex: row.rosterShiftIndex,
        homeBranchId: row.homeBranchId ?? null,
        photoUrl: row.photoUrl ?? null,
      },
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance roster POST] schema mismatch", e);
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    return NextResponse.json({ error: "เบอร์นี้มีในรายชื่อแล้ว" }, { status: 400 });
  }
}
