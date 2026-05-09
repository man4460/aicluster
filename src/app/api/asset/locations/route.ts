import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  building: z.string().trim().max(120).nullable().optional(),
  floor: z.string().trim().max(20).nullable().optional(),
  room: z.string().trim().max(40).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const items = await prisma.assetLocation.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let item;
  if (data.id) {
    item = await prisma.assetLocation.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        building: data.building ?? null,
        floor: data.floor ?? null,
        room: data.room ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  } else {
    item = await prisma.assetLocation.create({
      data: {
        ownerUserId,
        trialSessionId,
        code: data.code,
        name: data.name,
        building: data.building ?? null,
        floor: data.floor ?? null,
        room: data.room ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }
  return NextResponse.json({ item });
}
