import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { PLAN_PRICES, type PlanPrice } from "@/lib/module-permissions";
import { applyBuffetPurchaseFromTokenBalance } from "@/lib/tokens/apply-buffet-purchase-from-balance";

const bodySchema = z.object({
  amountBaht: z.number().refine((n): n is PlanPrice => PLAN_PRICES.includes(n as PlanPrice)),
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
    return NextResponse.json({ error: "เลือกแพ็กเกจจากราคาที่กำหนดเท่านั้น" }, { status: 400 });
  }

  const result = await applyBuffetPurchaseFromTokenBalance(prisma, auth.session.sub, parsed.data.amountBaht);

  if (result.ok) {
    return NextResponse.json({
      ok: true,
      tokensRemaining: result.tokensRemaining,
      targetTier: result.targetTier,
    });
  }

  if (result.code === "INSUFFICIENT_TOKENS") {
    return NextResponse.json(
      {
        ok: false,
        code: "INSUFFICIENT_TOKENS",
        balance: result.balance,
        requiredTokens: result.requiredTokens,
        targetTier: result.targetTier,
      },
      { status: 402 },
    );
  }

  return NextResponse.json(
    { ok: false, error: result.message },
    { status: result.code === "TIER_CLOSED" ? 403 : 400 },
  );
}
