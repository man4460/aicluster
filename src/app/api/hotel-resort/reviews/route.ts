import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { hotelResortNormalizeReviewPhotos } from "@/systems/hotel-resort/lib/portal-media";

const createSchema = z.object({
  guestName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(800),
  isPublished: z.boolean().optional(),
});

const patchSchema = z.object({
  id: z.string().min(10).max(64),
  guestName: z.string().trim().min(1).max(120).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(800).optional(),
  isPublished: z.boolean().optional(),
});

function mapReview(row: {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrlsJson: string;
  isPublished: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    guestName: row.guestName,
    rating: row.rating,
    comment: row.comment,
    photoUrls: hotelResortNormalizeReviewPhotos(row.photoUrlsJson),
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  await ensureHotelResortProfile(prisma, auth.ctx.ownerUserId, auth.ctx.trialSessionId);
  const reviews = await prisma.hotelResortReview.findMany({
    where: {
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: auth.ctx.trialSessionId,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ reviews: reviews.map(mapReview) });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  await ensureHotelResortProfile(prisma, auth.ctx.ownerUserId, auth.ctx.trialSessionId);
  const row = await prisma.hotelResortReview.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: auth.ctx.trialSessionId,
      guestName: parsed.data.guestName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      photoUrlsJson: "[]",
      isPublished: parsed.data.isPublished ?? true,
    },
  });
  return NextResponse.json({ review: mapReview(row) });
}

export async function PATCH(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const existing = await prisma.hotelResortReview.findFirst({
    where: {
      id: parsed.data.id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: auth.ctx.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรีวิว" }, { status: 404 });
  const row = await prisma.hotelResortReview.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.guestName !== undefined ? { guestName: parsed.data.guestName } : {}),
      ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
      ...(parsed.data.comment !== undefined ? { comment: parsed.data.comment } : {}),
      ...(parsed.data.isPublished !== undefined ? { isPublished: parsed.data.isPublished } : {}),
    },
  });
  return NextResponse.json({ review: mapReview(row) });
}

export async function DELETE(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });
  const existing = await prisma.hotelResortReview.findFirst({
    where: {
      id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: auth.ctx.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรีวิว" }, { status: 404 });
  await prisma.hotelResortReview.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
