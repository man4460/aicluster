import {
  CLUB_EVENT_DUES_PERIOD_LABELS,
  clubEventDuesPeriodForDate,
  type ClubEventDuesPeriodKey,
} from "@/systems/club-event/lib/dues";

function parseDuesPeriod(raw: unknown): ClubEventDuesPeriodKey {
  if (raw === "MONTHLY" || raw === "QUARTERLY" || raw === "SEMIANNUAL" || raw === "YEARLY") return raw;
  return "YEARLY";
}

export type ClubLinkBundledAnnualDues = {
  amountBaht: number;
  periodKey: string;
  periodLabel: string;
};

/** ค่าบำรุงที่พ่วงกับลิงก์สำรวจ/เก็บเงิน — null ถ้าไม่เปิดหรือยอดเป็น 0 */
export function resolveClubLinkBundledAnnualDues(opts: {
  linkAnnualDues?: boolean;
  profile: {
    duesEnabled: boolean;
    duesAmountBaht: number;
    duesPeriod: string;
  };
  at?: Date;
}): ClubLinkBundledAnnualDues | null {
  if (!opts.linkAnnualDues) return null;
  if (!opts.profile.duesEnabled) return null;
  const amountBaht = Math.max(0, Math.round(Number(opts.profile.duesAmountBaht) || 0));
  if (amountBaht <= 0) return null;
  const period = parseDuesPeriod(opts.profile.duesPeriod);
  const { periodKey, periodLabel } = clubEventDuesPeriodForDate(period, opts.at);
  return {
    amountBaht,
    periodKey,
    periodLabel: periodLabel || CLUB_EVENT_DUES_PERIOD_LABELS[period],
  };
}
