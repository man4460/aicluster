import { prisma } from "@/lib/prisma";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import {
  canOwnerUseModulePublicLinks,
  isOwnerModulePublicOpenAndCharge,
} from "@/lib/modules/public-portal-access";

export async function findUsedCarShowroomPublicShop(
  slugRaw: string,
  trialParam?: string | null,
) {
  const slug = slugRaw.trim().toLowerCase().slice(0, 80);
  if (slug.length < 2) return null;
  const trialSessionId = (trialParam?.trim() || "prod").slice(0, 36);
  const shop = await prisma.usedCarShowroomShop.findFirst({
    where: { slug, trialSessionId, portalEnabled: true },
  });
  return shop;
}

export async function gateUsedCarShowroomPublicShop(
  slugRaw: string,
  trialParam?: string | null,
) {
  const shop = await findUsedCarShowroomPublicShop(slugRaw, trialParam);
  if (!shop) return { ok: false as const, status: 404 as const, error: "ไม่พบโชว์รูม" };

  if (!(await canOwnerUseModulePublicLinks(shop.ownerUserId, USED_CAR_SHOWROOM_MODULE_SLUG))) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "ลิงก์โชว์รูมใช้ได้เฉพาะแพ็กรายเดือนของโมดูลนี้ — สายรายวันเข้าไม่ได้",
    };
  }

  const open = await isOwnerModulePublicOpenAndCharge(
    shop.ownerUserId,
    USED_CAR_SHOWROOM_MODULE_SLUG,
  );
  if (!open) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "ลิงก์ปิดชั่วคราว หรือต้องอัปเกรดแพ็กรายเดือน",
    };
  }
  return { ok: true as const, shop };
}
