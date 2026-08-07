import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosDemoDataForOwner } from "@/lib/trial/seed-drink-pos";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";

/** ใส่ข้อมูลตัวอย่าง (หมวด/สินค้า/บิล/คะแนน) */
export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  let force = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    if (body?.force === true) force = true;
  } catch {
    /* body optional */
  }

  const result = await ensureDrinkPosDemoDataForOwner(prisma, auth.ctx.ownerUserId, { force });
  notifyDrinkPosOrderBoard(auth.ctx.ownerUserId);

  return NextResponse.json({
    ok: true,
    seeded: result.seeded,
    message: result.seeded
      ? "ใส่ข้อมูลตัวอย่างแล้ว"
      : "มีหมวดอยู่แล้ว — ส่ง force:true เพื่อรีเซ็ตข้อมูลตัวอย่าง",
  });
}
