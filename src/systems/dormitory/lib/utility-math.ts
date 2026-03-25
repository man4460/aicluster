/** คำนวณยอดน้ำไฟ+ค่าคงที่จากมิเตอร์ (ไม่รวมค่าเช่า) — ใช้ได้ทั้ง server/client */
export function computeUtilityTotalRoomAmount(input: {
  waterMeterPrev: number;
  waterMeterCurr: number;
  electricMeterPrev: number;
  electricMeterCurr: number;
  waterPrice: number;
  electricPrice: number;
  fixedFeesJson: unknown;
}): number {
  const w = Math.max(0, input.waterMeterCurr - input.waterMeterPrev) * input.waterPrice;
  const e = Math.max(0, input.electricMeterCurr - input.electricMeterPrev) * input.electricPrice;
  let fixed = 0;
  if (input.fixedFeesJson && typeof input.fixedFeesJson === "object" && !Array.isArray(input.fixedFeesJson)) {
    for (const v of Object.values(input.fixedFeesJson as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n)) fixed += n;
    }
  }
  if (Array.isArray(input.fixedFeesJson)) {
    for (const row of input.fixedFeesJson) {
      if (row && typeof row === "object" && "amount" in row) {
        const n = Number((row as { amount: unknown }).amount);
        if (Number.isFinite(n)) fixed += n;
      }
    }
  }
  return Math.round((w + e + fixed) * 100) / 100;
}
