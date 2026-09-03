/** รูปพอร์ทัลลูกค้าร้านซักผ้า — แบนเนอร์ + แกลเลอรี (ตรวจ Unsplash แล้ว) */

export const LAUNDRY_PORTAL_GALLERY_MAX = 20;

/** คอม: 4 คอลัมน์ × 2 แถวต่อหน้า · แท็บเล็ต: 3×2 · มือถือ: 2×2 */
export const LAUNDRY_PORTAL_GALLERY_COLS_DESKTOP = 4;
export const LAUNDRY_PORTAL_GALLERY_ROWS = 2;
export const LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_DESKTOP =
  LAUNDRY_PORTAL_GALLERY_COLS_DESKTOP * LAUNDRY_PORTAL_GALLERY_ROWS;
export const LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_TABLET = 3 * LAUNDRY_PORTAL_GALLERY_ROWS;
export const LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_MOBILE = 2 * LAUNDRY_PORTAL_GALLERY_ROWS;

export function laundryNormalizePortalGallery(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || url.length > 512) continue;
    out.push(url);
    if (out.length >= LAUNDRY_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function laundrySerializePortalGallery(urls: string[]): string {
  return JSON.stringify(laundryNormalizePortalGallery(urls));
}

const Q = "auto=format&fit=crop&q=78";

function g(id: string): string {
  return `https://images.unsplash.com/${id}?${Q}&w=800&h=600`;
}

/**
 * Unsplash ที่ถูกลบ/404 → แทนด้วยรูปที่ยังโหลดได้ (คง query w/h)
 * อัปเดตเมื่อตรวจพบลิงก์แกลเลอรีพังอีก
 */
export const LAUNDRY_BROKEN_UNSPLASH_REPLACEMENTS: Readonly<Record<string, string>> = {
  "photo-1610557892470-55d9a6c4d0b6": "photo-1556909114-f6e7ad7d3136",
  "photo-1517677208171-e9926d4ed53d": "photo-1564069114553-7215e1ff1890",
  "photo-1489274491523-7ca0acf1febd": "photo-1489987707025-afc232f7ea0f",
  "photo-1558618666-fcd25c85f82e": "photo-1558769132-cb1aea458c5e",
  "photo-1523381210302-e9a852d0d3bb": "photo-1509631179647-0177331693ae",
};

export const LAUNDRY_BROKEN_UNSplash_RE = new RegExp(
  Object.keys(LAUNDRY_BROKEN_UNSPLASH_REPLACEMENTS).join("|"),
);

export const LAUNDRY_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1582735689369-4fe89db7114c?${Q}&w=1400&h=560`;

/** รูปแกลเลอรีตัวอย่าง 20 รูป — ซักผ้า / เครื่องซัก / พับผ้า (ตรวจ HEAD 200 แล้ว) */
export const LAUNDRY_PORTAL_SAMPLE_GALLERY = [
  g("photo-1582735689369-4fe89db7114c"),
  g("photo-1556909114-f6e7ad7d3136"),
  g("photo-1626806787461-102c1bfaaea1"),
  g("photo-1626806819282-2c1dc01a5e0c"),
  g("photo-1604335398980-ededcadcc37d"),
  g("photo-1604335399105-a0c585fd81a1"),
  g("photo-1610305401607-8745a10c75dd"),
  g("photo-1696546761269-a8f9d2b80512"),
  g("photo-1649105057951-e3006c21a664"),
  g("photo-1545173168-9f1947eebb7f"),
  g("photo-1709477542164-ae852db0d019"),
  g("photo-1662220984920-3bd1f88e846f"),
  g("photo-1709477542151-b98344ef6253"),
  g("photo-1668417863230-64f268d1d252"),
  g("photo-1585314293845-4db3b9d0c6e9"),
  g("photo-1564069114553-7215e1ff1890"),
  g("photo-1489987707025-afc232f7ea0f"),
  g("photo-1558769132-cb1aea458c5e"),
  g("photo-1581578731548-c64695cc6952"),
  g("photo-1509631179647-0177331693ae"),
] as const;

export const LAUNDRY_PORTAL_SAMPLE_LOGO =
  `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?${Q}&w=240&h=240`;

/** รูปปกแพ็กเกจตัวอย่าง — index ตามลำดับแพ็กใน seed */
export const LAUNDRY_PACKAGE_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?${Q}&w=400&h=300`,
  `https://images.unsplash.com/photo-1582735689369-4fe89db7114c?${Q}&w=400&h=300`,
  `https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?${Q}&w=400&h=300`,
] as const;

export function laundryPackageSampleImage(index: number): string {
  const list = LAUNDRY_PACKAGE_SAMPLE_IMAGES;
  return list[((index % list.length) + list.length) % list.length]!;
}

/** แทนที่ URL ตัวอย่างที่เคย 404 ด้วยชุดใหม่ (คงขนาด query ถ้ามี) */
export function laundryRepairSampleImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return url ?? null;
  let next = url;
  for (const [broken, good] of Object.entries(LAUNDRY_BROKEN_UNSPLASH_REPLACEMENTS)) {
    if (next.includes(broken)) next = next.split(broken).join(good);
  }
  if (next !== url) return next;
  if (!LAUNDRY_BROKEN_UNSplash_RE.test(url)) return url;
  if (url.includes("w=240") || url.includes("h=240")) return LAUNDRY_PORTAL_SAMPLE_LOGO;
  if (url.includes("w=400") || url.includes("h=300")) return LAUNDRY_PACKAGE_SAMPLE_IMAGES[0]!;
  if (url.includes("w=1400") || url.includes("h=560")) return LAUNDRY_PORTAL_SAMPLE_BANNER;
  return LAUNDRY_PORTAL_SAMPLE_GALLERY[1]!;
}

export function laundryRepairPortalGallery(urls: string[]): string[] {
  return urls.map((u) => laundryRepairSampleImageUrl(u) ?? u);
}
