import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { ensureBarberSingleVisitPackages } from "@/lib/trial/seed-barber";
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

const postSchema = z.object({
  name: z.string().min(1).max(191),
  price: z.number().finite().min(0).max(99_999_999),
  totalSessions: z.number().int().min(1).max(9999),
  imageUrl: z.string().trim().max(512).optional().nullable(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  await ensureBarberSingleVisitPackages(prisma, own.ownerId, scope.trialSessionId);
  const rows = await prisma.barberPackage.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: [{ totalSessions: "asc" }, { id: "desc" }],
  });

  return NextResponse.json({
    packages: rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
      imageUrl: p.imageUrl ?? null,
      durationMinutes: barberNormalizeDurationMinutes(p.durationMinutes, 30),
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (parsed.data.imageUrl != null && parsed.data.imageUrl.trim() !== "") {
    const norm = normalizePackageImageUrl(parsed.data.imageUrl);
    if (!norm) {
      return NextResponse.json({ error: "รูปแพ็กเกจไม่ถูกต้อง" }, { status: 400 });
    }
    imageUrl = norm;
  }

  const durationMinutes = normalizePackageDuration(parsed.data.durationMinutes ?? 30);

  const p = await prisma.barberPackage.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      totalSessions: parsed.data.totalSessions,
      imageUrl,
      durationMinutes,
    },
  });

  return NextResponse.json({
    package: {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
      imageUrl: p.imageUrl ?? null,
      durationMinutes: p.durationMinutes,
    },
  });
}
