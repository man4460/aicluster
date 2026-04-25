import type { DailyReminderItem } from "@/lib/reminders/daily-reminder-types";

export const DIGEST_HEADLINE_MAX = 56;
export const DIGEST_DETAIL_MAX = 120;
export const GENERIC_NOTE_DESC = "จากบันทึกรวดเร็ว (จดว่า…)";

export function isGenericQuickNoteAttribution(s: string): boolean {
  const t = s.trim();
  if (t === GENERIC_NOTE_DESC) return true;
  return /จากบันทึกรวดเร็ว\s*\(จดว่า\.{1,3}\)/u.test(t);
}

export function stripDigestNoise(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function headlineWithoutDuplicateTime(headline: string, timeLabel: string | null): string {
  let h = stripDigestNoise(headline);
  if (!timeLabel || !h) return h;
  const hm = timeLabel.replace(/\s*น\.?$/u, "").trim();
  if (!/^\d{1,2}:\d{2}$/.test(hm)) return h;
  const re = new RegExp(`^${hm}\\s*น\\.?\\s*`, "iu");
  h = h.replace(re, "").trim();
  return h;
}

export function splitDigestText(body: string | null | undefined): { headline: string; detail: string | null } {
  const raw = String(body ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!raw) return { headline: "", detail: null };

  const reqBlock =
    raw.match(/คำขอ:\s*([\s\S]*?)(?:\r?\n\s*-{3,}|\r?\n\r?\n\s*-{3,})/u) ??
    raw.match(/คำขอ:\s*([\s\S]*?)\s+-{3,}\s+/u);
  if (reqBlock?.[1]) {
    const head = reqBlock[1].replace(/\s+/g, " ").trim();
    const headline =
      head.length > DIGEST_HEADLINE_MAX ? `${head.slice(0, DIGEST_HEADLINE_MAX)}…` : head;
    const dashIdx = raw.search(/\s+-{3,}\s+/u);
    let tail =
      dashIdx >= 0
        ? raw
            .slice(dashIdx)
            .replace(/^\s*-{3,}\s*/u, "")
            .trim()
        : "";
    tail = tail.replace(/\s+/g, " ").trim();
    const detailRaw =
      tail.length > DIGEST_DETAIL_MAX ? `${tail.slice(0, DIGEST_DETAIL_MAX).trim()}…` : tail.length ? tail : null;
    const detail = detailRaw ? stripDigestNoise(detailRaw) : null;
    return { headline: stripDigestNoise(headline), detail };
  }

  if (raw.includes("\n")) {
    let lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines[0] && /^แผนงานจากแชท AI$/u.test(lines[0])) {
      lines = lines.slice(1);
    }
    lines = lines.filter((l) => !isGenericQuickNoteAttribution(l));
    const first = lines[0] ?? "";
    const headlineRaw =
      first.length > DIGEST_HEADLINE_MAX ? `${first.slice(0, DIGEST_HEADLINE_MAX)}…` : first;
    const headline = stripDigestNoise(headlineRaw);
    const rest = stripDigestNoise(lines.slice(1).join(" ").trim());
    const detailRaw =
      rest.length > DIGEST_DETAIL_MAX ? `${rest.slice(0, DIGEST_DETAIL_MAX).trim()}…` : rest.length ? rest : null;
    const detail = detailRaw ? stripDigestNoise(detailRaw) : null;
    return { headline, detail };
  }

  const single = stripDigestNoise(raw.replace(/\s+/g, " ").trim());
  if (single.length <= DIGEST_HEADLINE_MAX) return { headline: single, detail: null };
  return {
    headline: `${single.slice(0, DIGEST_HEADLINE_MAX)}…`,
    detail: stripDigestNoise(`${single.slice(DIGEST_HEADLINE_MAX).trim()}…`),
  };
}

export function digestReminderDisplay(item: DailyReminderItem): { headline: string; detail: string | null } {
  const titleSafe = String(item.title ?? "");
  if (item.source === "personal_note") {
    return splitDigestText(titleSafe);
  }
  const desc = String(item.description ?? "").trim();
  if (desc && !isGenericQuickNoteAttribution(desc)) {
    const th = titleSafe.trim();
    const headline =
      th.length > DIGEST_HEADLINE_MAX ? `${th.slice(0, DIGEST_HEADLINE_MAX)}…` : th;
    const detail = desc.length > DIGEST_DETAIL_MAX ? `${desc.slice(0, DIGEST_DETAIL_MAX)}…` : desc;
    return { headline, detail };
  }
  return splitDigestText(titleSafe);
}
