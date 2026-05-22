/** ตัดค่า `<input type="time" />` เป็น HH:mm (รองรับ HH:mm:ss บางเบราว์เซอร์) */
export function normalizeTimeHHmm(raw: string): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(raw).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mi) || h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** สร้างช่วงเวลานัดจากเวลาเปิด-ปิดและระยะนาที (HH:mm) */
export function buildMassageSlotTimes(
  openTime: string,
  closeTime: string,
  slotMinutes: number,
): string[] {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const start = parse(openTime);
  const end = parse(closeTime);
  if (start == null || end == null || slotMinutes < 15 || end <= start) return [];
  const slots: string[] = [];
  for (let cur = start; cur + slotMinutes <= end; cur += slotMinutes) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

export const DEFAULT_MASSAGE_DAY = {
  openTime: "10:00",
  closeTime: "21:00",
  slotMinutes: 60,
} as const;
