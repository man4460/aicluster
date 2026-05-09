import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const TypeEnum = z.enum(["ASSIGN", "BORROW", "RETURN", "TRANSFER"]);

const CreateSchema = z.object({
  assetId: z.number().int().positive(),
  type: TypeEnum,
  fromLocationId: z.number().int().positive().nullable().optional(),
  toLocationId: z.number().int().positive().nullable().optional(),
  fromHolderName: z.string().trim().max(120).nullable().optional(),
  toHolderName: z.string().trim().max(120).nullable().optional(),
  transactionDate: z.string().trim().min(1).max(20),
  expectedReturnDate: z.string().trim().max(20).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

function ymdToDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const url = new URL(req.url);
  const assetIdRaw = url.searchParams.get("assetId");
  const limitRaw = url.searchParams.get("limit");

  const where: Prisma.AssetTransactionWhereInput = {
    ownerUserId,
    trialSessionId,
  };
  if (assetIdRaw) {
    const n = Number(assetIdRaw);
    if (Number.isFinite(n) && n > 0) where.assetId = n;
  }
  const limit = Math.min(500, Math.max(1, Number(limitRaw) || 200));

  const items = await prisma.assetTransaction.findMany({
    where,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    take: limit,
    include: {
      asset: { select: { id: true, assetCode: true, assetName: true } },
      fromLocation: { select: { id: true, name: true } },
      toLocation: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({
    items: items.map((it) => ({ ...it, id: it.id.toString() })),
  });
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
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const asset = await prisma.asset.findFirst({
    where: { id: data.assetId, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true, status: true, locationId: true, holderName: true },
  });
  if (!asset) return NextResponse.json({ error: "ไม่พบทรัพย์สิน" }, { status: 404 });

  const settings = await prisma.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
  const year = new Date().getFullYear();
  const last = await prisma.assetTransaction.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const nextSeq = Number(last?.id ?? BigInt(0)) + 1;
  const code = `${settings.txPrefix}-${year}-${String(nextSeq).padStart(5, "0")}`;

  const txDate = ymdToDate(data.transactionDate) ?? new Date();
  const expDate = ymdToDate(data.expectedReturnDate);

  const created = await prisma.$transaction(async (tx) => {
    // status determination by type
    const isReturn = data.type === "RETURN";
    const txStatus = data.type === "BORROW" ? "ACTIVE" : "COMPLETED";

    const newRec = await tx.assetTransaction.create({
      data: {
        ownerUserId,
        trialSessionId,
        transactionCode: code,
        type: data.type,
        assetId: data.assetId,
        fromLocationId: data.fromLocationId ?? asset.locationId ?? null,
        toLocationId: data.toLocationId ?? null,
        fromHolderName: data.fromHolderName ?? asset.holderName ?? null,
        toHolderName: isReturn ? null : (data.toHolderName ?? null),
        transactionDate: txDate,
        expectedReturnDate: expDate,
        actualReturnDate: isReturn ? txDate : null,
        status: txStatus,
        note: data.note ?? null,
      },
    });

    // update asset side state
    const assetUpdate: Prisma.AssetUpdateInput = {};
    if (data.type === "ASSIGN") {
      assetUpdate.status = "IN_USE";
      assetUpdate.holderName = data.toHolderName ?? null;
      if (data.toLocationId) assetUpdate.location = { connect: { id: data.toLocationId } };
    } else if (data.type === "BORROW") {
      assetUpdate.status = "BORROWED";
      assetUpdate.holderName = data.toHolderName ?? null;
      if (data.toLocationId) assetUpdate.location = { connect: { id: data.toLocationId } };
    } else if (data.type === "RETURN") {
      assetUpdate.status = "AVAILABLE";
      assetUpdate.holderName = null;
      if (data.toLocationId) assetUpdate.location = { connect: { id: data.toLocationId } };
    } else if (data.type === "TRANSFER") {
      if (data.toLocationId) assetUpdate.location = { connect: { id: data.toLocationId } };
      if (data.toHolderName !== undefined) assetUpdate.holderName = data.toHolderName ?? null;
    }
    if (Object.keys(assetUpdate).length > 0) {
      await tx.asset.update({ where: { id: data.assetId }, data: assetUpdate });
    }

    // close active borrow on RETURN
    if (isReturn) {
      await tx.assetTransaction.updateMany({
        where: {
          ownerUserId,
          trialSessionId,
          assetId: data.assetId,
          type: "BORROW",
          status: "ACTIVE",
          id: { not: newRec.id },
        },
        data: { status: "COMPLETED", actualReturnDate: txDate },
      });
    }

    return newRec;
  });

  return NextResponse.json({ item: { ...created, id: created.id.toString() } });
}
