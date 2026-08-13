import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { buildingPosNormalizeReviewPhotos } from "@/lib/building-pos/portal-booking";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

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
    photoUrls: buildingPosNormalizeReviewPhotos(row.photoUrlsJson),
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    const rows = await prisma.buildingPosReview.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ reviews: rows.map(mapReview) });
  } catch (e) {
    console.error("[building-pos/session/reviews GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.buildingPosReview.findFirst({
      where: {
        id: parsed.data.id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรีวิว" }, { status: 404 });

    const updated = await prisma.buildingPosReview.update({
      where: { id: existing.id },
      data: { isPublished: parsed.data.isPublished },
    });

    return NextResponse.json({ review: mapReview(updated) });
  } catch (e) {
    console.error("[building-pos/session/reviews PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
