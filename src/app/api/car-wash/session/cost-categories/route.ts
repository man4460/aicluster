import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const rows = await prisma.carWashCostCategory.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        created_at: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/cost-categories GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.carWashCostCategory.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
      },
    });
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        created_at: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/cost-categories POST");
  }
}
