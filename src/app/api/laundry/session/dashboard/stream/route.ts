import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { createLaundryDashboardSseResponse } from "@/systems/laundry/lib/dashboard-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเมื่อออเดอร์/แพ็กเกจบนแดชบอร์ดเปลี่ยน */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  return createLaundryDashboardSseResponse(own.ownerId);
}
