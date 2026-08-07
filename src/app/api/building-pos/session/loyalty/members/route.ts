import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { parseLoyaltyPhoneQuery } from "@/lib/loyalty-stamp/member-qr";
import { prisma } from "@/lib/prisma";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import {
  ensureBuildingPosLoyaltySettings,
  findOrCreateBuildingPosLoyaltyMember,
  formatBuildingPosLoyaltyEarnRule,
  listBuildingPosLoyaltyRewards,
  mapLoyaltyMember,
  redeemBuildingPosLoyaltyReward,
} from "@/systems/building-pos/lib/loyalty";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const settings = await ensureBuildingPosLoyaltySettings(own.ownerId, scope.trialSessionId);
    if (!settings.enabled) {
      return NextResponse.json({
        enabled: false,
        member: null,
        rewards: [],
        rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
      });
    }

    const phoneRaw = new URL(req.url).searchParams.get("phone")?.trim() ?? "";
    const q = parseLoyaltyPhoneQuery(phoneRaw);
    if ("error" in q) {
      return NextResponse.json({ error: q.error }, { status: 400 });
    }

    let member = null;
    if (q.kind === "full") {
      const row = await prisma.buildingPosLoyaltyMember.findUnique({
        where: {
          ownerUserId_trialSessionId_phone: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            phone: q.phone,
          },
        },
      });
      member = row ? mapLoyaltyMember(row) : null;
    } else {
      const rows = await prisma.buildingPosLoyaltyMember.findMany({
        where: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          phone: { endsWith: q.suffix },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });
      if (rows.length === 1) member = mapLoyaltyMember(rows[0]!);
      else if (rows.length > 1) {
        const rewards = await listBuildingPosLoyaltyRewards(own.ownerId, scope.trialSessionId, {
          activeOnly: true,
        });
        return NextResponse.json({
          enabled: true,
          member: null,
          error: "พบหลายเบอร์ที่ลงท้ายเหมือนกัน — เลือกเบอร์เต็ม",
          candidates: rows.map(mapLoyaltyMember),
          rewards,
          rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
        });
      }
    }

    const rewards = await listBuildingPosLoyaltyRewards(own.ownerId, scope.trialSessionId, {
      activeOnly: true,
    });

    return NextResponse.json({
      enabled: true,
      member,
      rewards,
      settings,
      rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    });
  } catch (e) {
    console.error("[building-pos/session/loyalty/members GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

const redeemSchema = z.object({
  phone: z.string().min(4).max(20),
  reward_id: z.number().int().positive(),
  order_id: z.number().int().positive().optional().nullable(),
  customer_name: z.string().max(160).optional().nullable(),
});

const upsertSchema = z.object({
  phone: z.string().min(9).max(20),
  customer_name: z.string().max(160).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const action = new URL(req.url).searchParams.get("action")?.trim() || "upsert";

    if (action === "redeem") {
      const parsed = redeemSchema.safeParse(json);
      if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      const result = await redeemBuildingPosLoyaltyReward({
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phoneRaw: parsed.data.phone,
        rewardId: parsed.data.reward_id,
        orderId: parsed.data.order_id ?? null,
        customerName: parsed.data.customer_name ?? "",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({
        ok: true,
        member: result.member,
        reward: result.reward,
        points_spent: result.pointsSpent,
      });
    }

    const parsed = upsertSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const memberRes = await findOrCreateBuildingPosLoyaltyMember(
      own.ownerId,
      scope.trialSessionId,
      parsed.data.phone,
      parsed.data.customer_name ?? "",
    );
    if (!memberRes.ok) return NextResponse.json({ error: memberRes.error }, { status: 400 });
    return NextResponse.json({ member: mapLoyaltyMember(memberRes.member) });
  } catch (e) {
    console.error("[building-pos/session/loyalty/members POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
