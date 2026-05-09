import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(160),
  contactPerson: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  address: z.string().trim().max(2000).nullable().optional(),
  taxId: z.string().trim().max(40).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const items = await prisma.assetSupplier.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: [{ id: "asc" }],
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
    item = await prisma.assetSupplier.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        taxId: data.taxId ?? null,
        isActive: data.isActive ?? true,
      },
    });
  } else {
    item = await prisma.assetSupplier.create({
      data: {
        ownerUserId,
        trialSessionId,
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        taxId: data.taxId ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }
  return NextResponse.json({ item });
}
