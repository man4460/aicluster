import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { canUseModuleQrLinks } from "@/lib/modules/qr-plan-gate";
import { isDailyTokenExemptModuleSlug, isQrLinkAllowedOnDailyPlan } from "@/lib/modules/config";

const querySchema = z.object({
  moduleSlug: z.string().min(1).max(80),
});

/** สิทธิ์เปิดลิงก์/QR ของโมดูล — สายรายวันปิด (ยกเว้นโมดูลฟรี / LMS) · รายเดือน/แอดมินเปิด */
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

  const moduleSlug = parsed.data.moduleSlug;
  const allowed = canUseModuleQrLinks(ctx.access, moduleSlug);
  const plan = !allowed
    ? "daily"
    : ctx.access.role === "ADMIN"
      ? "admin"
      : (ctx.access.monthly199Slugs ?? []).includes(moduleSlug)
        ? "monthly199"
        : isDailyTokenExemptModuleSlug(moduleSlug)
          ? "free"
          : isQrLinkAllowedOnDailyPlan(moduleSlug)
            ? "daily-qr"
            : "free";

  return NextResponse.json({
    ok: true,
    moduleSlug,
    allowed,
    plan,
  });
}
