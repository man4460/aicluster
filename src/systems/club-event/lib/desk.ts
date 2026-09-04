import { parseClubLinkQtyAnswer } from "@/systems/club-event/lib/link-field-amount";
import {
  normalizeClubDynamicLinkFields,
  parseDynamicLinkConfig,
  type ClubDynamicLinkField,
} from "@/systems/club-event/lib/mappers";
import { normalizeClubPhoneDigits } from "@/systems/club-event/lib/dues";

export type ClubEventDeskSource = "QR" | "STAFF" | "WALK_IN";

export type ClubEventFulfillmentItem = {
  key: string;
  label: string;
  qty: number;
  delivered: boolean;
  deliveredAt?: string | null;
};

export type ClubEventCheckInDto = {
  id: string;
  eventId: string;
  memberId: string | null;
  guestName: string;
  guestPhone: string;
  memberCode: string;
  source: ClubEventDeskSource;
  submissionId: string | null;
  checkedInAt: string;
  fulfillment: ClubEventFulfillmentItem[];
  paymentDueBaht: number;
  paymentCleared: boolean;
  signatureImageUrl: string | null;
  signedAt: string | null;
  note: string;
};

export function parseFulfillmentJson(raw: string): ClubEventFulfillmentItem[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: ClubEventFulfillmentItem[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const key = typeof r.key === "string" ? r.key : "";
      const label = typeof r.label === "string" ? r.label : key;
      const qty = typeof r.qty === "number" && Number.isFinite(r.qty) ? Math.max(0, Math.floor(r.qty)) : 0;
      if (!key || qty <= 0) continue;
      out.push({
        key,
        label: label || key,
        qty,
        delivered: Boolean(r.delivered),
        deliveredAt: typeof r.deliveredAt === "string" ? r.deliveredAt : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeFulfillmentJson(items: ClubEventFulfillmentItem[]): string {
  return JSON.stringify(items);
}

/** แสดงชื่อรายการแจก — ตัดคำนำหน้าชื่อคำถาม qty ที่เคยต่อไว้ */
export function formatClubEventFulfillmentLabel(label: string): string {
  const raw = label.trim();
  if (!raw) return raw;
  const sep = raw.indexOf(": ");
  if (sep > 0 && sep < raw.length - 2) return raw.slice(sep + 2).trim() || raw;
  return raw;
}

export function mapClubEventCheckInRow(row: {
  id: string;
  eventId: string;
  memberId: string | null;
  guestName: string;
  guestPhone: string;
  memberCode: string;
  source: string;
  submissionId: string | null;
  checkedInAt: Date;
  fulfillmentJson: string;
  paymentDueBaht: number;
  paymentCleared: boolean;
  signatureImageUrl: string | null;
  signedAt: Date | null;
  note: string;
}): ClubEventCheckInDto {
  const source = (row.source === "QR" || row.source === "WALK_IN" || row.source === "STAFF"
    ? row.source
    : "STAFF") as ClubEventDeskSource;
  return {
    id: row.id,
    eventId: row.eventId,
    memberId: row.memberId,
    guestName: row.guestName,
    guestPhone: row.guestPhone,
    memberCode: row.memberCode,
    source,
    submissionId: row.submissionId,
    checkedInAt: row.checkedInAt.toISOString(),
    fulfillment: parseFulfillmentJson(row.fulfillmentJson),
    paymentDueBaht: row.paymentDueBaht,
    paymentCleared: row.paymentCleared,
    signatureImageUrl: row.signatureImageUrl,
    signedAt: row.signedAt?.toISOString() ?? null,
    note: row.note,
  };
}

/** รวม qty จากคำตอบฟอร์มเป็นรายการแจกของ */
export function fulfillmentFromAnswers(
  fields: ClubDynamicLinkField[],
  answers: Record<string, string>,
): ClubEventFulfillmentItem[] {
  const out: ClubEventFulfillmentItem[] = [];
  for (const f of fields) {
    if (f.type !== "qty") continue;
    const map = parseClubLinkQtyAnswer(answers[f.key]);
    for (const item of f.qtyItems ?? []) {
      const qty = map[item.key] ?? 0;
      if (qty <= 0) continue;
      out.push({
        key: `${f.key}:${item.key}`,
        /** แสดงชื่อรายการอย่างเดียว — ไม่ต่อชื่อคำถาม qty (เช่น «รับของหน้างาน») */
        label: item.label.trim() || f.label.trim() || item.key,
        qty,
        delivered: false,
        deliveredAt: null,
      });
    }
  }
  return out;
}

export function parseSubmissionAnswers(payloadJson: string): Record<string, string> {
  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const raw = payload.answers;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) out[k] = v.trim();
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function fieldsFromLinkConfigJson(configJson: string): ClubDynamicLinkField[] {
  return normalizeClubDynamicLinkFields(parseDynamicLinkConfig(configJson).fields ?? []);
}

export function clubDeskMatchScore(opts: {
  name: string;
  phone: string;
  memberCode: string;
  query: string;
}): boolean {
  const q = opts.query.trim().toLowerCase();
  if (q.length < 1) return true;
  const phoneQ = normalizeClubPhoneDigits(q);
  const hay = [opts.name, opts.phone, opts.memberCode].join(" ").toLowerCase();
  if (hay.includes(q)) return true;
  if (phoneQ.length >= 3) {
    const p = normalizeClubPhoneDigits(opts.phone);
    if (p.includes(phoneQ) || phoneQ.includes(p)) return true;
  }
  return false;
}

/** คีย์รวมคนเดียวกัน (รหัสสมาชิก → เบอร์ → ชื่อ) — ใช้กันรายการค้นหาซ้ำ */
export function clubDeskPersonKey(opts: {
  memberCode?: string | null;
  phone?: string | null;
  name?: string | null;
}): string {
  const code = (opts.memberCode ?? "").trim().toLowerCase();
  if (code) return `c:${code}`;
  const phone = normalizeClubPhoneDigits(opts.phone);
  if (phone.length >= 9) return `p:${phone}`;
  const name = (opts.name ?? "").trim().toLowerCase();
  if (name) return `n:${name}`;
  return "";
}

export function clubEventPublicCheckInPath(slug: string, eventId: string): string {
  return `/club/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}/check-in`;
}
