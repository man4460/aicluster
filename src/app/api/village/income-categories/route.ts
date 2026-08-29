import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { ensureVillageIncomeCategories } from "@/lib/village/ensure-village-income-categories";

function mapCategory(r: {
  id: string;
  name: string;
  kind: string;
  isBuiltin: boolean;
  sortOrder: number;
  createdAt: Date;
}) {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind as "COMMON_FEE" | "CUSTOM",
    isBuiltin: r.isBuiltin,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  try {
    const scope = await getVillageDataScope(own.ownerId);
    await ensureVillageIncomeCategories(own.ownerId, scope.trialSessionId);
    const rows = await prisma.villageIncomeCategory.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ categories: rows.map(mapCategory) });
  } catch (e) {
    console.error("village/income-categories GET", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "โหลดหมวดรายรับไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const name = body.name?.trim() ?? "";
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const maxSort = await prisma.villageIncomeCategory.aggregate({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      _max: { sortOrder: true },
    });
    const sortOrder =
      typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? Math.round(body.sortOrder)
        : (maxSort._max.sortOrder ?? 0) + 1;

    const row = await prisma.villageIncomeCategory.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name,
        kind: "CUSTOM",
        isBuiltin: false,
        sortOrder,
      },
    });
    return NextResponse.json({ category: mapCategory(row) });
  } catch (e) {
    console.error("village/income-categories POST", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "สร้างหมวดรายรับไม่สำเร็จ" }, { status: 500 });
  }
}
