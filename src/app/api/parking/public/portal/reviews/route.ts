import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  PARKING_REVIEW_PHOTO_MAX,
  normalizeParkingReviewPhotos,
} from "@/systems/parking/lib/portal-media";

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  t: z.string().max(36).optional().nullable(),
  trialSessionId: z.string().max(36).optional(),
  guestName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(800),
  photoUrls: z.array(z.string().max(512)).max(PARKING_REVIEW_PHOTO_MAX).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 400 });
  }
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;

  const reviews = await prisma.parkingReview.findMany({
    where: { ownerUserId: ownerId, trialSessionId, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      photoUrls: normalizeParkingReviewPhotos(r.photoUrlsJson),
      createdAt: r.createdAt.toISOString(),
    })),
    reviewAvg:
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
    reviewCount: reviews.length,
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`parking-portal-review:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งรีวิวถี่เกินไป" }, { status: 429 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  if (!(await isParkingPortalOpenForOwner(d.ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const trialSessionId = d.trialSessionId?.trim() || d.t?.trim() || TRIAL_PROD_SCOPE;
  const photos = normalizeParkingReviewPhotos(d.photoUrls ?? []);

  const review = await prisma.parkingReview.create({
    data: {
      ownerUserId: d.ownerId,
      trialSessionId,
      guestName: d.guestName.trim(),
      rating: d.rating,
      comment: d.comment.trim(),
      photoUrlsJson: JSON.stringify(photos),
      isPublished: true,
    },
  });

  return NextResponse.json({
    review: {
      id: review.id,
      guestName: review.guestName,
      rating: review.rating,
      comment: review.comment,
      photoUrls: photos,
      createdAt: review.createdAt.toISOString(),
    },
  });
}
