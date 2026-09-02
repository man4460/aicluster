import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);
    const { id: idRaw } = await ctx.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.laundryRevenueCategory.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const row = await prisma.laundryRevenueCategory.update({
      where: { id },
      data: { name: parsed.data.name.trim() },
    });
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        created_at: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/revenue-categories/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);
    const { id: idRaw } = await ctx.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.laundryRevenueCategory.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    await prisma.laundryRevenueCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/revenue-categories/[id] DELETE");
  }
}
