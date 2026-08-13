import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { resolvePublicDrinkPosTrialSessionId } from "@/lib/drink-pos/public-trial-scope";
import {
  DRINK_POS_REVIEW_PHOTO_MAX,
  drinkPosNormalizeReviewPhotos,
} from "@/lib/drink-pos/portal-booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  t: z.string().max(36).optional().nullable(),
  trialSessionId: z.string().max(36).optional(),
  guestName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(800),
  photoUrls: z.array(z.string().max(512)).max(DRINK_POS_REVIEW_PHOTO_MAX).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  const { trialSessionId } = await resolvePublicDrinkPosTrialSessionId(ownerId, trialParam || null);

  const reviews = await prisma.drinkPosReview.findMany({
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
      photoUrls: drinkPosNormalizeReviewPhotos(r.photoUrlsJson),
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
  const rl = rateLimit(`drink-portal-review:${ip}`, 20, 60 * 60 * 1000);
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
  const open = await isDrinkPosPortalOpenForOwner(d.ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = d.trialSessionId?.trim() || d.t?.trim() || "";
  const { trialSessionId } = await resolvePublicDrinkPosTrialSessionId(d.ownerId, trialParam || null);

  const photos = drinkPosNormalizeReviewPhotos(d.photoUrls ?? []);

  const review = await prisma.drinkPosReview.create({
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
