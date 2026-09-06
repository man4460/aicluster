import { formatClubLinkQtyAnswerDisplay, parseClubLinkQtyAnswer } from "@/systems/club-event/lib/link-field-amount";
import { normalizeClubDynamicLinkFields, type ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";

export type ClubSubmissionRow = {
  id: string;
  respondentName: string;
  respondentPhone: string;
  amountBaht: number | null;
  paymentMethod: string | null;
  slipUrl: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type ClubQuestionSummary =
  | {
      key: string;
      label: string;
      kind: "choice";
      answered: number;
      options: { value: string; count: number; pct: number }[];
    }
  | {
      key: string;
      label: string;
      kind: "qty";
      answered: number;
      /** รวมชิ้น/ห้องทุกขนาด */
      totalUnits: number;
      items: { key: string; label: string; count: number; amountBaht: number }[];
    }
  | {
      key: string;
      label: string;
      kind: "text";
      answered: number;
      samples: { value: string; name: string; createdAt: string }[];
    };

function answersOf(row: ClubSubmissionRow): Record<string, string> {
  const raw = row.payload.answers;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    if (Object.keys(out).length > 0) return out;
  }
  const legacy = typeof row.payload.answer === "string" ? row.payload.answer.trim() : "";
  return legacy ? { answer: legacy } : {};
}

function fieldsFromRows(rows: ClubSubmissionRow[], fallback: ClubDynamicLinkField[]): ClubDynamicLinkField[] {
  for (const row of rows) {
    if (Array.isArray(row.payload.fields) && row.payload.fields.length > 0) {
      const parsed = normalizeClubDynamicLinkFields(row.payload.fields);
      if (parsed.length > 0) return parsed;
    }
  }
  if (fallback.length > 0) return fallback;
  const keys = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(answersOf(row))) keys.add(k);
  }
  return [...keys].map((key) => ({
    key,
    label: key === "answer" ? "คำตอบ" : key,
    type: "text" as const,
    required: false,
  }));
}

export function formatClubSubmissionAnswer(
  value: string,
  field?: { type?: string; qtyItems?: ClubDynamicLinkField["qtyItems"] },
): string {
  if (field?.type === "qty") {
    return formatClubLinkQtyAnswerDisplay(value, field.qtyItems) || value;
  }
  return value;
}

/** สรุปคำตอบแบบสอบถาม — ข้อความสั้น (choice นับตัวเลือก · qty รวมต่อขนาด · text ตัวอย่าง) */
export function summarizeClubLinkSubmissions(
  rows: ClubSubmissionRow[],
  linkFields: ClubDynamicLinkField[] = [],
): { total: number; questions: ClubQuestionSummary[] } {
  const fields = fieldsFromRows(rows, linkFields);
  const questions: ClubQuestionSummary[] = fields.map((field) => {
    const values: { value: string; name: string; createdAt: string }[] = [];
    for (const row of rows) {
      const v = answersOf(row)[field.key];
      if (!v) continue;
      values.push({
        value: v,
        name: row.respondentName || "ไม่ระบุชื่อ",
        createdAt: row.createdAt,
      });
    }

    if (field.type === "choice") {
      const optLabels = field.choiceOptions?.map((o) => o.label) ?? field.options ?? [];
      const counts = new Map<string, number>();
      for (const opt of optLabels) counts.set(opt, 0);
      for (const { value } of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      const answered = values.length;
      const options = [...counts.entries()]
        .map(([value, count]) => ({
          value,
          count,
          pct: answered > 0 ? Math.round((count / answered) * 100) : 0,
        }))
        .filter((o) => o.count > 0 || optLabels.includes(o.value))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "th"));
      return {
        key: field.key,
        label: field.label,
        kind: "choice",
        answered,
        options,
      };
    }

    if (field.type === "qty") {
      const itemsDef = field.qtyItems ?? [];
      const totals = new Map<string, number>();
      for (const item of itemsDef) totals.set(item.key, 0);
      let answered = 0;
      for (const { value } of values) {
        const qtyMap = parseClubLinkQtyAnswer(value);
        const hasAny = Object.values(qtyMap).some((n) => n > 0);
        if (!hasAny) continue;
        answered += 1;
        for (const [k, n] of Object.entries(qtyMap)) {
          totals.set(k, (totals.get(k) ?? 0) + n);
        }
      }
      const items = itemsDef.map((item) => {
        const count = totals.get(item.key) ?? 0;
        return {
          key: item.key,
          label: item.label,
          count,
          amountBaht: item.amountBaht > 0 ? count * item.amountBaht : 0,
        };
      });
      for (const [k, count] of totals.entries()) {
        if (itemsDef.some((i) => i.key === k)) continue;
        if (count <= 0) continue;
        items.push({ key: k, label: k, count, amountBaht: 0 });
      }
      const totalUnits = items.reduce((s, i) => s + i.count, 0);
      return {
        key: field.key,
        label: field.label,
        kind: "qty",
        answered,
        totalUnits,
        items: items
          .filter((i) => i.count > 0)
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "th")),
      };
    }

    return {
      key: field.key,
      label: field.label,
      kind: "text",
      answered: values.length,
      samples: values.slice(0, 40),
    };
  });

  return { total: rows.length, questions };
}
