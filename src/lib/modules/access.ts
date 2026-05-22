import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";
import {
  isDailyTokenExemptModuleSlug,
  isModuleHiddenFromDashboardUi,
  MAX_MODULE_GROUP,
  UI_VISIBLE_GROUP2_MODULE_SLUGS,
  UI_VISIBLE_MAX_MODULE_GROUP,
  buffetTierMaxGroup,
} from "@/lib/modules/config";

export type UserAccessFields = {
  role: UserRole;
  subscriptionType: SubscriptionType;
  subscriptionTier: SubscriptionTier;
  tokens: number;
};

function effectiveBuffetMaxGroup(tier: SubscriptionTier): number {
  return Math.min(buffetTierMaxGroup(tier), UI_VISIBLE_MAX_MODULE_GROUP);
}

/** โมดูลกลุ่ม 2 ที่เปิดให้สมัคร/เข้าใช้ก่อน (แพ็ก 199 + สายรายวันมีโทเคน) */
function isEarlyAccessGroup2Module(slug: string): boolean {
  return UI_VISIBLE_GROUP2_MODULE_SLUGS.has(slug);
}

/** สูงสุดถึงกลุ่มไหนที่ user เข้าได้ (0 = ไม่มีโมดูล) */
export function userMaxModuleGroup(user: UserAccessFields): number {
  if (user.role === "ADMIN") return MAX_MODULE_GROUP;
  if (user.subscriptionType === "BUFFET") {
    return effectiveBuffetMaxGroup(user.subscriptionTier);
  }
  if (user.tokens <= 0) return 0;
  return 1;
}

export function canAccessModuleGroup(user: UserAccessFields, groupId: number): boolean {
  if (!Number.isInteger(groupId) || groupId < 1 || groupId > MAX_MODULE_GROUP) return false;
  if (groupId <= userMaxModuleGroup(user)) return true;
  /** กลุ่ม 2 — เปิดเฉพาะโมดูลใน whitelist (เช่น smart-police) */
  if (groupId === 2 && UI_VISIBLE_GROUP2_MODULE_SLUGS.size > 0) {
    if (user.role === "ADMIN") return true;
    if (user.subscriptionType === "BUFFET") return true;
    return user.tokens > 0;
  }
  return false;
}

/**
 * สิทธิ์เข้าโมดูลรายตัว — สายรายวัน + มีโทเคน: เข้าโมดูลกลุ่ม 1 ได้ทุกตัว (รวมหอพัก)
 *
 * `options.chargedTodaySlugs` — slug ที่หักโทเคนไปแล้วในวัน Bangkok นี้
 * (สายรายวันที่ tokens = 0 แต่หักไปแล้ววันนี้ ยังเข้าใช้ได้จนถึงเที่ยงคืน Bangkok)
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
  if (isModuleHiddenFromDashboardUi(mod.slug)) return false;
  if (mod.slug && isEarlyAccessGroup2Module(mod.slug)) {
    if (user.subscriptionType === "BUFFET") return true;
    if (isDailyTokenExemptModuleSlug(mod.slug)) return true;
    if (user.tokens > 0) return true;
    if (options?.chargedTodaySlugs?.has(mod.slug)) return true;
    return false;
  }
  if (user.subscriptionType === "BUFFET") {
    return mod.groupId <= effectiveBuffetMaxGroup(user.subscriptionTier);
  }
  if (mod.groupId !== 1) return false;
  /** โมดูลฟรี — ไม่หักโทเคน ไม่อาศัยบันทึกรายวัน */
  if (isDailyTokenExemptModuleSlug(mod.slug)) return true;
  if (user.tokens > 0) return true;
  if (options?.chargedTodaySlugs?.has(mod.slug)) return true;
  return false;
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

/** true = แพ็กเหมา (ไม่หักโทเคนรายวัน) */
export function isBuffetSubscriber(user: Pick<UserAccessFields, "role" | "subscriptionType">): boolean {
  if (user.role === "ADMIN") return true;
  return user.subscriptionType === "BUFFET";
}
