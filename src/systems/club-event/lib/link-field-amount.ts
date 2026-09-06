import type { ClubDynamicLinkField, ClubDynamicLinkQtyItem } from "@/systems/club-event/lib/mappers";

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

export function serializeClubLinkQtyAnswer(map: Record<string, number>): string {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    const n = Math.floor(Number(v));
    if (k && Number.isFinite(n) && n > 0) out[k] = n;
  }
  return JSON.stringify(out);
}

export function formatClubLinkQtyAnswerDisplay(
  raw: string | null | undefined,
  items?: ClubDynamicLinkQtyItem[],
): string {
  const map = parseClubLinkQtyAnswer(raw);
  const parts: string[] = [];
  if (items && items.length > 0) {
    for (const item of items) {
      const q = map[item.key] ?? 0;
      if (q > 0) parts.push(`${item.label} ×${q}`);
    }
  } else {
    for (const [k, q] of Object.entries(map)) {
      if (q > 0) parts.push(`${k} ×${q}`);
    }
  }
  return parts.join(" · ");
}

export function clubLinkFieldsHavePrices(fields: ClubDynamicLinkField[]): boolean {
  return fields.some((f) => {
    if (f.type === "choice") return (f.choiceOptions ?? []).some((o) => o.amountBaht > 0);
    if (f.type === "qty") return (f.qtyItems ?? []).some((i) => i.amountBaht > 0);
    return false;
  });
}

export function computeClubLinkAnswersAmountBaht(
  fields: ClubDynamicLinkField[],
  answers: Record<string, string>,
  opts?: { baseAmountBaht?: number; includeDuesBaht?: number },
): number {
  let total = Math.max(0, Math.round(Number(opts?.baseAmountBaht) || 0));
  for (const f of fields) {
    if (f.type === "choice") {
      const val = (answers[f.key] ?? "").trim();
      const opt = (f.choiceOptions ?? []).find((o) => o.label === val);
      if (opt) total += Math.max(0, Math.round(opt.amountBaht) || 0);
      continue;
    }
    if (f.type === "qty") {
      const map = parseClubLinkQtyAnswer(answers[f.key]);
      for (const item of f.qtyItems ?? []) {
        const q = map[item.key] ?? 0;
        if (q > 0) total += q * Math.max(0, Math.round(item.amountBaht) || 0);
      }
    }
  }
  total += Math.max(0, Math.round(Number(opts?.includeDuesBaht) || 0));
  return total;
}
