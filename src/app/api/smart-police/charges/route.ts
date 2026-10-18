import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  ensureSmartPoliceBuiltinCharges,
  getOrCreateSmartPoliceProfile,
} from "@/lib/smart-police/api-owner";
import {
  SMART_POLICE_CHARGE_CATEGORIES,
  type SmartPoliceChargeDto,
} from "@/lib/smart-police/types";

function categoryRank(cat: string): number {
  const i = (SMART_POLICE_CHARGE_CATEGORIES as readonly string[]).indexOf(cat);
  return i < 0 ? 999 : i;
}

function mapCharge(
  row: {
    id: string;
    ownerUserId: string | null;
    category: string;
    chargeText: string;
    lawRefs: string | null;
    keywords: string | null;
    isBuiltin: boolean;
    isActive: boolean;
    sortOrder: number;
  },
  ownerUserId: string,
): SmartPoliceChargeDto {
  return {
    id: row.id,
    category: row.category,
    chargeText: row.chargeText,
    lawRefs: row.lawRefs,
    keywords: row.keywords,
    isBuiltin: row.isBuiltin,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    isOwnerCustom: row.ownerUserId === ownerUserId,
  };
}

export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  await ensureSmartPoliceBuiltinCharges(gate.ctx.ownerUserId);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (url.searchParams.get("category") ?? "").trim();
  const activeOnly = url.searchParams.get("active") !== "0";

  const rows = await prisma.smartPoliceCharge.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { chargeText: "asc" }],
  });

  let list = rows.map((r) => mapCharge(r, gate.ctx.ownerUserId));
  if (q) {
    list = list.filter((c) => {
      const hay = `${c.chargeText} ${c.lawRefs ?? ""} ${c.keywords ?? ""} ${c.category}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const categories = Array.from(new Set(list.map((c) => c.category))).sort((a, b) => {
    const d = categoryRank(a) - categoryRank(b);
    return d !== 0 ? d : a.localeCompare(b, "th");
  });
  list = list.slice().sort((a, b) => {
    const d = categoryRank(a.category) - categoryRank(b.category);
    if (d !== 0) return d;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.chargeText.localeCompare(b.chargeText, "th");
  });

  return NextResponse.json({ charges: list, categories, total: list.length });
}

export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const body = (await req.json()) as Record<string, unknown>;
  const chargeText = typeof body.chargeText === "string" ? body.chargeText.trim() : "";
  if (!chargeText) return NextResponse.json({ error: "กรุณาระบุข้อหา" }, { status: 400 });

  const category =
    typeof body.category === "string" && body.category.trim() ? body.category.trim() : "ทั่วไป";
  const lawRefs = typeof body.lawRefs === "string" ? body.lawRefs.trim() || null : null;
  const keywords = typeof body.keywords === "string" ? body.keywords.trim() || null : null;

  const maxSort = await prisma.smartPoliceCharge.aggregate({
    where: { ownerUserId: gate.ctx.ownerUserId },
    _max: { sortOrder: true },
  });

  const row = await prisma.smartPoliceCharge.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      category,
      chargeText,
      lawRefs,
      keywords,
      isBuiltin: false,
      isActive: true,
      sortOrder: (maxSort._max.sortOrder ?? 200) + 1,
    },
  });

  return NextResponse.json({ charge: mapCharge(row, gate.ctx.ownerUserId) }, { status: 201 });
}
