import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { MEDIA_REGISTRY_BORROW_OPEN_STATUSES } from "@/systems/media-registry/lib/constants";
import { recalcMediaItemStatus } from "@/systems/media-registry/lib/status";
import { decString } from "@/systems/media-registry/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

function serializeItem(row: {
  id: string;
  registerNo: string;
  mediaName: string;
  category: string;
  subjectGroup: string | null;
  gradeLevel: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  unit: string;
  pricePerUnit: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  mediaStatus: string;
  conditionNow: string | null;
  budgetYear: string | null;
  locationId: string | null;
  locationDetail: string | null;
  responsibleTeacher: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  location?: { locationDetail: string } | null;
}) {
  return {
    ...row,
    pricePerUnit: decString(row.pricePerUnit)!,
    totalPrice: decString(row.totalPrice)!,
    locationLabel: row.location?.locationDetail ?? row.locationDetail ?? null,
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const row = await prisma.mediaRegistryItem.findFirst({
    where: { id, ownerUserId: auth.userId },
    include: { location: { select: { locationDetail: true } } },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  return NextResponse.json({ item: serializeItem(row) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const existing = await prisma.mediaRegistryItem.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const nextTotal =
    body.quantityTotal !== undefined ? Number(body.quantityTotal) : existing.quantityTotal;
  if (!Number.isFinite(nextTotal) || nextTotal < 0) {
    return NextResponse.json({ error: "จำนวนรวมไม่ถูกต้อง" }, { status: 400 });
  }

  const nextAvail =
    body.quantityAvailable !== undefined ? Number(body.quantityAvailable) : existing.quantityAvailable;
  if (!Number.isFinite(nextAvail) || nextAvail < 0 || nextAvail > nextTotal) {
    return NextResponse.json({ error: "จำนวนคงเหลือไม่ถูกต้อง" }, { status: 400 });
  }

  const pricePerUnit =
    body.pricePerUnit !== undefined
      ? new Prisma.Decimal(String(body.pricePerUnit))
      : existing.pricePerUnit;
  const totalPrice = new Prisma.Decimal(Number(pricePerUnit) * nextTotal);

  const mediaStatus =
    typeof body.mediaStatus === "string" && body.mediaStatus.trim()
      ? body.mediaStatus.trim()
      : recalcMediaItemStatus({
          quantityTotal: nextTotal,
          quantityAvailable: nextAvail,
          mediaStatus: existing.mediaStatus,
        });

  const row = await prisma.mediaRegistryItem.update({
    where: { id },
    data: {
      ...(typeof body.registerNo === "string" && body.registerNo.trim()
        ? { registerNo: body.registerNo.trim() }
        : {}),
      ...(typeof body.mediaName === "string" ? { mediaName: body.mediaName.trim() } : {}),
      ...(typeof body.category === "string" ? { category: body.category.trim() } : {}),
      subjectGroup:
        body.subjectGroup !== undefined
          ? typeof body.subjectGroup === "string"
            ? body.subjectGroup.trim() || null
            : null
          : undefined,
      gradeLevel:
        body.gradeLevel !== undefined
          ? typeof body.gradeLevel === "string"
            ? body.gradeLevel.trim() || null
            : null
          : undefined,
      quantityTotal: nextTotal,
      quantityAvailable: nextAvail,
      ...(typeof body.unit === "string" ? { unit: body.unit.trim() || "ชุด" } : {}),
      pricePerUnit,
      totalPrice,
      mediaStatus,
      conditionNow:
        body.conditionNow !== undefined
          ? typeof body.conditionNow === "string"
            ? body.conditionNow.trim() || null
            : null
          : undefined,
      budgetYear:
        body.budgetYear !== undefined
          ? typeof body.budgetYear === "string"
            ? body.budgetYear.trim() || null
            : null
          : undefined,
      locationId:
        body.locationId !== undefined
          ? typeof body.locationId === "string"
            ? body.locationId || null
            : null
          : undefined,
      locationDetail:
        body.locationDetail !== undefined
          ? typeof body.locationDetail === "string"
            ? body.locationDetail.trim() || null
            : null
          : undefined,
      responsibleTeacher:
        body.responsibleTeacher !== undefined
          ? typeof body.responsibleTeacher === "string"
            ? body.responsibleTeacher.trim() || null
            : null
          : undefined,
      note:
        body.note !== undefined
          ? typeof body.note === "string"
            ? body.note.trim() || null
            : null
          : undefined,
    },
    include: { location: { select: { locationDetail: true } } },
  });
  return NextResponse.json({ item: serializeItem(row) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const existing = await prisma.mediaRegistryItem.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const openBorrow = await prisma.mediaRegistryBorrow.count({
    where: { mediaId: id, borrowStatus: { in: MEDIA_REGISTRY_BORROW_OPEN_STATUSES } },
  });
  if (openBorrow > 0) {
    return NextResponse.json(
      { error: "ยังมีรายการยืมที่ไม่ปิด — คืนสื่อก่อนลบทะเบียน" },
      { status: 409 },
    );
  }

  await prisma.mediaRegistryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
