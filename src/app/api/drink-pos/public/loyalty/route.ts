import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import {
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
  mapDrinkPosLoyaltyMember,
} from "@/systems/drink-pos/lib/loyalty";

const lookupSchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
  phone: z.string().min(9).max(20),
});

async function resolveTrial(ownerId: string, trialSessionId?: string | null) {
  const scope = await getDrinkPosDataScope(ownerId);
  if (trialSessionId && trialSessionId.length > 0) return trialSessionId;
  return scope.trialSessionId;
}

/** GET — ดูคะแนน + รายการแลก */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = lookupSchema.safeParse({
      ownerId: searchParams.get("ownerId")?.trim() ?? "",
      trialSessionId: searchParams.get("t")?.trim() || searchParams.get("trialSessionId")?.trim() || null,
      phone: searchParams.get("phone")?.trim() ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "กรอกเบอร์โทร 9–10 หลักเพื่อดูคะแนน" }, { status: 400 });
    }

    const open = await isDrinkPosPortalOpenForOwner(parsed.data.ownerId);
    if (!open) return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะ" }, { status: 403 });

    const trialSessionId = await resolveTrial(parsed.data.ownerId, parsed.data.trialSessionId);
    const settings = await ensureDrinkPosLoyaltySettings(parsed.data.ownerId, trialSessionId);
    const rulePreview = formatDrinkPosLoyaltyEarnRule(
      settings.baht_per_point,
      settings.points_per_unit,
    );
    const rewards = await listDrinkPosLoyaltyRewards(parsed.data.ownerId, trialSessionId, {
      activeOnly: true,
    });

    if (!settings.enabled) {
      return NextResponse.json({
        enabled: false,
        member: null,
        rewards: [],
        rule_preview: rulePreview,
      });
    }

    const phone = normalizeMemberPhone(parsed.data.phone);
    if (phone.length < 9 || phone.length > 10) {
      return NextResponse.json({ error: "กรอกเบอร์โทร 9–10 หลักเพื่อดูคะแนน" }, { status: 400 });
    }

    const row = await prisma.drinkPosMember.findUnique({
      where: {
        ownerUserId_trialSessionId_phone: {
          ownerUserId: parsed.data.ownerId,
          trialSessionId,
          phone,
        },
      },
    });

    return NextResponse.json({
      enabled: true,
      member: row ? mapDrinkPosLoyaltyMember(row) : null,
      rewards,
      rule_preview: rulePreview,
      redeem_mode: "staff_only",
      hint: row == null ? "ยังไม่มีคะแนนบนเบอร์นี้ — กรอกเบอร์ตอนชำระที่ร้านเพื่อสะสม" : null,
    });
  } catch (e) {
    console.error("[drink-pos/public/loyalty GET]", e);
    return NextResponse.json({ error: "โหลดคะแนนไม่สำเร็จ" }, { status: 500 });
  }
}

/** POST — ปิดแลกจากลิงก์ลูกค้า (ต้องให้พนักงานแลก) · เฟสถัดไป: OTP SMS */
export async function POST() {
  return NextResponse.json(
    {
      error: "การแลกคะแนนต้องยืนยันกับพนักงานที่ร้าน — แจ้งเบอร์ให้พนักงานแลกให้",
      code: "REDEEM_STAFF_ONLY",
    },
    { status: 403 },
  );
}
