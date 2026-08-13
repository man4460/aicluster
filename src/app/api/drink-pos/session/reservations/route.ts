import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  drinkPosNormalizePortalCartItems,
  normalizeDrinkPosPortalPaymentMode,
} from "@/lib/drink-pos/portal-booking";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

const patchSchema = z.object({
  id: z.string().min(10).max(64),
  status: z.enum(["SCHEDULED", "ARRIVED", "CANCELLED", "COMPLETED"]),
});

function mapReservation(row: {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tablePreference: string;
  visitDateKey: string;
  visitTimeHm: string;
  itemsJson: unknown;
  itemsTotalBaht: number;
  paymentMode: string;
  payDueBaht: number;
  amountPaidBaht: number;
  paymentMethod: string;
  paymentSlipUrl: string;
  status: string;
  note: string;
  linkedSaleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    partySize: row.partySize,
    tablePreference: row.tablePreference || null,
    visitDateKey: row.visitDateKey,
    visitTimeHm: row.visitTimeHm,
    items: drinkPosNormalizePortalCartItems(row.itemsJson),
    itemsTotalBaht: row.itemsTotalBaht,
    paymentMode: normalizeDrinkPosPortalPaymentMode(row.paymentMode),
    payDueBaht: row.payDueBaht,
    amountPaidBaht: row.amountPaidBaht,
    paymentMethod: row.paymentMethod || null,
    paymentSlipUrl: row.paymentSlipUrl || null,
    status: row.status,
    note: row.note || null,
    linkedSaleId: row.linkedSaleId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim();
  const dateKey = url.searchParams.get("date")?.trim();

  const rows = await prisma.drinkPosReservation.findMany({
    where: {
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
      ...(status ? { status } : {}),
      ...(dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? { visitDateKey: dateKey } : {}),
    },
    orderBy: [{ visitDateKey: "asc" }, { visitTimeHm: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ reservations: rows.map(mapReservation) });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.drinkPosReservation.findFirst({
    where: {
      id: parsed.data.id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const updated = await prisma.drinkPosReservation.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ reservation: mapReservation(updated) });
}
