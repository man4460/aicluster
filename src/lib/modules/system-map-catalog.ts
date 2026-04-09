/** รายการคงที่ในหน้า «ระบบทั้งหมด» — ไม่มีใน `module_list` / ไม่ต้อง Subscribe */
export const SYSTEM_MAP_CATALOG_SLUG = "__system-map__" as const;

export const SYSTEM_MAP_CATALOG_ROW = {
  id: "__system-map__",
  slug: SYSTEM_MAP_CATALOG_SLUG,
  title: "แผนผังระบบ",
  /** สองบรรทัดกระชับ — สอดคล้องการ์ดแดชบอร์ด */
  description: "ภาพรวมระบบที่เปิดและในแผนพัฒนา\nเปิดแผนผังดูความสัมพันธ์ได้ทันที",
  groupId: 1,
} as const;

export function isSystemMapCatalogSlug(slug: string): boolean {
  return slug === SYSTEM_MAP_CATALOG_SLUG;
}
