import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { normalizeParkingReviewPhotos } from "@/systems/parking/lib/portal-media";

const patchSchema = z.object({
  id: z.string().min(10).max(64),
  isPublished: z.boolean(),
});

function mapReview(row: {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrlsJson: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    guestName: row.guestName,
    rating: row.rating,
    comment: row.comment,
    photoUrls: normalizeParkingReviewPhotos(row.photoUrlsJson),
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.parkingReview.findMany({
    where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ reviews: rows.map(mapReview) });
}

export async function PATCH(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.parkingReview.findFirst({
    where: {
      id: parsed.data.id,
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรีวิว" }, { status: 404 });

  const updated = await prisma.parkingReview.update({
    where: { id: existing.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return NextResponse.json({ review: mapReview(updated) });
}
