import type { Prisma } from "@/generated/prisma/client";

export type VillageResidentDraft = {
  id?: number;
  name: string;
  phone?: string | null;
  note?: string | null;
  is_primary?: boolean;
};

/** อัปเดตตาม id · สร้างรายการใหม่ · soft-delete รายการที่ไม่อยู่ใน payload */
export async function syncVillageHouseResidents(
  tx: Prisma.TransactionClient,
  houseId: number,
  residents: VillageResidentDraft[],
): Promise<void> {
  const keepIds: number[] = [];

  for (const r of residents) {
    const name = r.name.trim();
    if (!name) continue;

    const phone = r.phone?.trim() || null;
    const note = r.note?.trim() || null;
    const isPrimary = r.is_primary ?? false;

    if (r.id != null && Number.isInteger(r.id) && r.id > 0) {
      const existing = await tx.villageResident.findFirst({
        where: { id: r.id, houseId },
        select: { id: true },
      });
      if (existing) {
        await tx.villageResident.update({
          where: { id: r.id },
          data: { name, phone, note, isPrimary, isActive: true },
        });
        keepIds.push(r.id);
        continue;
      }
    }

    const created = await tx.villageResident.create({
      data: { houseId, name, phone, note, isPrimary, isActive: true },
    });
    keepIds.push(created.id);
  }

  await tx.villageResident.updateMany({
    where: {
      houseId,
      isActive: true,
      ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
    },
    data: { isActive: false },
  });
}

export function mapVillageHouseWithResidents(h: {
  id: number;
  houseNo: string;
  plotLabel: string | null;
  ownerName: string | null;
  phone: string | null;
  monthlyFeeOverride: number | null;
  feeCycle: string;
  billingStartYm: string | null;
  isActive: boolean;
  sortOrder: number;
  residents: {
    id: number;
    name: string;
    phone: string | null;
    note: string | null;
    isPrimary: boolean;
    isActive: boolean;
  }[];
}) {
  return {
    id: h.id,
    house_no: h.houseNo,
    plot_label: h.plotLabel,
    owner_name: h.ownerName,
    phone: h.phone,
    monthly_fee_override: h.monthlyFeeOverride,
    fee_cycle: h.feeCycle,
    billing_start_ym: h.billingStartYm,
    is_active: h.isActive,
    sort_order: h.sortOrder,
    residents: h.residents.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      note: r.note,
      is_primary: r.isPrimary,
      is_active: r.isActive,
    })),
  };
}
