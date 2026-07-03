import type { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import {
  getBuildingPosDataScope,
  getCarWashDataScope,
  getLaundryDataScope,
} from "@/lib/trial/module-scopes";
import {
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";
import { isModuleShopBrandingSlug } from "@/lib/module-shop/slugs";

export type ModuleShopOwnerContext = {
  ownerUserId: string;
  trialSessionId: string;
};

export async function resolveModuleShopOwnerContext(
  moduleSlug: string,
): Promise<{ ok: true; ctx: ModuleShopOwnerContext } | { ok: false; res: NextResponse }> {
  if (!isModuleShopBrandingSlug(moduleSlug)) {
    const { NextResponse: NR } = await import("next/server");
    return { ok: false, res: NR.json({ error: "โมดูลไม่รองรับ" }, { status: 404 }) };
  }

  const auth = await requireSession();
  if (!auth.ok) {
    const { NextResponse: NR } = await import("next/server");
    return { ok: false, res: NR.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (moduleSlug === CAR_WASH_MODULE_SLUG) {
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return { ok: false, res: own.response };
    if (own.isStaff) {
      const { NextResponse: NR } = await import("next/server");
      return { ok: false, res: NR.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 }) };
    }
    const scope = await getCarWashDataScope(own.ownerId);
    return { ok: true, ctx: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } };
  }

  if (moduleSlug === LAUNDRY_MODULE_SLUG) {
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return { ok: false, res: own.response };
    if (own.isStaff) {
      const { NextResponse: NR } = await import("next/server");
      return { ok: false, res: NR.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 }) };
    }
    const scope = await getLaundryDataScope(own.ownerId);
    return { ok: true, ctx: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } };
  }

  if (moduleSlug === BUILDING_POS_MODULE_SLUG) {
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return { ok: false, res: own.response };
    const scope = await getBuildingPosDataScope(own.ownerId);
    return { ok: true, ctx: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } };
  }

  const { NextResponse: NR } = await import("next/server");
  return { ok: false, res: NR.json({ error: "โมดูลไม่รองรับ" }, { status: 404 }) };
}
