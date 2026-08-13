import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { drinkPosNormalizeReviewPhotos } from "@/lib/drink-pos/portal-booking";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

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
    photoUrls: drinkPosNormalizeReviewPhotos(row.photoUrlsJson),
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  const rows = await prisma.drinkPosReview.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId, trialSessionId: scope.trialSessionId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ reviews: rows.map(mapReview) });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.drinkPosReview.findFirst({
    where: {
      id: parsed.data.id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรีวิว" }, { status: 404 });

  const updated = await prisma.drinkPosReview.update({
    where: { id: existing.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return NextResponse.json({ review: mapReview(updated) });
}
