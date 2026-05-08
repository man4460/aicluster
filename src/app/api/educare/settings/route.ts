import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const hhmm = z.string().regex(/^\d{1,2}:\d{2}$/);

const putSchema = z.object({
  schoolName: z.string().trim().max(120).optional().nullable(),
  schoolAddress: z.string().trim().max(500).optional().nullable(),
  schoolPhone: z.string().trim().max(40).optional().nullable(),
  assemblyTime: hhmm.optional(),
  tidinessTime: hhmm.optional(),
  milkTime: hhmm.optional(),
  mealTime: hhmm.optional(),
  brushingTime: hhmm.optional(),
  notifyAbsentEnabled: z.boolean().optional(),
});

function normHhmm(s: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return s;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mi = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

async function ensureSettings(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.educareSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;
  return prisma.educareSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
    },
  });
}

export async function GET() {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;
  const setting = await ensureSettings(r.ctx.ownerUserId, r.ctx.trialSessionId);
  return NextResponse.json({ setting });
}

export async function PUT(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await ensureSettings(r.ctx.ownerUserId, r.ctx.trialSessionId);

  const data: Record<string, unknown> = {};
  const p = parsed.data;
  if (p.schoolName !== undefined) data.schoolName = p.schoolName?.trim() || null;
  if (p.schoolAddress !== undefined) data.schoolAddress = p.schoolAddress?.trim() || null;
  if (p.schoolPhone !== undefined) data.schoolPhone = p.schoolPhone?.trim() || null;
  if (p.assemblyTime) data.assemblyTime = normHhmm(p.assemblyTime);
  if (p.tidinessTime) data.tidinessTime = normHhmm(p.tidinessTime);
  if (p.milkTime) data.milkTime = normHhmm(p.milkTime);
  if (p.mealTime) data.mealTime = normHhmm(p.mealTime);
  if (p.brushingTime) data.brushingTime = normHhmm(p.brushingTime);
  if (p.notifyAbsentEnabled !== undefined) data.notifyAbsentEnabled = p.notifyAbsentEnabled;

  const updated = await prisma.educareSettings.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
      },
    },
    data,
  });
  return NextResponse.json({ setting: updated });
}
