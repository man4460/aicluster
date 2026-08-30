import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

export async function GET() {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.parkingCostCategory.findMany({
    where: { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { name?: string; sortOrder?: number } | null;
  const name = body?.name?.trim() ?? "";
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }
  try {
    if (typeof prisma.parkingCostCategory?.create !== "function") {
      return NextResponse.json(
        { error: "Prisma client ยังไม่มีโมเดลหมวดรายจ่าย — รีสตาร์ทเซิร์ฟเวอร์หลัง prisma generate" },
        { status: 503 },
      );
    }
    const scope = { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
    const max = await prisma.parkingCostCategory.aggregate({ where: scope, _max: { sortOrder: true } });
    const category = await prisma.parkingCostCategory.create({
      data: {
        ...scope,
        name,
        sortOrder:
          typeof body?.sortOrder === "number" && Number.isFinite(body.sortOrder)
            ? Math.round(body.sortOrder)
            : (max._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ category });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    if (/does not exist|Unknown table|parking_cost_categories/i.test(message)) {
      return NextResponse.json(
        { error: "ยังไม่มีตารางหมวดรายจ่ายในฐานข้อมูล — รัน migration parking finance ก่อน" },
        { status: 503 },
      );
    }
    if (/Foreign key|ER_NO_REFERENCED_ROW/i.test(message)) {
      return NextResponse.json({ error: "ผูกเจ้าของร้านไม่สำเร็จ — ลองออกจากระบบแล้วเข้าใหม่" }, { status: 400 });
    }
    console.error("[parking/cost-categories POST]", caught);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? `บันทึกหมวดหมู่ไม่สำเร็จ: ${message.slice(0, 240)}` : "บันทึกหมวดหมู่ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
