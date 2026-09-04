/** แปลงคำตอบฟิลด์ qty → map key → จำนวน */
export function parseClubLinkQtyAnswer(raw: string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (raw == null) return out;
  const text = String(raw).trim();
  if (!text) return out;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isFinite(n) && n > 0) out[k] = Math.floor(n);
      }
      return out;
    }
  } catch {
    /* fall through — รูปแบบ key:qty */
  }

  for (const part of text.split(/[,;\n]+/)) {
    const m = part.trim().match(/^([^:=]+)[:=]\s*(-?\d+)/);
    if (!m) continue;
    const key = m[1]!.trim();
    const n = Number(m[2]);
    if (!key || !Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.floor(n);
  }
  return out;
}
