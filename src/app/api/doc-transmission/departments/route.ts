import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const UpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(160),
  contactPerson: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  isInternal: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const items = await prisma.docTransmissionDepartment.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await withDocOwnerContext();
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
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  let item;
  if (data.id) {
    const found = await prisma.docTransmissionDepartment.findFirst({
      where: { id: data.id, ownerUserId, trialSessionId },
      select: { id: true },
    });
    if (!found) return NextResponse.json({ error: "ไม่พบหน่วยงาน" }, { status: 404 });
    item = await prisma.docTransmissionDepartment.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        isInternal: data.isInternal ?? true,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  } else {
    item = await prisma.docTransmissionDepartment.create({
      data: {
        ownerUserId,
        trialSessionId,
        code: data.code,
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        isInternal: data.isInternal ?? true,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }
  return NextResponse.json({ item });
}
