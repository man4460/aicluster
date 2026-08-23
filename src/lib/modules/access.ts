import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";
import {
  isDailyTokenExemptModuleSlug,
  isModuleHiddenFromDashboardUi,
  MAX_MODULE_GROUP,
  UI_VISIBLE_GROUP2_MODULE_SLUGS,
} from "@/lib/modules/config";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";

export type UserAccessFields = {
  role: UserRole;
  subscriptionType: SubscriptionType;
  subscriptionTier: SubscriptionTier;
  tokens: number;
  /** slug ที่สมัครแพ็ก 199 รายโมดูล */
  monthly199Slugs?: string[];
};

export function hasMonthly199ForModule(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs">,
  moduleSlug?: string | null,
): boolean {
  if (user.role === "ADMIN") return true;
  const slugs = user.monthly199Slugs ?? [];
  if (moduleSlug) return slugs.includes(moduleSlug);
  return slugs.length > 0;
}

function isEarlyAccessGroup2Module(slug: string): boolean {
  return UI_VISIBLE_GROUP2_MODULE_SLUGS.has(slug);
}

/** สูงสุดถึงกลุ่มไหนที่ user เข้าได้ (0 = ไม่มีโมดูล) */
export function userMaxModuleGroup(user: UserAccessFields): number {
  if (user.role === "ADMIN") return MAX_MODULE_GROUP;
  if (isTokenDebtLocked(user.tokens)) return 0;
  return 1;
}

export function canAccessModuleGroup(user: UserAccessFields, groupId: number): boolean {
  if (!Number.isInteger(groupId) || groupId < 1 || groupId > MAX_MODULE_GROUP) return false;
  if (groupId <= userMaxModuleGroup(user)) return true;
  /** กลุ่ม 2 — เปิดเฉพาะโมดูลใน whitelist (เช่น smart-police) */
  if (groupId === 2 && UI_VISIBLE_GROUP2_MODULE_SLUGS.size > 0) {
    if (user.role === "ADMIN") return true;
    if (isTokenDebtLocked(user.tokens)) return false;
    return true;
  }
  return false;
}

/**
 * สิทธิ์เข้าโมดูลรายตัว — สายรายวันหัก 1/โมดูล/วัน (ติดลบได้จนกว่าจะล็อคหนี้)
 * แพ็ก 199 ของโมดูลนั้นไม่หักรายวัน และได้สิทธิ์ตามที่แอดมินตั้ง
 */
export function canAccessAppModule(
  user: UserAccessFields,
  mod: { slug: string; groupId: number },
  options?: { chargedTodaySlugs?: ReadonlySet<string> | null },
): boolean {
  if (!Number.isInteger(mod.groupId) || mod.groupId < 1 || mod.groupId > MAX_MODULE_GROUP) {
    return false;
  }
  if (user.role === "ADMIN") return true;
  if (isTokenDebtLocked(user.tokens)) return false;
  if (isModuleHiddenFromDashboardUi(mod.slug)) return false;
  if (mod.slug && isEarlyAccessGroup2Module(mod.slug)) {
    if (isDailyTokenExemptModuleSlug(mod.slug)) return true;
    if (hasMonthly199ForModule(user, mod.slug)) return true;
    if (options?.chargedTodaySlugs?.has(mod.slug)) return true;
    return true;
  }
  if (mod.groupId !== 1) return false;
  if (isDailyTokenExemptModuleSlug(mod.slug)) return true;
  return true;
}

/**
 * ปุ่ม “ทดลองใช้งาน” — ใช้เกณฑ์เดียวกับการเข้าโมดูลจริง
 * (สายรายวัน + มีโทเคน = กลุ่ม 1 เท่านั้น — ไม่เปิดทดลองกลุ่ม 2+ แล้ว redirect)
 */
export function canStartTrialForModule(
  user: UserAccessFields,
  mod: { slug: string; groupId: number },
): boolean {
  if (user.role === "ADMIN") return true;
  return canAccessAppModule(user, mod);
}

/** true = มีแพ็ก 199 ของโมดูล (ไม่หักรายวันโมดูลนั้น) — เลิกใช้แพ็กเหมาทั้งบัญชี */
export function isBuffetSubscriber(user: Pick<UserAccessFields, "role" | "monthly199Slugs">): boolean {
  if (user.role === "ADMIN") return true;
  return (user.monthly199Slugs?.length ?? 0) > 0;
}
