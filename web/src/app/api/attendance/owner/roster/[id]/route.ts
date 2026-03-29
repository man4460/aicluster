import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { clampShiftIndex } from "@/lib/attendance/shift";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  rosterShiftIndex: z.number().int().min(0).max(4).optional(),
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

  const row = await prisma.attendanceRosterEntry.update({
    where: { id },
    data: {
      ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.rosterShiftIndex !== undefined ? { rosterShiftIndex: nextRosterShiftIndex } : {}),
    },
  });

  return NextResponse.json({
    entry: {
      id: row.id,
      displayName: row.displayName,
      phone: row.phone,
      isActive: row.isActive,
      rosterShiftIndex: row.rosterShiftIndex,
    },
  });
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
