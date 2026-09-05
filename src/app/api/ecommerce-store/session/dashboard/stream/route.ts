import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth } from "@/lib/ecommerce/api-owner";
import { createEcommerceDashboardSseResponse } from "@/systems/ecommerce-store/lib/dashboard-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเมื่อออเดอร์บนแดชบอร์ดเปลี่ยน */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return createEcommerceDashboardSseResponse(owner.ownerUserId);
}
