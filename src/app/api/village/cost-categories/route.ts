import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const rows = await prisma.villageCostCategory.findMany({
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
    console.error("village/cost-categories GET", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "โหลดหมวดต้นทุนไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const row = await prisma.villageCostCategory.create({
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
    console.error("village/cost-categories POST", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "สร้างหมวดต้นทุนไม่สำเร็จ" }, { status: 500 });
  }
}
