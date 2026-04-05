import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { isValidRosterPhotoUrl } from "@/lib/attendance/roster-photo-url";
import { clampShiftIndex } from "@/lib/attendance/shift";
import {
  isPrismaClientValidationSyncError,
  isPrismaSchemaMismatchError,
  PRISMA_FULL_SYNC_HINT_TH,
  PRISMA_GENERATE_HINT_TH,
  PRISMA_SYNC_HINT_TH,
} from "@/lib/prisma-errors";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  rosterShiftIndex: z.number().int().min(0).max(4).optional(),
  photoUrl: z.union([z.string().max(512), z.null()]).optional(),
});

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function shiftCountForOwner(ownerUserId: string, trialSessionId: string): Promise<number> {
  const loc = await prisma.attendanceLocation.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { shifts: true } } },
  });
  return loc?._count.shifts ?? 0;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(mod.billingUserId);

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.attendanceRosterEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let nextRosterShiftIndex = existing.rosterShiftIndex;
  if (parsed.data.rosterShiftIndex !== undefined) {
    const nShifts = await shiftCountForOwner(mod.billingUserId, scope.trialSessionId);
    if (nShifts === 0) {
      return NextResponse.json(
        { error: "ยังไม่มีกะในระบบ — ตั้งค่าที่เมนูตั้งค่าก่อน" },
        { status: 400 },
      );
    }
    nextRosterShiftIndex = clampShiftIndex(parsed.data.rosterShiftIndex, nShifts);
  }

  let nextPhotoUrl: string | null | undefined;
  if (parsed.data.photoUrl !== undefined) {
    if (parsed.data.photoUrl === null) {
      nextPhotoUrl = null;
    } else {
      const t = parsed.data.photoUrl.trim();
      nextPhotoUrl = t === "" ? null : t;
      if (nextPhotoUrl !== null && !isValidRosterPhotoUrl(nextPhotoUrl)) {
        return NextResponse.json({ error: "ลิงก์รูปไม่ถูกต้อง" }, { status: 400 });
      }
    }
  }

  const data: {
    displayName?: string;
    isActive?: boolean;
    rosterShiftIndex?: number;
    photoUrl?: string | null;
  } = {
    ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
    ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    ...(parsed.data.rosterShiftIndex !== undefined ? { rosterShiftIndex: nextRosterShiftIndex } : {}),
    ...(nextPhotoUrl !== undefined ? { photoUrl: nextPhotoUrl } : {}),
  };

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีฟิลด์ที่อัปเดต" }, { status: 400 });
  }

  try {
    const row = await prisma.attendanceRosterEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      entry: {
        id: row.id,
        displayName: row.displayName,
        phone: row.phone,
        isActive: row.isActive,
        rosterShiftIndex: row.rosterShiftIndex,
        photoUrl: row.photoUrl ?? null,
      },
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance roster PATCH] schema mismatch", e);
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    if (isPrismaClientValidationSyncError(e)) {
      console.error("[attendance roster PATCH] prisma validation (มักต้อง generate)", e);
      return NextResponse.json({ error: PRISMA_GENERATE_HINT_TH }, { status: 503 });
    }
    console.error("[attendance roster PATCH]", e);
    return NextResponse.json(
      { error: `บันทึกไม่สำเร็จ — ${PRISMA_FULL_SYNC_HINT_TH}` },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(mod.billingUserId);

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.attendanceRosterEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.attendanceRosterEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
