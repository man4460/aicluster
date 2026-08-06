import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { ensureBuildingPosDemoDataForOwner } from "@/lib/trial/seed-building-pos";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";

/** ใส่ข้อมูลตัวอย่าง (เมนู/ออเดอร์/ต้นทุน) สำหรับกราฟและภาพรวม */
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    let force = true;
    try {
      const body = (await req.json()) as { force?: unknown };
      if (body?.force === false) force = false;
    } catch {
      /* body optional */
    }

    const result = await ensureBuildingPosDemoDataForOwner(prisma, own.ownerId, scope.trialSessionId, {
      force,
    });

    notifyBuildingPosOrderBoard(own.ownerId);

    return NextResponse.json({
      ok: true,
      catalogSeeded: result.catalogSeeded,
      financeSeeded: result.financeSeeded,
      message: result.financeSeeded
        ? "ใส่ข้อมูลตัวอย่างแล้ว"
        : "มีออเดอร์อยู่แล้ว — ส่ง force เพื่อรีเซ็ตออเดอร์ตัวอย่าง",
    });
  } catch (e) {
    console.error("[building-pos/session/seed-demo POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
