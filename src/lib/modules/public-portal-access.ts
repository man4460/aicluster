import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { canUseModuleQrLinks } from "@/lib/modules/qr-plan-gate";
import { listMonthly199ModuleSlugs } from "@/lib/tokens/module-monthly-199";
import {
  applyModuleDailyTokenDeduction,
  recordModulePublicUsageDay,
  type ModuleDailyTokenResult,
} from "@/lib/tokens/module-daily-deduction";

export type PublicLinkChargeResult =
  | ModuleDailyTokenResult
  | { ok: false; reason: "qr_monthly_required" | "no_access" };

/** ทดลองโมดูลยังไม่หมดอายุ — อนุญาตลิงก์สาธารณะชั่วคราวแม้ยังไม่มีแพ็กรายเดือน */
export async function ownerHasActiveModuleTrial(
  ownerId: string,
  moduleSlug: string,
): Promise<boolean> {
  if (!ownerId || !moduleSlug) return false;
  const mod = await prisma.appModule.findFirst({
    where: { slug: moduleSlug, isActive: true },
    select: { id: true },
  });
  if (!mod) return false;
  const trial = await prisma.trialSession.findFirst({
    where: {
      userId: ownerId,
      moduleId: mod.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return trial != null;
}

/**
 * สิทธิ์ปลายทางลิงก์/QR (รายเดือน · ฟรี · LMS · แอดมิน · ทดลองที่ยังไม่หมด)
 */
export async function canOwnerUseModulePublicLinks(
  ownerId: string,
  moduleSlug: string,
  access?: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): Promise<boolean> {
  if (!ownerId || !moduleSlug) return false;
  let a = access;
  if (!a) {
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true },
    });
    if (!user) return false;
    const monthly199Slugs = await listMonthly199ModuleSlugs(ownerId);
    a = { role: user.role, monthly199Slugs };
  }
  if (canUseModuleQrLinks(a, moduleSlug)) return true;
  return ownerHasActiveModuleTrial(ownerId, moduleSlug);
}

/**
 * หักโทเคนเจ้าของเมื่อมีการใช้ลิงก์ภายนอก (ลูกค้า / พนักงาน / สถานี)
 * — เกตรายเดือนก่อน (กันคัดลอกลิงก์แล้วดาวน์เกรดเป็นรายวัน)
 * — 1 ครั้งต่อโมดูลต่อวัน Bangkok · ซ้ำกับแดชบอร์ดไม่หักซ้ำ
 * — แพ็กรายเดือน: ไม่หักโทเคน แต่**บันทึกว่ามีคนเข้าใช้งานวันนั้น** (นับเป็นใช้งานในเดือน)
 */
export async function ensureOwnerModuleDailyChargeOnPublicUse(
  billingUserId: string,
  moduleSlug: string,
): Promise<PublicLinkChargeResult> {
  if (!billingUserId || !moduleSlug) {
    return { ok: true, charged: false, reason: "exempt" };
  }

  const allowed = await canOwnerUseModulePublicLinks(billingUserId, moduleSlug);
  if (!allowed) {
    return { ok: false, reason: "qr_monthly_required" };
  }

  const charge = await applyModuleDailyTokenDeduction(billingUserId, moduleSlug);
  if (!charge.ok) return charge;

  /** รายเดือน / ฟรี / หักแล้ว — ยังต้องมีแถว usage วันนั้นเมื่อเข้าจากลิงก์ภายนอก */
  if (charge.reason === "monthly_199" || charge.reason === "exempt") {
    await recordModulePublicUsageDay(billingUserId, moduleSlug);
  }

  return charge;
}

/** ข้อความ 403 เมื่อลิงก์ภายนอกถูกปฏิเสธ */
export function publicLinkDeniedMessage(charge: Extract<PublicLinkChargeResult, { ok: false }>): string {
  if (charge.reason === "qr_monthly_required") {
    return "ลิงก์ใช้ได้เฉพาะแพ็กรายเดือนของโมดูลนี้";
  }
  return "ลิงก์ปิดชั่วคราว";
}

/**
 * เกตพอร์ทัล / ลิงก์สาธารณะ + หักโทเคนเจ้าของเมื่อเข้าจากภายนอก
 * คืน false เมื่อไม่มีสิทธิ์ / โมดูลปิด / ล็อคหนี้ / **ไม่มีแพ็กรายเดือน** (กันคัดลอกลิงก์แล้วดาวน์เกรดเป็นรายวัน)
 * ยกเว้นโมดูลใน `isQrLinkAllowedOnDailyPlan` (เช่น LMS) · โมดูลฟรี · ทดลองที่ยัง ACTIVE
 */
export async function isOwnerModulePublicOpenAndCharge(
  ownerId: string,
  moduleSlug: string,
): Promise<boolean> {
  if (!ownerId || !moduleSlug) return false;

  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: moduleSlug, isActive: true },
      select: { slug: true, groupId: true },
    }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        role: true,
        subscriptionType: true,
        subscriptionTier: true,
        tokens: true,
      },
    }),
  ]);
  if (!mod || !user) return false;

  const monthly199Slugs = await listMonthly199ModuleSlugs(ownerId);
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
    monthly199Slugs,
  };

  if (!canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId })) {
    /** ทดลองยังเปิด — อนุญาตแม้ยังไม่ subscribe */
    const onTrial = await ownerHasActiveModuleTrial(ownerId, moduleSlug);
    if (!onTrial) return false;
  }

  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ownerId, moduleSlug);
  return charge.ok;
}
