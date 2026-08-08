/** ค่าเริ่มต้นแคตตาล็อก — seed เมื่อเจ้าของยังไม่มีรายการ */

export const HOTEL_RESORT_DEFAULT_BED_TYPES = [
  "เตียงเดี่ยว",
  "เตียงคู่ (ควีน)",
  "เตียงคิงไซส์",
  "ทวิน (2 เตียงเดี่ยว)",
  "3 เตียง",
  "โซฟาเบด",
] as const;

export const HOTEL_RESORT_DEFAULT_AMENITIES: ReadonlyArray<{ key: string; label: string }> = [
  { key: "WIFI", label: "Wi‑Fi" },
  { key: "TV", label: "ทีวี" },
  { key: "AIRCON", label: "แอร์" },
  { key: "HOT_WATER", label: "น้ำอุ่น" },
  { key: "FRIDGE", label: "ตู้เย็น" },
  { key: "MINIBAR", label: "มินิบาร์" },
  { key: "SAFE", label: "ตู้เซฟ" },
  { key: "BATHTUB", label: "อ่างอาบน้ำ" },
  { key: "SHOWER", label: "ฝักบัว" },
  { key: "BALCONY", label: "ระเบียง" },
  { key: "DESK", label: "โต๊ะทำงาน" },
  { key: "WARDROBE", label: "ตู้เสื้อผ้า" },
  { key: "HAIRDRYER", label: "ไดร์เป่าผม" },
  { key: "KETTLE", label: "กาต้มน้ำ" },
  { key: "TOWELS", label: "ผ้าเช็ดตัว" },
  { key: "SLIPPERS", label: "รองเท้าสลิปเปอร์" },
];

/** แปลงชื่อเป็นคีย์ ASCII สั้น ๆ สำหรับ amenities_json */
export function hotelResortAmenityKeyFromLabel(label: string): string {
  const ascii = label
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .slice(0, 28);
  if (ascii.length >= 2) return ascii;
  return `A_${Date.now().toString(36).toUpperCase()}`;
}

export function parseHotelResortAmenities(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim()),
      ),
    ];
  } catch {
    return [];
  }
}

export function serializeHotelResortAmenities(keys: readonly string[]): string | null {
  const unique = [
    ...new Set(keys.map((k) => k.trim()).filter((k) => k.length > 0)),
  ];
  if (unique.length === 0) return null;
  return JSON.stringify(unique);
}

export function hotelResortAmenityLabel(
  key: string,
  options?: ReadonlyArray<{ key: string; label: string }> | null,
): string {
  const found = options?.find((o) => o.key === key);
  return found?.label ?? key;
}
