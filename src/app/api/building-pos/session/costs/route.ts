import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

function slipOut(url: string | null | undefined) {
  const s = typeof url === "string" ? url.trim() : "";
  return s;
}

function serializeCost(r: {
  id: number;
  label: string;
  amountBaht: number;
  spentAt: Date;
  note: string;
  categoryId: number | null;
  paymentSlipUrl: string;
  category: { id: number; name: string } | null;
}) {
  return {
    id: r.id,
    label: r.label,
    amount_baht: r.amountBaht,
    spent_at: r.spentAt.toISOString(),
    note: r.note,
    category_id: r.categoryId,
    category_name: r.category?.name ?? null,
    payment_slip_url: slipOut(r.paymentSlipUrl),
  };
}

const postSchema = z.object({
  label: z.string().min(1).max(160),
  amount_baht: z.number().int().min(1).max(99_999_999),
  category_id: z.number().int().positive(),
  note: z.string().max(300).optional().nullable(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
  spent_at: z.string().datetime().optional(),
});

const patchSchema = z
  .object({
    label: z.string().min(1).max(160).optional(),
    amount_baht: z.number().int().min(1).max(99_999_999).optional(),
    category_id: z.number().int().positive().optional(),
    note: z.string().max(300).optional().nullable(),
    payment_slip_url: z.string().max(2048).optional().nullable(),
    spent_at: z.string().datetime().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosCostEntry.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ spentAt: "desc" }, { id: "desc" }],
      take: 300,
    });
    return NextResponse.json({ costs: rows.map(serializeCost) });
  } catch (e) {
    console.error("[building-pos/session/costs GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "กรอกรายการ จำนวนเงิน และหมวดหมู่" }, { status: 400 });

    const cat = await prisma.buildingPosCostCategory.findFirst({
      where: {
        id: parsed.data.category_id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });

    const row = await prisma.buildingPosCostEntry.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        categoryId: parsed.data.category_id,
        label: parsed.data.label.trim(),
        amountBaht: parsed.data.amount_baht,
        note: parsed.data.note?.trim() || "",
        paymentSlipUrl: slipOut(parsed.data.payment_slip_url),
        spentAt: parsed.data.spent_at ? new Date(parsed.data.spent_at) : new Date(),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ cost: serializeCost(row) });
  } catch (e) {
    console.error("[building-pos/session/costs POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.buildingPosCostEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

    if (parsed.data.category_id != null) {
      const cat = await prisma.buildingPosCostCategory.findFirst({
        where: {
          id: parsed.data.category_id,
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
      });
      if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
    }

    const row = await prisma.buildingPosCostEntry.update({
      where: { id },
      data: {
        ...(parsed.data.label !== undefined ? { label: parsed.data.label.trim() } : {}),
        ...(parsed.data.amount_baht !== undefined ? { amountBaht: parsed.data.amount_baht } : {}),
        ...(parsed.data.category_id !== undefined ? { categoryId: parsed.data.category_id } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || "" } : {}),
        ...(parsed.data.payment_slip_url !== undefined
          ? { paymentSlipUrl: slipOut(parsed.data.payment_slip_url) }
          : {}),
        ...(parsed.data.spent_at !== undefined ? { spentAt: new Date(parsed.data.spent_at) } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ cost: serializeCost(row) });
  } catch (e) {
    console.error("[building-pos/session/costs PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.buildingPosCostEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

    await prisma.buildingPosCostEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/costs DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
