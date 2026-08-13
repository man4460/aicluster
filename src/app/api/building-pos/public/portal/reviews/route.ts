import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import {
  BUILDING_POS_REVIEW_PHOTO_MAX,
  buildingPosNormalizeReviewPhotos,
} from "@/lib/building-pos/portal-booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  t: z.string().max(36).optional().nullable(),
  trialSessionId: z.string().max(36).optional(),
  guestName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(800),
  photoUrls: z.array(z.string().max(512)).max(BUILDING_POS_REVIEW_PHOTO_MAX).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);

  const reviews = await prisma.buildingPosReview.findMany({
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
      photoUrls: buildingPosNormalizeReviewPhotos(r.photoUrlsJson),
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
  const rl = rateLimit(`bpos-portal-review:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งรีวิวถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const open = await isBuildingPosPortalOpenForOwner(d.ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = d.trialSessionId?.trim() || d.t?.trim() || "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(d.ownerId, trialParam || null);

  const photos = buildingPosNormalizeReviewPhotos(d.photoUrls ?? []);

  const review = await prisma.buildingPosReview.create({
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
