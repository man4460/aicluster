import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getDormMonthlyRevenueCostBuckets } from "@/lib/dormitory/dorm-monthly-revenue-cost";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
/** กราฟเปรียบเทียบรายได้ (ชำระแล้ว) กับรายจ่าย/ต้นทุน รายเดือน — ช่วงวันที่ตามปฏิทินไทย */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";

  try {
    const scope = await getDormitoryDataScope(auth.session.sub);
    if (scope.isTrialSandbox) {
      const { ensureDormitoryDemoFinanceData } = await import(
        "@/lib/dormitory/ensure-dormitory-demo-finance-data"
      );
      await ensureDormitoryDemoFinanceData(prisma, auth.session.sub, scope.trialSessionId, {
        months: 12,
        fillMissingOnly: true,
      }).catch((e) => console.error("dorm demo finance ensure", e));
    }
    const summary = await getDormMonthlyRevenueCostBuckets(
      auth.session.sub,
      scope.trialSessionId,
      from || null,
      to || null,
    );
    return NextResponse.json(summary);
  } catch (e) {
    console.error("dorm/finance/monthly-revenue-cost", e);
    return NextResponse.json({ error: "โหลดสรุปไม่สำเร็จ" }, { status: 500 });
  }
}
