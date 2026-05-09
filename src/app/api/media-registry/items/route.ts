import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { nextMediaRegisterNo } from "@/systems/media-registry/lib/id-generators";
import { recalcMediaItemStatus } from "@/systems/media-registry/lib/status";
import { decString } from "@/systems/media-registry/lib/serialize";

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

export async function GET(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const mediaStatus = searchParams.get("mediaStatus")?.trim();

  const rows = await prisma.mediaRegistryItem.findMany({
    where: {
      ownerUserId: auth.userId,
      ...(category ? { category } : {}),
      ...(mediaStatus ? { mediaStatus } : {}),
      ...(q
        ? {
            OR: [
              { mediaName: { contains: q } },
              { registerNo: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : {}),
    },
    include: { location: { select: { locationDetail: true } } },
    orderBy: [{ registerNo: "asc" }],
  });
  return NextResponse.json({ items: rows.map(serializeItem) });
}

export async function POST(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const body = (await req.json()) as Record<string, unknown>;

  const mediaName = typeof body.mediaName === "string" ? body.mediaName.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!mediaName || !category) {
    return NextResponse.json({ error: "ต้องระบุชื่อสื่อและประเภท/หมวด" }, { status: 400 });
  }

  const quantityTotal = Number(body.quantityTotal);
  if (!Number.isFinite(quantityTotal) || quantityTotal < 0) {
    return NextResponse.json({ error: "จำนวนรวมไม่ถูกต้อง" }, { status: 400 });
  }

  const quantityAvailable =
    body.quantityAvailable !== undefined && body.quantityAvailable !== null
      ? Number(body.quantityAvailable)
      : quantityTotal;
  if (!Number.isFinite(quantityAvailable) || quantityAvailable < 0 || quantityAvailable > quantityTotal) {
    return NextResponse.json({ error: "จำนวนคงเหลือไม่ถูกต้อง" }, { status: 400 });
  }

  const pricePerUnit = new Prisma.Decimal(String(body.pricePerUnit ?? 0));
  const totalPrice = new Prisma.Decimal(Number(pricePerUnit) * quantityTotal);

  let registerNo =
    typeof body.registerNo === "string" && body.registerNo.trim()
      ? body.registerNo.trim()
      : await nextMediaRegisterNo(prisma, auth.userId);

  const dup = await prisma.mediaRegistryItem.findFirst({
    where: { ownerUserId: auth.userId, registerNo },
  });
  if (dup) {
    registerNo = await nextMediaRegisterNo(prisma, auth.userId);
  }

  const mediaStatus =
    typeof body.mediaStatus === "string" && body.mediaStatus.trim()
      ? body.mediaStatus.trim()
      : recalcMediaItemStatus({
          quantityTotal,
          quantityAvailable,
          mediaStatus: "พร้อมใช้งาน",
        });

  const row = await prisma.mediaRegistryItem.create({
    data: {
      ownerUserId: auth.userId,
      registerNo,
      mediaName,
      category,
      subjectGroup: typeof body.subjectGroup === "string" ? body.subjectGroup.trim() || null : null,
      gradeLevel: typeof body.gradeLevel === "string" ? body.gradeLevel.trim() || null : null,
      quantityTotal,
      quantityAvailable,
      unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : "ชุด",
      pricePerUnit,
      totalPrice,
      mediaStatus,
      conditionNow: typeof body.conditionNow === "string" ? body.conditionNow.trim() || null : null,
      budgetYear: typeof body.budgetYear === "string" ? body.budgetYear.trim() || null : null,
      locationId: typeof body.locationId === "string" ? body.locationId || null : null,
      locationDetail: typeof body.locationDetail === "string" ? body.locationDetail.trim() || null : null,
      responsibleTeacher:
        typeof body.responsibleTeacher === "string" ? body.responsibleTeacher.trim() || null : null,
      note: typeof body.note === "string" ? body.note.trim() || null : null,
    },
    include: { location: { select: { locationDetail: true } } },
  });
  return NextResponse.json({ item: serializeItem(row) });
}
