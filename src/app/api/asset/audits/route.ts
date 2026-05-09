import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

const ConditionEnum = z.enum(["GOOD", "FAIR", "POOR", "BROKEN"]);
const StatusEnum = z.enum(["MATCH", "MISMATCH", "MISSING"]);

const UpsertSchema = z.object({
  id: z.string().optional(),
  assetId: z.number().int().positive(),
  auditDate: z.string().trim().min(1).max(20),
  auditorName: z.string().trim().max(120).nullable().optional(),
  expectedLocationId: z.number().int().positive().nullable().optional(),
  actualLocationId: z.number().int().positive().nullable().optional(),
  expectedCondition: ConditionEnum.nullable().optional(),
  actualCondition: ConditionEnum.nullable().optional(),
  status: StatusEnum.optional(),
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
  const status = url.searchParams.get("status") ?? "";

  const where: Prisma.AssetAuditWhereInput = { ownerUserId, trialSessionId };
  if (assetIdRaw) {
    const n = Number(assetIdRaw);
    if (Number.isFinite(n) && n > 0) where.assetId = n;
  }
  if (StatusEnum.safeParse(status).success) where.status = status as Prisma.AssetAuditWhereInput["status"];

  const items = await prisma.assetAudit.findMany({
    where,
    orderBy: [{ auditDate: "desc" }, { id: "desc" }],
    take: 300,
    include: {
      asset: { select: { id: true, assetCode: true, assetName: true } },
      expectedLocation: { select: { id: true, name: true } },
      actualLocation: { select: { id: true, name: true } },
    },
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
    select: { id: true, locationId: true, condition: true },
  });
  if (!asset) return NextResponse.json({ error: "ไม่พบทรัพย์สิน" }, { status: 404 });

  const settings = await prisma.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
  const auditDate = ymdToDate(data.auditDate)!;

  // auto-detect status if not provided
  const expLoc = data.expectedLocationId ?? asset.locationId ?? null;
  const actLoc = data.actualLocationId ?? null;
  const expCond = data.expectedCondition ?? asset.condition;
  const actCond = data.actualCondition ?? asset.condition;
  let status = data.status;
  if (!status) {
    if (actLoc == null) status = "MISSING";
    else if (expLoc !== actLoc || expCond !== actCond) status = "MISMATCH";
    else status = "MATCH";
  }

  let item;
  if (data.id) {
    const idBig = BigInt(data.id);
    item = await prisma.assetAudit.update({
      where: { id: idBig },
      data: {
        assetId: data.assetId,
        auditDate,
        auditorName: data.auditorName ?? null,
        expectedLocationId: expLoc,
        actualLocationId: actLoc,
        expectedCondition: expCond,
        actualCondition: actCond,
        status,
        note: data.note ?? null,
      },
    });
  } else {
    const year = new Date().getFullYear();
    const last = await prisma.assetAudit.findFirst({
      where: { ownerUserId, trialSessionId },
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const nextSeq = Number(last?.id ?? BigInt(0)) + 1;
    const code = `${settings.auPrefix}-${year}-${String(nextSeq).padStart(5, "0")}`;
    item = await prisma.assetAudit.create({
      data: {
        ownerUserId,
        trialSessionId,
        auditCode: code,
        assetId: data.assetId,
        auditDate,
        auditorName: data.auditorName ?? null,
        expectedLocationId: expLoc,
        actualLocationId: actLoc,
        expectedCondition: expCond,
        actualCondition: actCond,
        status,
        note: data.note ?? null,
      },
    });
  }
  return NextResponse.json({ item: { ...item, id: item.id.toString() } });
}
