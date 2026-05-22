import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { resolveMassageHistoryCalendarFromSearchParams } from "@/lib/massage/history-calendar-query";
import { getMassageSparkBucketsForCalendarFilter } from "@/lib/massage/period-revenue";
import { getMassageDataScope } from "@/lib/trial/module-scopes";

/** กราฟรายได้/จำนวนครั้ง ตามปี·เดือน·วัน — ไม่รับพารามิเตอร์ค้นหา (q) */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const { searchParams } = new URL(req.url);

  try {
    const { year, month, day } = await resolveMassageHistoryCalendarFromSearchParams(
      ownerId,
      scope.trialSessionId,
      searchParams,
    );
    const spark = await getMassageSparkBucketsForCalendarFilter(
      ownerId,
      scope.trialSessionId,
      year,
      month,
      day,
    );
    return NextResponse.json(spark);
  } catch (e) {
    console.error("[massage/history/spark]", e);
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
