import type { ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";

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
      const parsed: ClubDynamicLinkField[] = [];
      for (const f of row.payload.fields as { key?: string; label?: string; type?: string; options?: string[] }[]) {
        if (typeof f?.key !== "string" || !f.key.trim()) continue;
        const type = f.type === "choice" ? "choice" : "text";
        parsed.push({
          key: f.key.trim(),
          label: typeof f.label === "string" && f.label.trim() ? f.label.trim() : f.key,
          type,
          options: type === "choice" && Array.isArray(f.options) ? f.options.filter((o) => typeof o === "string") : undefined,
          required: false,
        });
      }
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

/** สรุปคำตอบแบบสอบถาม — แยกตามคำถาม (choice = นับตัวเลือก · text = ตัวอย่างคำตอบ) */
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
      const counts = new Map<string, number>();
      for (const opt of field.options ?? []) counts.set(opt, 0);
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
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "th"));
      return {
        key: field.key,
        label: field.label,
        kind: "choice",
        answered,
        options,
      };
    }

    return {
      key: field.key,
      label: field.label,
      kind: "text",
      answered: values.length,
      samples: values.slice(0, 30),
    };
  });

  return { total: rows.length, questions };
}
