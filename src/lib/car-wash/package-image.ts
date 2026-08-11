const PACKAGE_IMAGE_PREFIX = "/uploads/car-wash-packages/";

/** อนุญาต path อัปโหลดแพ็ก หรือ URL ภายนอก (เช่นรูปตัวอย่าง seed) */
export function normalizeCarWashPackageImageUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.includes("..") || t.includes("\\")) return null;
  if (t.startsWith(PACKAGE_IMAGE_PREFIX)) return t.slice(0, 512);
  if (t.startsWith("https://") || t.startsWith("http://")) return t.slice(0, 512);
  return null;
}
