import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import {
  downgradeAllMonthly199ToDaily,
  downgradeSingleModuleToDaily,
  listMonthly199ModuleSlugs,
  upgradeSingleModuleToMonthly199,
  upgradeSubscribedModulesToMonthly199,
} from "@/lib/tokens/module-monthly-199";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";

const bodySchema = z.object({
  target: z.enum(["daily", "monthly199"]),
  /** อัปเกรดเฉพาะโมดูลนี้ (slug) — ใช้ตอนโควตาเต็มในโมดูล */
  moduleSlug: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "target ต้องเป็น daily หรือ monthly199" }, { status: 400 });
  }

  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.isStaff) {
    return NextResponse.json({ error: "พนักงานไม่สามารถเปลี่ยนแพ็กเกจเจ้าของได้" }, { status: 403 });
  }
  if (ctx.access.role === "ADMIN") {
    return NextResponse.json({ ok: true, skipped: true, reason: "ADMIN" });
  }
  if (isTokenDebtLocked(ctx.access.tokens) && parsed.data.target === "monthly199") {
    return NextResponse.json(
      { error: "บัญชีถูกล็อค — ชำระค่าค้างที่หน้าเติมโทเคนก่อนอัปเกรด" },
      { status: 403 },
    );
  }

  const billingUserId = ctx.billingUserId;

  if (parsed.data.target === "daily") {
    if (parsed.data.moduleSlug) {
      const result = await downgradeSingleModuleToDaily(billingUserId, parsed.data.moduleSlug);
      if (!result.ok) {
        return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
      }
      const monthly199Slugs = await listMonthly199ModuleSlugs(billingUserId);
      return NextResponse.json({
        ok: true,
        target: "daily",
        moduleSlug: parsed.data.moduleSlug,
        cleared: result.cleared ? 1 : 0,
        alreadyDaily: !result.cleared,
        monthly199Slugs,
      });
    }
    const current = await listMonthly199ModuleSlugs(billingUserId);
    if (current.length === 0 && ctx.access.subscriptionType !== "BUFFET") {
      return NextResponse.json({ ok: true, cleared: 0, alreadyDaily: true });
    }
    const { cleared } = await downgradeAllMonthly199ToDaily(billingUserId);
    return NextResponse.json({
      ok: true,
      target: "daily",
      cleared,
      monthly199Slugs: [] as string[],
    });
  }

  if (parsed.data.moduleSlug) {
    const result = await upgradeSingleModuleToMonthly199(billingUserId, parsed.data.moduleSlug);
    if (!result.ok) {
      if (result.code === "INSUFFICIENT_TOKENS") {
        return NextResponse.json(
          {
            error: `โทเคนไม่พอสำหรับแพ็ก 199 (มี ${result.balance} ต้องการ ${result.requiredTokens})`,
            code: result.code,
            balance: result.balance,
            requiredTokens: result.requiredTokens,
          },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
    }
    const monthly199Slugs = await listMonthly199ModuleSlugs(billingUserId);
    return NextResponse.json({
      ok: true,
      target: "monthly199",
      moduleSlug: parsed.data.moduleSlug,
      upgraded: result.alreadyHad ? 0 : 1,
      alreadyHad: Boolean(result.alreadyHad),
      tokensRemaining: result.tokensRemaining,
      tokensCharged: result.alreadyHad ? 0 : 199,
      monthly199Slugs,
    });
  }

  const result = await upgradeSubscribedModulesToMonthly199(billingUserId);
  if (!result.ok) {
    if (result.code === "INSUFFICIENT_TOKENS") {
      return NextResponse.json(
        {
          error: `โทเคนไม่พอสำหรับอัปเกรด ${result.moduleCount} โมดูล (มี ${result.balance} ต้องการ ${result.requiredTokens})`,
          code: result.code,
          balance: result.balance,
          requiredTokens: result.requiredTokens,
          moduleCount: result.moduleCount,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
  }

  const monthly199Slugs = await listMonthly199ModuleSlugs(billingUserId);
  return NextResponse.json({
    ok: true,
    target: "monthly199",
    upgraded: result.upgraded,
    alreadyMonthly: result.alreadyMonthly,
    tokensRemaining: result.tokensRemaining,
    tokensCharged: result.tokensCharged,
    monthly199Slugs,
  });
}
