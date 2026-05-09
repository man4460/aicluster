import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const StatusEnum = z.enum(["AVAILABLE", "IN_USE", "BORROWED", "IN_REPAIR", "DISPOSED"]);
const ConditionEnum = z.enum(["GOOD", "FAIR", "POOR", "BROKEN"]);

const UpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  assetCode: z.string().trim().min(1).max(40).optional(),
  assetName: z.string().trim().min(1).max(200),
  categoryId: z.number().int().positive().nullable().optional(),
  brand: z.string().trim().max(120).nullable().optional(),
  model: z.string().trim().max(160).nullable().optional(),
  serialNumber: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  purchaseDate: z.string().trim().max(20).nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  supplierId: z.number().int().positive().nullable().optional(),
  warrantyUntil: z.string().trim().max(20).nullable().optional(),
  depreciationYears: z.number().int().min(0).max(50).optional(),
  status: StatusEnum.optional(),
  condition: ConditionEnum.optional(),
  locationId: z.number().int().positive().nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  holderName: z.string().trim().max(120).nullable().optional(),
  imageUrl: z.string().trim().max(512).nullable().optional(),
  qrCode: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

function ymdToDate(s?: string | null): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const condition = url.searchParams.get("condition") ?? "";
  const categoryIdRaw = url.searchParams.get("categoryId");
  const departmentIdRaw = url.searchParams.get("departmentId");
  const locationIdRaw = url.searchParams.get("locationId");
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";

  const where: Prisma.AssetWhereInput = {
    ownerUserId,
    trialSessionId,
    ...(includeDeleted ? {} : { isDeleted: false }),
  };
  if (q) {
    where.OR = [
      { assetCode: { contains: q } },
      { assetName: { contains: q } },
      { serialNumber: { contains: q } },
      { brand: { contains: q } },
      { model: { contains: q } },
    ];
  }
  if (StatusEnum.safeParse(status).success) where.status = status as Prisma.AssetWhereInput["status"];
  if (ConditionEnum.safeParse(condition).success) where.condition = condition as Prisma.AssetWhereInput["condition"];
  if (categoryIdRaw) {
    const n = Number(categoryIdRaw);
    if (Number.isFinite(n) && n > 0) where.categoryId = n;
  }
  if (departmentIdRaw) {
    const n = Number(departmentIdRaw);
    if (Number.isFinite(n) && n > 0) where.departmentId = n;
  }
  if (locationIdRaw) {
    const n = Number(locationIdRaw);
    if (Number.isFinite(n) && n > 0) where.locationId = n;
  }

  const items = await prisma.asset.findMany({
    where,
    orderBy: [{ id: "desc" }],
    take: 500,
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
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

  // resolve asset code (auto if not provided)
  let assetCode = data.assetCode?.trim();
  if (!assetCode) {
    const settings = await prisma.assetSettings.upsert({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      update: {},
      create: { ownerUserId, trialSessionId },
    });
    const year = new Date().getFullYear();
    const last = await prisma.asset.findFirst({
      where: { ownerUserId, trialSessionId },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const nextSeq = (last?.id ?? 0) + 1;
    assetCode = `${settings.assetPrefix}-${year}-${String(nextSeq).padStart(5, "0")}`;
  }

  const purchaseDate = ymdToDate(data.purchaseDate);
  const warrantyUntil = ymdToDate(data.warrantyUntil);
  const purchasePriceVal = data.purchasePrice == null
    ? null
    : new Prisma.Decimal(data.purchasePrice);
  const currentValueVal = data.purchasePrice == null
    ? null
    : new Prisma.Decimal(data.purchasePrice);

  let item;
  if (data.id) {
    item = await prisma.asset.update({
      where: { id: data.id },
      data: {
        assetCode,
        assetName: data.assetName,
        categoryId: data.categoryId ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        description: data.description ?? null,
        purchaseDate,
        purchasePrice: purchasePriceVal,
        supplierId: data.supplierId ?? null,
        warrantyUntil,
        depreciationYears: data.depreciationYears ?? 5,
        currentValue: currentValueVal,
        status: data.status ?? "AVAILABLE",
        condition: data.condition ?? "GOOD",
        locationId: data.locationId ?? null,
        departmentId: data.departmentId ?? null,
        holderName: data.holderName ?? null,
        imageUrl: data.imageUrl ?? null,
        qrCode: data.qrCode ?? assetCode,
        note: data.note ?? null,
      },
    });
  } else {
    item = await prisma.asset.create({
      data: {
        ownerUserId,
        trialSessionId,
        assetCode,
        assetName: data.assetName,
        categoryId: data.categoryId ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
        serialNumber: data.serialNumber ?? null,
        description: data.description ?? null,
        purchaseDate,
        purchasePrice: purchasePriceVal,
        supplierId: data.supplierId ?? null,
        warrantyUntil,
        depreciationYears: data.depreciationYears ?? 5,
        currentValue: currentValueVal,
        status: data.status ?? "AVAILABLE",
        condition: data.condition ?? "GOOD",
        locationId: data.locationId ?? null,
        departmentId: data.departmentId ?? null,
        holderName: data.holderName ?? null,
        imageUrl: data.imageUrl ?? null,
        qrCode: data.qrCode ?? assetCode,
        note: data.note ?? null,
      },
    });
  }
  return NextResponse.json({ item });
}
