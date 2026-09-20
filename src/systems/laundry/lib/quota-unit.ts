/** หน่วยโควต้าแพ็กสมาชิกซักผ้า */
export type LaundryQuotaUnit = "SESSION" | "PIECE";

export function normalizeLaundryQuotaUnit(raw: unknown): LaundryQuotaUnit {
  const s = String(raw ?? "").trim().toUpperCase();
  return s === "PIECE" ? "PIECE" : "SESSION";
}

export function laundryQuotaUnitLabel(unit: LaundryQuotaUnit | string | null | undefined): string {
  return normalizeLaundryQuotaUnit(unit) === "PIECE" ? "ชิ้น" : "ครั้ง";
}

export function laundryQuotaRemainingLabel(
  remaining: number,
  total: number | null | undefined,
  unit: LaundryQuotaUnit | string | null | undefined,
): string {
  const u = laundryQuotaUnitLabel(unit);
  const rem = Math.max(0, Math.trunc(remaining));
  if (total != null && total > 0) {
    return `เหลือ ${rem.toLocaleString("th-TH")} / ${Math.trunc(total).toLocaleString("th-TH")} ${u}`;
  }
  return `เหลือ ${rem.toLocaleString("th-TH")} ${u}`;
}
