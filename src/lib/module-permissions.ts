/**
 * สิทธิ์แพ็กเกจ / กลุ่มโมดูล — จุดเข้าใช้เดียว (re-export)
 * แก้ mapping กลุ่ม vs ราคา ที่ `lib/modules/config.ts` และ `lib/modules/access.ts`
 */
export {
  BUFFET_TIERS_OPEN_FOR_PURCHASE,
  DAILY_ALLOWED_MODULE_SLUG,
  DAILY_LINE_PLAN_SUMMARY,
  MAX_MODULE_GROUP,
  MODULE_GROUP_FEATURE_SUMMARY,
  MODULE_GROUP_TIER_NAME,
  MONTHLY_199_PLAN_FEATURE_LINES,
  MONTHLY_299_PLAN_FEATURE_LINES,
  PLAN_DAILY_MAX_DATA_ROWS,
  PLAN_MONTHLY_DATA_ROWS_THRESHOLD,
  PLAN_PRICES,
  PRICE_TO_TIER,
  TIER_SUBSCRIPTION_TOKEN_COST,
  UI_VISIBLE_MAX_MODULE_GROUP,
  buffetTierMaxGroup,
  computeBuffetSubscriptionTokenCharge,
  filterAppModulesForDashboardUi,
  isBuffetTierOpenForPurchase,
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

export {
  assertOwnerPlanUpload,
  assertPlanDataRowAllowance,
  assertPlanUploadAllowance,
  canUseDocumentUploadFeature,
  canUseSlipPrintFeature,
  canUseSlipUploadFeature,
  getPlanDataRowLimit,
  getPlanFeatureEntitlements,
  loadPlanFeaturePolicyAndAssertRows,
  loadPlanFeaturesForUser,
  planFeaturesApiPayload,
  resolvePlanFeatureEntitlements,
  type PlanFeatureEntitlements,
  type PlanFeaturesApiPayload,
  type PlanUploadKind,
} from "@/lib/modules/plan-entitlements";

export {
  DEFAULT_PLAN_FEATURE_POLICY,
  getPlanFeaturePolicy,
  updatePlanFeaturePolicy,
  type PlanFeaturePolicyDto,
  type PlanFeaturePolicyUpdateInput,
} from "@/lib/modules/plan-feature-policy";
