import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  ensureSmartPoliceBuiltinCharges,
  getOrCreateSmartPoliceProfile,
} from "@/lib/smart-police/api-owner";
import { ensureSmartPoliceCasePresets } from "@/lib/smart-police/case-presets/ensure-builtin";
import type { SmartPoliceCasePresetDto } from "@/lib/smart-police/types";

type PresetRow = {
  id: string;
  ownerUserId: string | null;
  key: string;
  caseType: string;
  title: string;
  chargeId: string | null;
  defaultChargeText: string;
  defaultLawRefs: string | null;
  defaultCourtType: string | null;
  defaultCustodyMode: string | null;
  starterFieldsJson: string;
  formSlugs: string;
  isBuiltin: boolean;
  isActive: boolean;
  sortOrder: number;
};

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function mapCasePreset(row: PresetRow, ownerUserId: string): SmartPoliceCasePresetDto {
  return {
    id: row.id,
    key: row.key,
    caseType: row.caseType,
    title: row.title,
    chargeId: row.chargeId,
    defaultChargeText: row.defaultChargeText,
    defaultLawRefs: row.defaultLawRefs,
    defaultCourtType: row.defaultCourtType,
    defaultCustodyMode: row.defaultCustodyMode,
    starterFields: parseJson<Record<string, string>>(row.starterFieldsJson, {}),
    formSlugs: parseJson<string[]>(row.formSlugs, []),
    isBuiltin: row.isBuiltin,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    isOwnerCustom: row.ownerUserId === ownerUserId,
  };
}

/**
 * GET /api/smart-police/case-presets
 * query: ?caseType=คดีจราจร · ?key=traffic · ?active=0 (รวมที่ปิดใช้)
 */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  await ensureSmartPoliceBuiltinCharges(gate.ctx.ownerUserId);
  await ensureSmartPoliceCasePresets(gate.ctx.ownerUserId);

  const url = new URL(req.url);
  const caseType = (url.searchParams.get("caseType") ?? "").trim();
  const key = (url.searchParams.get("key") ?? "").trim();
  const activeOnly = url.searchParams.get("active") !== "0";

  const rows = await prisma.smartPoliceCasePreset.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(caseType ? { caseType } : {}),
      ...(key ? { key } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const presets = rows.map((r) => mapCasePreset(r, gate.ctx.ownerUserId));
  const caseTypes = Array.from(new Set(presets.map((p) => p.caseType)));

  return NextResponse.json({ presets, caseTypes, total: presets.length });
}
