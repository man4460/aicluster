import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { resolveBarberHistoryCalendarFromSearchParams } from "@/lib/barber/history-calendar-query";
import { getBarberSparkBucketsForCalendarFilter } from "@/lib/barber/period-revenue";
import { getBarberDataScope } from "@/lib/trial/module-scopes";

/** กราฟรายได้/จำนวนครั้ง ตามปี·เดือน·วัน — ไม่รับพารามิเตอร์ค้นหา (q) */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const { searchParams } = new URL(req.url);

  try {
    const { year, month, day } = await resolveBarberHistoryCalendarFromSearchParams(
      ownerId,
      scope.trialSessionId,
      searchParams,
    );
    const spark = await getBarberSparkBucketsForCalendarFilter(
      ownerId,
      scope.trialSessionId,
      year,
      month,
      day,
    );
    return NextResponse.json(spark);
  } catch (e) {
    console.error("[barber/history/spark]", e);
    const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
