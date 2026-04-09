import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";
import {
  MAX_MODULE_GROUP,
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
  return groupId <= userMaxModuleGroup(user);
}

/**
 * สิทธิ์เข้าโมดูลรายตัว — สายรายวัน + มีโทเคน: เข้าโมดูลกลุ่ม 1 ได้ทุกตัว (รวมหอพัก)
 */
export function canAccessAppModule(
  user: UserAccessFields,
  mod: { slug: string; groupId: number },
): boolean {
  if (!Number.isInteger(mod.groupId) || mod.groupId < 1 || mod.groupId > MAX_MODULE_GROUP) {
    return false;
  }
  if (user.role === "ADMIN") return true;
  if (user.subscriptionType === "BUFFET") {
    return mod.groupId <= effectiveBuffetMaxGroup(user.subscriptionTier);
  }
  if (user.tokens <= 0) return false;
  return mod.groupId === 1;
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
