import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { getVillageMonthlyRevenueCostBuckets } from "@/lib/village/village-monthly-revenue-cost";

/** กราฟเปรียบเทียบรายได้ (ชำระแล้ว) กับรายจ่าย/ต้นทุน รายเดือน — ช่วงวันที่ตามปฏิทินไทย */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const summary = await getVillageMonthlyRevenueCostBuckets(
      own.ownerId,
      scope.trialSessionId,
      from || null,
      to || null,
    );
    return NextResponse.json(summary);
  } catch (e) {
    console.error("village/finance/monthly-revenue-cost", e);
    return NextResponse.json({ error: "โหลดสรุปไม่สำเร็จ" }, { status: 500 });
  }
}
