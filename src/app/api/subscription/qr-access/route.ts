import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { canUseModuleQrLinks } from "@/lib/modules/qr-plan-gate";
import {
  canOwnerUseModulePublicLinks,
  ownerHasActiveModuleTrial,
} from "@/lib/modules/public-portal-access";
import { isDailyTokenExemptModuleSlug, isQrLinkAllowedOnDailyPlan } from "@/lib/modules/config";

const querySchema = z.object({
  moduleSlug: z.string().min(1).max(80),
});

/** สิทธิ์เปิดลิงก์/QR ของโมดูล — สายรายวันปิด (ยกเว้นโมดูลฟรี / LMS / ทดลอง ACTIVE) · รายเดือน/แอดมินเปิด */
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
  const allowed = await canOwnerUseModulePublicLinks(ctx.billingUserId, moduleSlug, ctx.access);
  const onTrial = !canUseModuleQrLinks(ctx.access, moduleSlug)
    ? await ownerHasActiveModuleTrial(ctx.billingUserId, moduleSlug)
    : false;
  const plan = !allowed
    ? "daily"
    : ctx.access.role === "ADMIN"
      ? "admin"
      : (ctx.access.monthly199Slugs ?? []).includes(moduleSlug)
        ? "monthly199"
        : onTrial
          ? "trial"
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
