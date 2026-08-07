import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import {
  ensureBuildingPosLoyaltySettings,
  formatBuildingPosLoyaltyEarnRule,
  listBuildingPosLoyaltyRewards,
  mapLoyaltyMember,
} from "@/systems/building-pos/lib/loyalty";

const lookupSchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
  phone: z.string().min(9).max(20),
});

/** GET — ดูคะแนน + รายการแลก (เบอร์เต็ม 9–10 หลัก) */
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

    const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(
      parsed.data.ownerId,
      parsed.data.trialSessionId,
    );
    const settings = await ensureBuildingPosLoyaltySettings(parsed.data.ownerId, trialSessionId);
    const rulePreview = formatBuildingPosLoyaltyEarnRule(
      settings.baht_per_point,
      settings.points_per_unit,
    );
    const rewards = await listBuildingPosLoyaltyRewards(parsed.data.ownerId, trialSessionId, {
      activeOnly: true,
    });

    if (!settings.enabled) {
      return NextResponse.json({
        enabled: false,
        member: null,
        rewards: [],
        rule_preview: rulePreview,
        redeem_mode: "staff_only",
      });
    }

    const phone = normalizeMemberPhone(parsed.data.phone);
    if (phone.length < 9 || phone.length > 10) {
      return NextResponse.json({ error: "กรอกเบอร์โทร 9–10 หลักเพื่อดูคะแนน" }, { status: 400 });
    }

    const row = await prisma.buildingPosLoyaltyMember.findUnique({
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
      member: row ? mapLoyaltyMember(row) : null,
      rewards,
      rule_preview: rulePreview,
      redeem_mode: "staff_only",
      hint:
        row == null
          ? "ยังไม่มีคะแนนบนเบอร์นี้ — กรอกเบอร์ตอนสั่งอาหาร แล้วรอร้านยืนยันชำระเพื่อสะสม"
          : null,
    });
  } catch (e) {
    console.error("[building-pos/public/loyalty GET]", e);
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
