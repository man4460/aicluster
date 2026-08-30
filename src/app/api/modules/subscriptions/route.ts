import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import {
  getModuleResubscribeCooldown,
  listActiveResubscribeCooldowns,
  listSubscribedModuleIds,
  subscribeModule,
} from "@/lib/modules/subscriptions-store";
import { isDailyTokenExemptModuleSlug, MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import { listMonthly199ModuleSlugs, purchaseModuleMonthly199 } from "@/lib/tokens/module-monthly-199";
import { chargeModuleSubscribeDailyToken } from "@/lib/tokens/module-daily-deduction";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";

const bodySchema = z.object({
  moduleId: z.string().min(1),
  plan: z.enum(["daily", "monthly199"]).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [moduleIds, cooldowns, monthly199Slugs] = await Promise.all([
    listSubscribedModuleIds(auth.session.sub),
    listActiveResubscribeCooldowns(auth.session.sub),
    listMonthly199ModuleSlugs(auth.session.sub),
  ]);
  return NextResponse.json({ moduleIds, cooldowns, monthly199Slugs });
}

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
  if (!parsed.success) return NextResponse.json({ error: "moduleId ไม่ถูกต้อง" }, { status: 400 });

  const mod = await prisma.appModule.findUnique({
    where: { id: parsed.data.moduleId },
    select: { id: true, slug: true, groupId: true, isActive: true },
  });
  if (!mod || !mod.isActive) return NextResponse.json({ error: "ไม่พบระบบ" }, { status: 404 });
  if (mod.slug === MQTT_SERVICE_MODULE_SLUG && !isMqttServiceModuleEnabled()) {
    return NextResponse.json({ error: "ระบบบริการ MQTT ปิดรับ Subscribe ชั่วคราว" }, { status: 403 });
  }

  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    return NextResponse.json({ error: "สิทธิ์พนักงานไม่รองรับระบบนี้" }, { status: 403 });
  }
  if (isTokenDebtLocked(ctx.access.tokens)) {
    return NextResponse.json(
      { error: "บัญชีถูกล็อค — ชำระค่าค้างที่หน้าเติมโทเคนก่อนสมัครระบบ" },
      { status: 403 },
    );
  }
  if (!canAccessAppModule(ctx.access, { slug: mod.slug, groupId: mod.groupId })) {
    return NextResponse.json({ error: "แพ็กเกจปัจจุบันยังเข้าใช้ระบบนี้ไม่ได้" }, { status: 403 });
  }

  const cd = await getModuleResubscribeCooldown(auth.session.sub, mod.id);
  const alreadySubscribed = (await listSubscribedModuleIds(auth.session.sub)).includes(mod.id);
  if (!alreadySubscribed && cd.locked && cd.unlockAt) {
    return NextResponse.json(
      {
        error:
          "ยังอยู่ในช่วงหลังยกเลิก Subscribe ไม่สามารถ Subscribe ระบบนี้ได้จนกว่าจะครบ 1 เดือน กรุณารอจนถึงวันที่ปลดล็อค",
        unlockAt: cd.unlockAt.toISOString(),
      },
      { status: 403 },
    );
  }

  if (parsed.data.plan === "monthly199") {
    if (isDailyTokenExemptModuleSlug(mod.slug)) {
      await subscribeModule(auth.session.sub, mod.id);
      return NextResponse.json({ ok: true, monthly199: false });
    }
    const bought = await purchaseModuleMonthly199(ctx.billingUserId, mod.slug);
    if (!bought.ok) {
      if (bought.code === "INSUFFICIENT_TOKENS") {
        return NextResponse.json(
          {
            error: `โทเคนไม่พอสำหรับแพ็ก 199 ของโมดูลนี้ (มี ${bought.balance} ต้องการ ${bought.requiredTokens})`,
            code: bought.code,
            balance: bought.balance,
            requiredTokens: bought.requiredTokens,
          },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: bought.message }, { status: 400 });
    }
    await subscribeModule(auth.session.sub, mod.id);
    return NextResponse.json({
      ok: true,
      monthly199: true,
      tokensRemaining: bought.tokensRemaining,
    });
  }

  if (!isDailyTokenExemptModuleSlug(mod.slug)) {
    const charged = await chargeModuleSubscribeDailyToken(ctx.billingUserId, mod.slug);
    if (!charged.ok) {
      if (charged.code === "INSUFFICIENT_TOKENS") {
        return NextResponse.json(
          {
            error: `โทเคนไม่พอสำหรับสมัครระบบนี้ (มี ${charged.balance} ต้องการ ${charged.requiredTokens})`,
            code: charged.code,
            balance: charged.balance,
            requiredTokens: charged.requiredTokens,
          },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: charged.message }, { status: 403 });
    }
    await subscribeModule(auth.session.sub, mod.id);
    return NextResponse.json({
      ok: true,
      monthly199: false,
      tokensRemaining: charged.tokensRemaining,
      tokenCharged: charged.charged,
    });
  }

  await subscribeModule(auth.session.sub, mod.id);
  return NextResponse.json({ ok: true, monthly199: false, tokensRemaining: ctx.access.tokens });
}
