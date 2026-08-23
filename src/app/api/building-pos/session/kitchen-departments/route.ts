import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { assertPlanMultiKitchenAllowance, planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { mapKitchenDepartmentRow } from "@/systems/building-pos/lib/kitchen-department";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const bill = await getModuleBillingContext(auth.session.sub);
    const policy = await getPlanFeaturePolicy();
    const features = bill
      ? planFeaturesApiPayload(bill.access, policy, BUILDING_POS_MODULE_SLUG)
      : planFeaturesApiPayload(
          { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE", monthly199Slugs: [] },
          policy,
          BUILDING_POS_MODULE_SLUG,
        );

    if (!features.multiKitchen) {
      return NextResponse.json({ departments: [], features });
    }

    const rows = await prisma.buildingPosKitchenDepartment.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({
      departments: rows.map(mapKitchenDepartmentRow),
      features,
    });
  } catch (e) {
    console.error("[building-pos/session/kitchen-departments GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const bill = await getModuleBillingContext(auth.session.sub);
    const policy = await getPlanFeaturePolicy();
    if (bill) {
      const gate = assertPlanMultiKitchenAllowance(bill.access, policy, BUILDING_POS_MODULE_SLUG);
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
      }
    } else {
      const gate = assertPlanMultiKitchenAllowance(
        { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE", monthly199Slugs: [] },
        policy,
        BUILDING_POS_MODULE_SLUG,
      );
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
      }
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.buildingPosKitchenDepartment.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        sortOrder: parsed.data.sort_order,
        isActive: parsed.data.is_active,
      },
    });
    return NextResponse.json({ department: mapKitchenDepartmentRow(row) });
  } catch (e) {
    console.error("[building-pos/session/kitchen-departments POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const bill = await getModuleBillingContext(auth.session.sub);
    const policy = await getPlanFeaturePolicy();
    const access = bill?.access ?? {
      role: "USER" as const,
      subscriptionType: "DAILY" as const,
      subscriptionTier: "NONE" as const,
      monthly199Slugs: [] as string[],
    };
    const gate = assertPlanMultiKitchenAllowance(access, policy, BUILDING_POS_MODULE_SLUG);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
    }

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const data: { name?: string; sortOrder?: number; isActive?: boolean } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.sort_order !== undefined) data.sortOrder = parsed.data.sort_order;
    if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;

    const n = await prisma.buildingPosKitchenDepartment.updateMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      data,
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบแผนกครัว" }, { status: 404 });
    const row = await prisma.buildingPosKitchenDepartment.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบแผนกครัว" }, { status: 404 });
    return NextResponse.json({ department: mapKitchenDepartmentRow(row) });
  } catch (e) {
    console.error("[building-pos/session/kitchen-departments PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const bill = await getModuleBillingContext(auth.session.sub);
    const policy = await getPlanFeaturePolicy();
    const access = bill?.access ?? {
      role: "USER" as const,
      subscriptionType: "DAILY" as const,
      subscriptionTier: "NONE" as const,
      monthly199Slugs: [] as string[],
    };
    const gate = assertPlanMultiKitchenAllowance(access, policy, BUILDING_POS_MODULE_SLUG);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
    }

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    await prisma.buildingPosMenuItem.updateMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        kitchenDepartmentId: id,
      },
      data: { kitchenDepartmentId: null },
    });

    const n = await prisma.buildingPosKitchenDepartment.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบแผนกครัว" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/kitchen-departments DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
