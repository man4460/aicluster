import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const MethodEnum = z.enum(["SALE", "DONATION", "WRITE_OFF", "RECYCLE"]);
const StatusEnum = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);

const UpsertSchema = z.object({
  id: z.string().optional(),
  assetId: z.number().int().positive(),
  disposalDate: z.string().trim().min(1).max(20),
  reason: z.string().trim().max(2000).nullable().optional(),
  method: MethodEnum.optional(),
  salePrice: z.number().min(0).nullable().optional(),
  buyer: z.string().trim().max(160).nullable().optional(),
  approvedByName: z.string().trim().max(120).nullable().optional(),
  documentUrl: z.string().trim().max(512).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
  status: StatusEnum.optional(),
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
  const where: Prisma.AssetDisposalWhereInput = { ownerUserId, trialSessionId };
  if (assetIdRaw) {
    const n = Number(assetIdRaw);
    if (Number.isFinite(n) && n > 0) where.assetId = n;
  }
  const items = await prisma.assetDisposal.findMany({
    where,
    orderBy: [{ disposalDate: "desc" }, { id: "desc" }],
    take: 300,
    include: { asset: { select: { id: true, assetCode: true, assetName: true } } },
  });
  return NextResponse.json({ items: items.map((it) => ({ ...it, id: it.id.toString() })) });
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

  const asset = await prisma.asset.findFirst({
    where: { id: data.assetId, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true },
  });
  if (!asset) return NextResponse.json({ error: "ไม่พบทรัพย์สิน" }, { status: 404 });

  const settings = await prisma.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
  const disposalDate = ymdToDate(data.disposalDate)!;
  const status = data.status ?? "COMPLETED";
  const salePrice = data.salePrice == null ? null : new Prisma.Decimal(data.salePrice);

  const result = await prisma.$transaction(async (tx) => {
    let item;
    if (data.id) {
      const idBig = BigInt(data.id);
      item = await tx.assetDisposal.update({
        where: { id: idBig },
        data: {
          assetId: data.assetId,
          disposalDate,
          reason: data.reason ?? null,
          method: data.method ?? "SALE",
          salePrice,
          buyer: data.buyer ?? null,
          approvedByName: data.approvedByName ?? null,
          documentUrl: data.documentUrl ?? null,
          note: data.note ?? null,
          status,
        },
      });
    } else {
      const year = new Date().getFullYear();
      const last = await tx.assetDisposal.findFirst({
        where: { ownerUserId, trialSessionId },
        orderBy: { id: "desc" },
        select: { id: true },
      });
      const nextSeq = Number(last?.id ?? BigInt(0)) + 1;
      const code = `${settings.dpPrefix}-${year}-${String(nextSeq).padStart(5, "0")}`;
      item = await tx.assetDisposal.create({
        data: {
          ownerUserId,
          trialSessionId,
          disposalCode: code,
          assetId: data.assetId,
          disposalDate,
          reason: data.reason ?? null,
          method: data.method ?? "SALE",
          salePrice,
          buyer: data.buyer ?? null,
          approvedByName: data.approvedByName ?? null,
          documentUrl: data.documentUrl ?? null,
          note: data.note ?? null,
          status,
        },
      });
    }

    if (status === "COMPLETED") {
      await tx.asset.update({ where: { id: data.assetId }, data: { status: "DISPOSED" } });
    }
    return item;
  });

  return NextResponse.json({ item: { ...result, id: result.id.toString() } });
}
