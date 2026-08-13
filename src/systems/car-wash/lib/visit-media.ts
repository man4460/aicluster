/** จำนวนรูปหลักฐานสภาพรถสูงสุดต่อรายการล้าง */
export const CAR_WASH_VISIT_EVIDENCE_MAX = 10;

export function parseCarWashVisitEvidenceUrls(raw: unknown): string[] {
  if (raw == null) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      arr = JSON.parse(t) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item !== "string") continue;
    const u = item.trim();
    if (!u || u.length > 512) continue;
    out.push(u);
    if (out.length >= CAR_WASH_VISIT_EVIDENCE_MAX) break;
  }
  return out;
}

export function normalizeCarWashVisitEvidenceUrls(urls: unknown): string[] {
  return parseCarWashVisitEvidenceUrls(urls);
}
