import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const TypeEnum = z.enum(["PREVENTIVE", "CORRECTIVE"]);
const StatusEnum = z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]);

const UpsertSchema = z.object({
  id: z.string().optional(),
  assetId: z.number().int().positive(),
  type: TypeEnum.optional(),
  startDate: z.string().trim().min(1).max(20),
  endDate: z.string().trim().max(20).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
  vendor: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  result: z.string().trim().max(2000).nullable().optional(),
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
  const status = url.searchParams.get("status") ?? "";

  const where: Prisma.AssetMaintenanceWhereInput = { ownerUserId, trialSessionId };
  if (assetIdRaw) {
    const n = Number(assetIdRaw);
    if (Number.isFinite(n) && n > 0) where.assetId = n;
  }
  if (StatusEnum.safeParse(status).success) where.status = status as Prisma.AssetMaintenanceWhereInput["status"];

  const items = await prisma.assetMaintenance.findMany({
    where,
    orderBy: [{ startDate: "desc" }, { id: "desc" }],
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
  const startDate = ymdToDate(data.startDate)!;
  const endDate = ymdToDate(data.endDate);
  const status = data.status ?? (endDate ? "COMPLETED" : "IN_PROGRESS");
  const costVal = data.cost == null ? null : new Prisma.Decimal(data.cost);

  const result = await prisma.$transaction(async (tx) => {
    let item;
    if (data.id) {
      const idBig = BigInt(data.id);
      item = await tx.assetMaintenance.update({
        where: { id: idBig },
        data: {
          assetId: data.assetId,
          type: data.type ?? "CORRECTIVE",
          startDate,
          endDate,
          cost: costVal,
          vendor: data.vendor ?? null,
          description: data.description ?? null,
          result: data.result ?? null,
          status,
        },
      });
    } else {
      const year = new Date().getFullYear();
      const last = await tx.assetMaintenance.findFirst({
        where: { ownerUserId, trialSessionId },
        orderBy: { id: "desc" },
        select: { id: true },
      });
      const nextSeq = Number(last?.id ?? BigInt(0)) + 1;
      const code = `${settings.mtPrefix}-${year}-${String(nextSeq).padStart(5, "0")}`;
      item = await tx.assetMaintenance.create({
        data: {
          ownerUserId,
          trialSessionId,
          maintenanceCode: code,
          assetId: data.assetId,
          type: data.type ?? "CORRECTIVE",
          startDate,
          endDate,
          cost: costVal,
          vendor: data.vendor ?? null,
          description: data.description ?? null,
          result: data.result ?? null,
          status,
        },
      });
    }

    // update asset status
    if (status === "IN_PROGRESS") {
      await tx.asset.update({ where: { id: data.assetId }, data: { status: "IN_REPAIR" } });
    } else if (status === "COMPLETED") {
      await tx.asset.update({ where: { id: data.assetId }, data: { status: "AVAILABLE" } });
    }
    return item;
  });

  return NextResponse.json({ item: { ...result, id: result.id.toString() } });
}
