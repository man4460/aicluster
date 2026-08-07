import { prisma } from "@/lib/prisma";
import {
  PLAN_DAILY_MAX_DATA_ROWS,
  PLAN_MONTHLY_DATA_ROWS_THRESHOLD,
} from "@/lib/modules/config";

export const PLAN_FEATURE_POLICY_ID = "default" as const;

export type PlanFeaturePolicyDto = {
  dataRowLimitEnabled: boolean;
  dailyMaxDataRows: number;
  monthlyDataRowsThreshold: number;
  slipPrintGateEnabled: boolean;
  /** เปิด = อัปโหลดสลิปชำระเฉพาะแพ็กเหมา */
  slipUploadGateEnabled: boolean;
  /** เปิด = อัปโหลดเอกสารเฉพาะแพ็กเหมา */
  documentUploadGateEnabled: boolean;
  /** เปิด = หลายแผนกครัว (POS ร้านอาหาร) เฉพาะแพ็ก 299+ */
  multiKitchenGateEnabled: boolean;
  updatedAt: string;
  updatedByUserId: string | null;
};

export const DEFAULT_PLAN_FEATURE_POLICY: PlanFeaturePolicyDto = {
  dataRowLimitEnabled: true,
  dailyMaxDataRows: PLAN_DAILY_MAX_DATA_ROWS,
  monthlyDataRowsThreshold: PLAN_MONTHLY_DATA_ROWS_THRESHOLD,
  slipPrintGateEnabled: true,
  slipUploadGateEnabled: true,
  documentUploadGateEnabled: true,
  multiKitchenGateEnabled: true,
  updatedAt: new Date(0).toISOString(),
  updatedByUserId: null,
};

function clampRows(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > 10_000_000) return 10_000_000;
  return i;
}

function mapRow(row: {
  dataRowLimitEnabled: boolean;
  dailyMaxDataRows: number;
  monthlyDataRowsThreshold: number;
  slipPrintGateEnabled: boolean;
  slipUploadGateEnabled: boolean;
  documentUploadGateEnabled: boolean;
  multiKitchenGateEnabled: boolean;
  updatedAt: Date;
  updatedByUserId: string | null;
}): PlanFeaturePolicyDto {
  return {
    dataRowLimitEnabled: row.dataRowLimitEnabled,
    dailyMaxDataRows: clampRows(row.dailyMaxDataRows, PLAN_DAILY_MAX_DATA_ROWS),
    monthlyDataRowsThreshold: clampRows(row.monthlyDataRowsThreshold, PLAN_MONTHLY_DATA_ROWS_THRESHOLD),
    slipPrintGateEnabled: row.slipPrintGateEnabled,
    slipUploadGateEnabled: row.slipUploadGateEnabled,
    documentUploadGateEnabled: row.documentUploadGateEnabled,
    multiKitchenGateEnabled:
      typeof (row as { multiKitchenGateEnabled?: boolean }).multiKitchenGateEnabled === "boolean"
        ? (row as { multiKitchenGateEnabled: boolean }).multiKitchenGateEnabled
        : true,
    updatedAt: row.updatedAt.toISOString(),
    updatedByUserId: row.updatedByUserId,
  };
}

/** โหลดนโยบายจาก DB — สร้างค่าเริ่มต้นถ้ายังไม่มีแถว */
export async function getPlanFeaturePolicy(): Promise<PlanFeaturePolicyDto> {
  try {
    const existing = await prisma.planFeaturePolicy.findUnique({
      where: { id: PLAN_FEATURE_POLICY_ID },
    });
    if (existing) return mapRow(existing);

    const created = await prisma.planFeaturePolicy.create({
      data: {
        id: PLAN_FEATURE_POLICY_ID,
        dataRowLimitEnabled: true,
        dailyMaxDataRows: PLAN_DAILY_MAX_DATA_ROWS,
        monthlyDataRowsThreshold: PLAN_MONTHLY_DATA_ROWS_THRESHOLD,
        slipPrintGateEnabled: true,
        slipUploadGateEnabled: true,
        documentUploadGateEnabled: true,
        multiKitchenGateEnabled: true,
      },
    });
    return mapRow(created);
  } catch (e) {
    console.error("[plan-feature-policy] get", e);
    return { ...DEFAULT_PLAN_FEATURE_POLICY, updatedAt: new Date().toISOString() };
  }
}

export type PlanFeaturePolicyUpdateInput = {
  dataRowLimitEnabled?: boolean;
  dailyMaxDataRows?: number;
  monthlyDataRowsThreshold?: number;
  slipPrintGateEnabled?: boolean;
  slipUploadGateEnabled?: boolean;
  documentUploadGateEnabled?: boolean;
  multiKitchenGateEnabled?: boolean;
};

export async function updatePlanFeaturePolicy(
  input: PlanFeaturePolicyUpdateInput,
  updatedByUserId: string | null,
): Promise<PlanFeaturePolicyDto> {
  const current = await getPlanFeaturePolicy();
  const data = {
    dataRowLimitEnabled:
      typeof input.dataRowLimitEnabled === "boolean" ? input.dataRowLimitEnabled : current.dataRowLimitEnabled,
    dailyMaxDataRows:
      input.dailyMaxDataRows !== undefined
        ? clampRows(input.dailyMaxDataRows, current.dailyMaxDataRows)
        : current.dailyMaxDataRows,
    monthlyDataRowsThreshold:
      input.monthlyDataRowsThreshold !== undefined
        ? clampRows(input.monthlyDataRowsThreshold, current.monthlyDataRowsThreshold)
        : current.monthlyDataRowsThreshold,
    slipPrintGateEnabled:
      typeof input.slipPrintGateEnabled === "boolean" ? input.slipPrintGateEnabled : current.slipPrintGateEnabled,
    slipUploadGateEnabled:
      typeof input.slipUploadGateEnabled === "boolean" ? input.slipUploadGateEnabled : current.slipUploadGateEnabled,
    documentUploadGateEnabled:
      typeof input.documentUploadGateEnabled === "boolean"
        ? input.documentUploadGateEnabled
        : current.documentUploadGateEnabled,
    multiKitchenGateEnabled:
      typeof input.multiKitchenGateEnabled === "boolean"
        ? input.multiKitchenGateEnabled
        : current.multiKitchenGateEnabled,
    updatedByUserId: updatedByUserId?.trim() || null,
  };

  const row = await prisma.planFeaturePolicy.upsert({
    where: { id: PLAN_FEATURE_POLICY_ID },
    create: { id: PLAN_FEATURE_POLICY_ID, ...data },
    update: data,
  });
  return mapRow(row);
}
