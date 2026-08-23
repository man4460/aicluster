import type { UserAccessFields } from "@/lib/modules/access";
import { hasMonthly199ForModule } from "@/lib/modules/access";
import {
  PLAN_DAILY_MAX_DATA_ROWS,
  PLAN_MONTHLY_DATA_ROWS_THRESHOLD,
} from "@/lib/modules/config";
import {
  DEFAULT_PLAN_FEATURE_POLICY,
  getPlanFeaturePolicy,
  type PlanFeaturePolicyDto,
} from "@/lib/modules/plan-feature-policy";
import { prisma } from "@/lib/prisma";
import { listMonthly199ModuleSlugs } from "@/lib/tokens/module-monthly-199";
import { canUseMultiKitchenFeature } from "@/systems/building-pos/lib/kitchen-department";

/**
 * สิทธิ์แพ็กเกจต่อโมดูล — อิงนโยบายที่แอดมินตั้งได้
 * สายรายวันถูกจำกัดตามเงื่อนไข · แพ็ก 199 ของโมดูลนั้นปลดตามที่แอดมินเปิด
 */

export type PlanFeatureEntitlements = {
  slipPrint: boolean;
  slipUpload: boolean;
  documentUpload: boolean;
  /** หลายแผนกครัว — แพ็ก 199 ของ POS ร้านอาหาร เมื่อเปิดเงื่อนไข */
  multiKitchen: boolean;
  dataRowLimit: number | null;
  dataRowsLabel: string;
  planLabel: string;
};

export type PlanFeaturesApiPayload = {
  slipPrint: boolean;
  slipUpload: boolean;
  documentUpload: boolean;
  multiKitchen: boolean;
  dataRowLimit: number | null;
};

function isMonthly199Active(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs">,
  moduleSlug?: string | null,
): boolean {
  return hasMonthly199ForModule(user, moduleSlug);
}

export function resolvePlanFeatureEntitlements(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): PlanFeatureEntitlements {
  const monthly = isMonthly199Active(user, moduleSlug);
  const dailyMax = policy.dailyMaxDataRows || PLAN_DAILY_MAX_DATA_ROWS;
  const monthlyThreshold = policy.monthlyDataRowsThreshold || PLAN_MONTHLY_DATA_ROWS_THRESHOLD;

  const slipPrint = !policy.slipPrintGateEnabled || monthly;
  const slipUpload = !policy.slipUploadGateEnabled || monthly;
  const documentUpload = !policy.documentUploadGateEnabled || monthly;
  const multiKitchen = canUseMultiKitchenFeature(user, policy, moduleSlug ?? undefined);

  let dataRowLimit: number | null = null;
  if (policy.dataRowLimitEnabled && !monthly) {
    dataRowLimit = dailyMax;
  }

  return {
    slipPrint,
    slipUpload,
    documentUpload,
    multiKitchen,
    dataRowLimit,
    dataRowsLabel:
      dataRowLimit == null
        ? `ข้อมูลได้มากกว่า ${monthlyThreshold.toLocaleString("th-TH")} แถว`
        : `ข้อมูลสูงสุด ${dataRowLimit.toLocaleString("th-TH")} แถว`,
    planLabel: monthly ? "แพ็ก 199 ต่อโมดูล" : "สายรายวัน",
  };
}

export function canUseSlipPrintFeature(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): boolean {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug).slipPrint;
}

export function canUseSlipUploadFeature(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): boolean {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug).slipUpload;
}

export function canUseDocumentUploadFeature(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): boolean {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug).documentUpload;
}

export function getPlanDataRowLimit(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): number | null {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug).dataRowLimit;
}

export function getPlanFeatureEntitlements(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): PlanFeatureEntitlements {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug);
}

export function assertPlanDataRowAllowance(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  currentRowCount: number,
  rowsToAdd = 1,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): { ok: true } | { ok: false; error: string; code: "DATA_ROW_LIMIT" } {
  const entitlements = resolvePlanFeatureEntitlements(user, policy, moduleSlug);
  const limit = entitlements.dataRowLimit;
  if (limit == null) return { ok: true };
  if (currentRowCount + rowsToAdd <= limit) return { ok: true };
  const threshold = policy.monthlyDataRowsThreshold || PLAN_MONTHLY_DATA_ROWS_THRESHOLD;
  return {
    ok: false,
    code: "DATA_ROW_LIMIT",
    error: `ข้อมูลถึงขีดจำกัดสายรายวันแล้ว (${limit.toLocaleString("th-TH")} แถว) — สมัครแพ็ก 199 ของโมดูลนี้เพื่อใช้ได้มากกว่า ${threshold.toLocaleString("th-TH")} แถว`,
  };
}

