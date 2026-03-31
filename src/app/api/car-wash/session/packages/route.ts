import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  price: z.number().int().min(0).max(9_999_999),
  duration_minutes: z.number().int().min(1).max(1440),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const rows = await prisma.carWashPackage.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({
    packages: rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      duration_minutes: r.durationMinutes,
      description: r.description,
      is_active: r.isActive,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashPackage.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      durationMinutes: parsed.data.duration_minutes,
      description: parsed.data.description?.trim() ?? "",
      isActive: parsed.data.is_active,
    },
  });
  return NextResponse.json({
    package: {
      id: row.id,
      name: row.name,
      price: row.price,
      duration_minutes: row.durationMinutes,
      description: row.description,
      is_active: row.isActive,
    },
  });
}
