import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const lineSchema = z.object({
  ingredient_id: z.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit_price_baht: z.coerce.number().min(0),
});

const postSchema = z.object({
  purchased_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional().nullable(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
  lines: z.array(lineSchema).min(1),
});

const patchSchema = z
  .object({
    purchased_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    note: z.string().max(500).optional().nullable(),
    payment_slip_url: z.string().max(2048).optional().nullable(),
    lines: z.array(lineSchema).min(1).optional(),
  })
  .refine(
    (o) =>
      o.purchased_on !== undefined ||
      o.note !== undefined ||
      o.lines !== undefined ||
      o.payment_slip_url !== undefined,
    { message: "empty" },
  );

function slipOut(url: string | null | undefined) {
  const s = typeof url === "string" ? url.trim() : "";
  return s;
}

/** Prisma client ค้างรุ่นเก่า (ก่อนมี paymentSlipUrl) จะ throw ValidationError */
function isStaleClientUnknownPaymentSlip(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientValidationError)) return false;
  return /paymentSlipUrl|payment_slip_url|Unknown argument/i.test(err.message);
}

async function createPurchaseOrderWithSlipFallback(
  tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use">,
  base: {
    ownerUserId: string;
    trialSessionId: string;
    purchasedOn: Date;
    note: string;
    paymentSlipUrl: string;
  },
) {
  try {
    return await tx.buildingPosPurchaseOrder.create({
      data: {
        ownerUserId: base.ownerUserId,
        trialSessionId: base.trialSessionId,
        purchasedOn: base.purchasedOn,
        note: base.note,
        paymentSlipUrl: base.paymentSlipUrl,
      },
    });
  } catch (e) {
    if (isStaleClientUnknownPaymentSlip(e)) {
      return await tx.buildingPosPurchaseOrder.create({
        data: {
          ownerUserId: base.ownerUserId,
          trialSessionId: base.trialSessionId,
          purchasedOn: base.purchasedOn,
          note: base.note,
        },
      });
    }
    throw e;
  }
}

function serializeLine(l: { id: number; ingredientId: number; quantity: unknown; unitPriceBaht: unknown }) {
  const q = Number(l.quantity);
  const p = Number(l.unitPriceBaht);
  return {
    id: l.id,
    ingredient_id: l.ingredientId,
    quantity: q,
    unit_price_baht: p,
    line_total_baht: Math.round(q * p * 100) / 100,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosPurchaseOrder.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ purchasedOn: "desc" }, { id: "desc" }],
      include: { lines: { orderBy: { id: "asc" } } },
    });
    return NextResponse.json({
      purchase_orders: rows.map((o) => ({
        id: o.id,
        purchased_on: o.purchasedOn.toISOString().slice(0, 10),
        note: o.note,
        payment_slip_url: slipOut(o.paymentSlipUrl),
        created_at: o.createdAt.toISOString(),
        lines: o.lines.map(serializeLine),
      })),
    });
  } catch (e) {
    console.error("[building-pos/session/purchase-orders GET]", e);
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
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const ingIds = [...new Set(parsed.data.lines.map((l) => l.ingredient_id))];
    const ings = await prisma.buildingPosIngredient.findMany({
      where: {
        id: { in: ingIds },
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
      select: { id: true },
    });
    if (ings.length !== ingIds.length) {
      return NextResponse.json({ error: "มีรายการของที่ไม่พบ" }, { status: 400 });
    }

    const purchasedOn = new Date(`${parsed.data.purchased_on}T12:00:00.000Z`);

    const order = await prisma.$transaction(async (tx) => {
      const po = await createPurchaseOrderWithSlipFallback(tx, {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        purchasedOn,
        note: parsed.data.note?.trim() ?? "",
        paymentSlipUrl: slipOut(parsed.data.payment_slip_url),
      });
      for (const ln of parsed.data.lines) {
        await tx.buildingPosPurchaseLine.create({
          data: {
            purchaseOrderId: po.id,
            ingredientId: ln.ingredient_id,
            quantity: new Prisma.Decimal(String(ln.quantity)),
            unitPriceBaht: new Prisma.Decimal(String(ln.unit_price_baht)),
          },
        });
      }
      return tx.buildingPosPurchaseOrder.findUniqueOrThrow({
        where: { id: po.id },
        include: { lines: { orderBy: { id: "asc" } } },
      });
    });

    return NextResponse.json({
      purchase_order: {
        id: order.id,
        purchased_on: order.purchasedOn.toISOString().slice(0, 10),
        note: order.note,
        payment_slip_url: slipOut(order.paymentSlipUrl),
        created_at: order.createdAt.toISOString(),
        lines: order.lines.map(serializeLine),
      },
    });
  } catch (e) {
    console.error("[building-pos/session/purchase-orders POST]", e);
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
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.buildingPosPurchaseOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบบันทึกรายจ่ายนี้" }, { status: 404 });

    if (parsed.data.lines) {
      const ingIds = [...new Set(parsed.data.lines.map((l) => l.ingredient_id))];
      const ings = await prisma.buildingPosIngredient.findMany({
        where: {
          id: { in: ingIds },
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
        select: { id: true },
      });
      if (ings.length !== ingIds.length) {
        return NextResponse.json({ error: "มีรายการของที่ไม่พบ" }, { status: 400 });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const header: { purchasedOn?: Date; note?: string; paymentSlipUrl?: string } = {};
      if (parsed.data.purchased_on !== undefined) {
        header.purchasedOn = new Date(`${parsed.data.purchased_on}T12:00:00.000Z`);
      }
      if (parsed.data.note !== undefined) {
        header.note = parsed.data.note?.trim() ?? "";
      }
      if (parsed.data.payment_slip_url !== undefined) {
        header.paymentSlipUrl = slipOut(parsed.data.payment_slip_url);
      }
      if (Object.keys(header).length > 0) {
        try {
          await tx.buildingPosPurchaseOrder.update({
            where: { id: existing.id },
            data: header,
          });
        } catch (e) {
          if (isStaleClientUnknownPaymentSlip(e) && header.paymentSlipUrl !== undefined) {
            const { paymentSlipUrl: _slip, ...rest } = header;
            if (Object.keys(rest).length > 0) {
              await tx.buildingPosPurchaseOrder.update({
                where: { id: existing.id },
                data: rest,
              });
            }
          } else {
            throw e;
          }
        }
      }

      if (parsed.data.lines) {
        await tx.buildingPosPurchaseLine.deleteMany({ where: { purchaseOrderId: existing.id } });
        for (const ln of parsed.data.lines) {
          await tx.buildingPosPurchaseLine.create({
            data: {
              purchaseOrderId: existing.id,
              ingredientId: ln.ingredient_id,
              quantity: new Prisma.Decimal(String(ln.quantity)),
              unitPriceBaht: new Prisma.Decimal(String(ln.unit_price_baht)),
            },
          });
        }
      }

      return tx.buildingPosPurchaseOrder.findUniqueOrThrow({
        where: { id: existing.id },
        include: { lines: { orderBy: { id: "asc" } } },
      });
    });

    return NextResponse.json({
      purchase_order: {
        id: order.id,
        purchased_on: order.purchasedOn.toISOString().slice(0, 10),
        note: order.note,
        payment_slip_url: slipOut(order.paymentSlipUrl),
        created_at: order.createdAt.toISOString(),
        lines: order.lines.map(serializeLine),
      },
    });
  } catch (e) {
    console.error("[building-pos/session/purchase-orders PATCH]", e);
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
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const n = await prisma.buildingPosPurchaseOrder.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบบันทึกรายจ่ายนี้" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/purchase-orders DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