export type PlanUploadKind = "slip" | "document";

export function assertPlanUploadAllowance(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  kind: PlanUploadKind,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): { ok: true } | { ok: false; error: string; code: "UPLOAD_PLAN_GATE" } {
  const e = resolvePlanFeatureEntitlements(user, policy, moduleSlug);
  const allowed = kind === "slip" ? e.slipUpload : e.documentUpload;
  if (allowed) return { ok: true };
  const label = kind === "slip" ? "อัปโหลดสลิป" : "อัปโหลดเอกสาร";
  return {
    ok: false,
    code: "UPLOAD_PLAN_GATE",
    error: `${label}เปิดเฉพาะแพ็ก 199 ของโมดูลนี้ — สมัครที่หน้า ระบบทั้งหมด หรือติดต่อแอดมินให้ปิดเงื่อนไขนี้`,
  };
}

export function canUseMultiKitchenPlanFeature(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): boolean {
  return resolvePlanFeatureEntitlements(user, policy, moduleSlug).multiKitchen;
}

export function assertPlanMultiKitchenAllowance(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): { ok: true } | { ok: false; error: string; code: "MULTI_KITCHEN_PLAN_GATE" } {
  if (canUseMultiKitchenPlanFeature(user, policy, moduleSlug)) return { ok: true };
  return {
    ok: false,
    code: "MULTI_KITCHEN_PLAN_GATE",
    error:
      "หลายแผนกครัวเปิดเฉพาะแพ็ก 199 ของ POS ร้านอาหาร — สมัครที่หน้า ระบบทั้งหมด หรือติดต่อแอดมินให้ปิดเงื่อนไขนี้",
  };
}

export function planFeaturesApiPayload(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  policy: PlanFeaturePolicyDto = DEFAULT_PLAN_FEATURE_POLICY,
  moduleSlug?: string | null,
): PlanFeaturesApiPayload {
  const e = resolvePlanFeatureEntitlements(user, policy, moduleSlug);
  return {
    slipPrint: e.slipPrint,
    slipUpload: e.slipUpload,
    documentUpload: e.documentUpload,
    multiKitchen: e.multiKitchen,
    dataRowLimit: e.dataRowLimit,
  };
}

/** โหลดนโยบายแล้วคำนวณสิทธิ์ (ใช้ใน Server / API) */
export async function loadPlanFeaturesForUser(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier"> | null | undefined,
  moduleSlug?: string | null,
): Promise<PlanFeaturesApiPayload> {
  const policy = await getPlanFeaturePolicy();
  if (!user) {
    return {
      slipPrint: !policy.slipPrintGateEnabled,
      slipUpload: !policy.slipUploadGateEnabled,
      documentUpload: !policy.documentUploadGateEnabled,
      multiKitchen: !policy.multiKitchenGateEnabled,
      dataRowLimit: policy.dataRowLimitEnabled ? policy.dailyMaxDataRows : null,
    };
  }
  return planFeaturesApiPayload(user, policy, moduleSlug);
}

export async function loadPlanFeaturePolicyAndAssertRows(
  user: Pick<UserAccessFields, "role" | "monthly199Slugs" | "subscriptionType" | "subscriptionTier">,
  currentRowCount: number,
  rowsToAdd = 1,
  moduleSlug?: string | null,
): Promise<{ ok: true; policy: PlanFeaturePolicyDto } | { ok: false; error: string; code: "DATA_ROW_LIMIT" }> {
  const policy = await getPlanFeaturePolicy();
  const allowance = assertPlanDataRowAllowance(user, currentRowCount, rowsToAdd, policy, moduleSlug);
  if (!allowance.ok) return allowance;
  return { ok: true, policy };
}

/**
 * ตรวจสิทธิ์อัปโหลดของเจ้าของร้าน/บิลลิง — ใช้ใน API อัปโหลดสลิป/เอกสาร
 */
export async function assertOwnerPlanUpload(
  ownerUserId: string,
  kind: PlanUploadKind,
  moduleSlug?: string | null,
): Promise<{ ok: true } | { ok: false; error: string; code: "UPLOAD_PLAN_GATE" }> {
  const [owner, policy, monthly199Slugs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    }),
    getPlanFeaturePolicy(),
    listMonthly199ModuleSlugs(ownerUserId),
  ]);
  if (!owner) {
    return { ok: false, error: "ไม่พบบัญชีเจ้าของ", code: "UPLOAD_PLAN_GATE" };
  }
  return assertPlanUploadAllowance({ ...owner, monthly199Slugs }, kind, policy, moduleSlug);
}
