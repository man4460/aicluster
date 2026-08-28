import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { createAttendanceDashboardSseResponse } from "@/lib/attendance/dashboard-sse";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — อัปเดตเฉพาะ log + สถิติที่เปลี่ยนบนแดชบอร์ดเช็คอิน */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return createAttendanceDashboardSseResponse(ctx.billingUserId);
}
