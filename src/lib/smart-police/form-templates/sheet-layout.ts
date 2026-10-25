/**
 * ตำแหน่งที่ผู้ใช้จัดเอง (drag) ของฟอร์ม Smart Police — เก็บใน localStorage ต่อ slug
 * dx/dy เป็นมิลลิเมตร (บวก = ขวา/ลง) ทับค่าตั้งต้นในโค้ด
 * texts = ข้อความที่ผู้ใช้แก้ทับ, lines = เส้นจุดไข่ปลาที่ผู้ใช้เพิ่มเอง
 */
export type SheetElementOffset = { dx: number; dy: number; dw?: number };
export type SheetExtraLine = { id: string; page: number; x: number; y: number; w: number };
export type SheetLayout = {
  offsets: Record<string, SheetElementOffset>;
  texts: Record<string, string>;
  lines: SheetExtraLine[];
  hidden: string[];
};

export function emptySheetLayout(): SheetLayout {
  return { offsets: {}, texts: {}, lines: [], hidden: [] };
}

const PREFIX = "smart-police:layout:";

export function loadSheetLayout(slug: string): SheetLayout {
  if (typeof window === "undefined") return emptySheetLayout();
  try {
    const raw = window.localStorage.getItem(PREFIX + slug);
    if (!raw) return emptySheetLayout();
    const parsed = JSON.parse(raw) as Partial<SheetLayout>;
    return {
      offsets: parsed.offsets ?? {},
      texts: parsed.texts ?? {},
      lines: parsed.lines ?? [],
      hidden: parsed.hidden ?? [],
    };
  } catch {
    return emptySheetLayout();
  }
}

export function saveSheetLayout(slug: string, layout: SheetLayout): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + slug, JSON.stringify(layout));
}

export function clearSheetLayout(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREFIX + slug);
}

function normalize(parsed: Partial<SheetLayout> | null | undefined): SheetLayout {
  return {
    offsets: parsed?.offsets ?? {},
    texts: parsed?.texts ?? {},
    lines: parsed?.lines ?? [],
    hidden: parsed?.hidden ?? [],
  };
}

function isEmpty(layout: SheetLayout): boolean {
  return (
    Object.keys(layout.offsets).length === 0 &&
    Object.keys(layout.texts).length === 0 &&
    layout.lines.length === 0 &&
    layout.hidden.length === 0
  );
}

/** อ่านเลย์เอาต์ที่บันทึกไว้บนเซิร์ฟเวอร์ (ถาวร ข้ามเบราว์เซอร์) */
export async function fetchSheetLayoutRemote(slug: string): Promise<SheetLayout | null> {
  try {
    const res = await fetch(`/api/smart-police/sheet-layout?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { layout?: Partial<SheetLayout> };
    const layout = normalize(json.layout);
    return isEmpty(layout) ? null : layout;
  } catch {
    return null;
  }
}

/** บันทึกเลย์เอาต์ขึ้นเซิร์ฟเวอร์ทันทีที่ผู้ใช้ปรับ */
export async function pushSheetLayoutRemote(slug: string, layout: SheetLayout): Promise<void> {
  try {
    await fetch("/api/smart-police/sheet-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, layout }),
    });
  } catch {
    /* เก็บใน localStorage ไว้แล้ว */
  }
}
