/** ค่าใช้จ่ายเพิ่มตอนเช็คเอาต์ (ผ้าขนหนู · มินิบาร์ ฯลฯ) */

export type HotelResortExtraCharge = {
  id: string;
  label: string;
  amountBaht: number;
};

export type HotelResortCheckoutExtraPreset = {
  label: string;
  amountBaht: number;
};

export const HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS: HotelResortCheckoutExtraPreset[] = [
  { label: "ผ้าขนหนู", amountBaht: 100 },
  { label: "มินิบาร์", amountBaht: 200 },
  { label: "ค่าทำความสะอาดเพิ่ม", amountBaht: 300 },
  { label: "ค่าเสียหาย", amountBaht: 500 },
];

const EXTRAS_MARKER = "[HR_EXTRAS]";

export function hotelResortNormalizeCheckoutExtraPresets(
  raw: unknown,
): HotelResortCheckoutExtraPreset[] {
  if (!Array.isArray(raw)) return [...HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS];
  const cleaned = raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as { label?: unknown; amountBaht?: unknown };
      const label = String(r.label ?? "").trim();
      const amountBaht = Math.max(0, Math.round(Number(r.amountBaht) || 0));
      if (!label || amountBaht <= 0) return null;
      return { label: label.slice(0, 80), amountBaht };
    })
    .filter((x): x is HotelResortCheckoutExtraPreset => Boolean(x));
  return cleaned.length > 0 ? cleaned.slice(0, 20) : [...HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS];
}

export function hotelResortSumExtras(extras: HotelResortExtraCharge[]): number {
  return extras.reduce((sum, e) => sum + Math.max(0, Math.round(e.amountBaht) || 0), 0);
}

export function hotelResortParseExtrasFromNote(note: string | null | undefined): HotelResortExtraCharge[] {
  const raw = (note ?? "").trim();
  const idx = raw.lastIndexOf(EXTRAS_MARKER);
  if (idx < 0) return [];
  try {
    const json = raw.slice(idx + EXTRAS_MARKER.length).trim();
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row, i) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { id?: string; label?: string; amountBaht?: number };
        const label = String(r.label ?? "").trim();
        const amountBaht = Math.max(0, Math.round(Number(r.amountBaht) || 0));
        if (!label || amountBaht <= 0) return null;
        return { id: String(r.id ?? `ex-${i}`), label, amountBaht };
      })
      .filter((x): x is HotelResortExtraCharge => Boolean(x));
  } catch {
    return [];
  }
}

export function hotelResortMergeNoteWithExtras(
  note: string | null | undefined,
  extras: HotelResortExtraCharge[],
): string | null {
  const raw = (note ?? "").trim();
  const idx = raw.lastIndexOf(EXTRAS_MARKER);
  const base = (idx >= 0 ? raw.slice(0, idx) : raw).trim();
  const cleaned = extras
    .map((e) => ({
      id: e.id,
      label: e.label.trim(),
      amountBaht: Math.max(0, Math.round(e.amountBaht) || 0),
    }))
    .filter((e) => e.label && e.amountBaht > 0);
  if (cleaned.length === 0) return base || null;
  const block = `${EXTRAS_MARKER}${JSON.stringify(cleaned)}`;
  return base ? `${base}\n${block}` : block;
}

export function hotelResortNewExtraId(): string {
  return `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
