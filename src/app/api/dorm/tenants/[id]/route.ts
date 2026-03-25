import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import type { TenantStatus } from "@/generated/prisma/enums";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  idCard: z.string().min(1).max(13).optional(),
  status: z.enum(["ACTIVE", "MOVED_OUT"]).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseTenantId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function assertTenantOwner(ownerId: string, tenantId: number) {
  return prisma.tenant.findFirst({
    where: { id: tenantId, room: { ownerUserId: ownerId } },
    include: { room: true },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tid = parseTenantId((await ctx.params).id);
  if (tid === null) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  const existing = await assertTenantOwner(auth.session.sub, tid);
  if (!existing) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

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
  const checkOut =
    d.checkOutDate != null ? new Date(`${d.checkOutDate}T12:00:00+07:00`) : undefined;

  const tenant = await prisma.tenant.update({
    where: { id: tid },
    data: {
      ...(d.name !== undefined && { name: d.name.trim() }),
      ...(d.phone !== undefined && { phone: d.phone.trim() }),
      ...(d.idCard !== undefined && { idCard: d.idCard.trim() }),
      ...(d.status !== undefined && { status: d.status as TenantStatus }),
      ...(d.status === "MOVED_OUT" && {
        checkOutDate: checkOut ?? new Date(),
      }),
      ...(d.status === undefined && checkOut !== undefined && { checkOutDate: checkOut }),
    },
  });
  return NextResponse.json({ tenant });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tid = parseTenantId((await ctx.params).id);
  if (tid === null) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  const existing = await assertTenantOwner(auth.session.sub, tid);
  if (!existing) return NextResponse.json({ error: "ไม่พบผู้เข้าพัก" }, { status: 404 });

  await prisma.tenant.delete({ where: { id: tid } });
  return NextResponse.json({ ok: true });
}
