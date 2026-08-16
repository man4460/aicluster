import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import {
  BARBER_DURATION_PRESETS,
  barberNormalizeDurationMinutes,
} from "@/systems/barber/lib/booking-slots";

const PACKAGE_IMAGE_PREFIX = "/uploads/barber-packages/";

function normalizePackageImageUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  if (!t.startsWith(PACKAGE_IMAGE_PREFIX)) return null;
  if (t.includes("..") || t.includes("\\")) return null;
  return t.slice(0, 512);
}

function normalizePackageDuration(raw: unknown): number {
  const n = barberNormalizeDurationMinutes(raw, 30);
  if ((BARBER_DURATION_PRESETS as readonly number[]).includes(n)) return n;
  let best: number = BARBER_DURATION_PRESETS[0]!;
  let bestDiff = Math.abs(n - best);
  for (const p of BARBER_DURATION_PRESETS) {
    const d = Math.abs(n - p);
    if (d < bestDiff) {
      best = p;
      bestDiff = d;
    }
  }
  return best;
}

const patchSchema = z.object({
  name: z.string().min(1).max(191).optional(),
  price: z.number().finite().min(0).max(99_999_999).optional(),
  totalSessions: z.number().int().min(1).max(9999).optional(),
  imageUrl: z.union([z.string().max(512), z.null()]).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.barberPackage.findFirst({
    where: { id, ownerUserId: own.ownerId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const d = parsed.data;
  if (d.totalSessions !== undefined && d.totalSessions !== existing.totalSessions) {
    const hasSubs = await prisma.barberCustomerSubscription.count({
      where: { packageId: id, ownerUserId: own.ownerId },
    });
    if (hasSubs > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนจำนวนครั้งได้ — มีสมาชิกแพ็กเกจนี้แล้ว" },
        { status: 400 },
      );
    }
  }

  let imageUrl: string | null | undefined;
  if (d.imageUrl !== undefined) {
    if (d.imageUrl === null || d.imageUrl.trim() === "") {
      imageUrl = null;
    } else {
      const norm = normalizePackageImageUrl(d.imageUrl);
      if (!norm) {
        return NextResponse.json({ error: "รูปแพ็กเกจไม่ถูกต้อง" }, { status: 400 });
      }
      imageUrl = norm;
    }
  }

  const durationMinutes =
    d.durationMinutes !== undefined ? normalizePackageDuration(d.durationMinutes) : undefined;

  const p = await prisma.barberPackage.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name.trim() }),
      ...(d.price !== undefined && { price: d.price }),
      ...(d.totalSessions !== undefined && { totalSessions: d.totalSessions }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(durationMinutes !== undefined && { durationMinutes }),
    },
  });

  return NextResponse.json({
    package: {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
      imageUrl: p.imageUrl ?? null,
      durationMinutes: barberNormalizeDurationMinutes(p.durationMinutes, 30),
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const scope = await getBarberDataScope(own.ownerId);
  const existing = await prisma.barberPackage.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  try {
    await prisma.barberPackage.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "ลบไม่ได้ — ยังมีสมาชิกแพ็กเกจอ้างอิงอยู่" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
