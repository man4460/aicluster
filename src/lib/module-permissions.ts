/**
 * สิทธิ์แพ็กเกจ / กลุ่มโมดูล — จุดเข้าใช้เดียว (re-export)
 * แก้ mapping กลุ่ม vs ราคา ที่ `lib/modules/config.ts` และ `lib/modules/access.ts`
 */
export {
  DAILY_ALLOWED_MODULE_SLUG,
  MAX_MODULE_GROUP,
  MODULE_GROUP_FEATURE_SUMMARY,
  MODULE_GROUP_TIER_NAME,
  PLAN_PRICES,
  PRICE_TO_TIER,
  TIER_SUBSCRIPTION_TOKEN_COST,
  buffetTierMaxGroup,
  computeBuffetSubscriptionTokenCharge,
  moduleGroupLine,
  tierGroupBullets,
  tierGroupLabel,
  tierMonthlyBuffetTokenCost,
  type BuffetSubscriptionChargeResult,
  type PlanPrice,
} from "@/lib/modules/config";

export {
  canAccessAppModule,
  canAccessModuleGroup,
  isBuffetSubscriber,
  userMaxModuleGroup,
  type UserAccessFields,
} from "@/lib/modules/access";
