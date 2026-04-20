import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { resolveBuildingPosSalesCalendarFromSearchParams } from "@/lib/building-pos/history-calendar-query";
import { getBuildingPosSparkBucketsForCalendarFilter } from "@/lib/building-pos/period-spark";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

/** กราฟรายรับเทียบรายจ่าย ตามปี·เดือน·วัน (เขตเวลาไทย) */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBuildingPosDataScope(own.ownerId);
  const { searchParams } = new URL(req.url);

  try {
    const { year, month, day } = await resolveBuildingPosSalesCalendarFromSearchParams(
      own.ownerId,
      scope.trialSessionId,
      searchParams,
    );
    const spark = await getBuildingPosSparkBucketsForCalendarFilter(
      own.ownerId,
      scope.trialSessionId,
      year,
      month,
      day,
    );
    return NextResponse.json(spark);
  } catch (e) {
    console.error("[building-pos/session/sales-spark]", e);
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
