import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";

const uuidSchema = z.string().uuid();

function sessionQueryUnsupported(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("customer_session_id") || m.includes("customerSessionId") || m.includes("Unknown argument");
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const ownerId = u.searchParams.get("ownerId")?.trim() ?? "";
    const trialParam = u.searchParams.get("t")?.trim() ?? "";
    const tableNo = u.searchParams.get("table")?.trim() ?? "";
    const session = u.searchParams.get("session")?.trim() ?? "";
    if (!ownerId || !session) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }
    if (!uuidSchema.safeParse(session).success) {
      return NextResponse.json({ error: "session ไม่ถูกต้อง" }, { status: 400 });
    }
    const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);
    try {
      const rows = await prisma.buildingPosOrder.findMany({
        where: {
          ownerUserId: ownerId,
          trialSessionId,
          tableNo,
          customerSessionId: session,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ orders: rows.map(mapBuildingPosOrderRow) });
    } catch (e) {
      if (sessionQueryUnsupported(e)) {
        console.warn("[building-pos/public/my-orders GET] session column/client mismatch — return empty list:", e);
        return NextResponse.json({ orders: [] });
      }
      throw e;
    }
  } catch (e) {
    console.error("[building-pos/public/my-orders GET]", e);
    return NextResponse.json({ error: "โหลดออเดอร์ไม่สำเร็จ" }, { status: 500 });
  }
}
