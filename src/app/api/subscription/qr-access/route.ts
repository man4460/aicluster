import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { canUseModuleQrLinks } from "@/lib/modules/qr-plan-gate";

const querySchema = z.object({
  moduleSlug: z.string().min(1).max(80),
});

/** สิทธิ์เปิดลิงก์/QR ของโมดูล — สายรายวันปิด · รายเดือน/ฟรี/แอดมินเปิด */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ moduleSlug: url.searchParams.get("moduleSlug") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "moduleSlug ไม่ถูกต้อง" }, { status: 400 });
  }

  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = canUseModuleQrLinks(ctx.access, parsed.data.moduleSlug);
  return NextResponse.json({
    ok: true,
    moduleSlug: parsed.data.moduleSlug,
    allowed,
    plan: allowed
      ? ctx.access.role === "ADMIN"
        ? "admin"
        : (ctx.access.monthly199Slugs ?? []).includes(parsed.data.moduleSlug)
          ? "monthly199"
          : "free"
      : "daily",
  });
}
