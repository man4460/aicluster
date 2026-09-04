import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";

export type ClubEventDuesPeriodKey = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";

export const CLUB_EVENT_DUES_PERIOD_LABELS: Record<ClubEventDuesPeriodKey, string> = {
  MONTHLY: "รายเดือน",
  QUARTERLY: "รายไตรมาส",
  SEMIANNUAL: "รายครึ่งปี",
  YEARLY: "รายปี",
};

export function normalizeClubPhoneDigits(raw: string | null | undefined): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** คีย์ + ป้ายรอบเก็บค่าบำรุงตามปฏิทินไทย (Asia/Bangkok) */
export function clubEventDuesPeriodForDate(
  period: ClubEventDuesPeriodKey,
  at: Date = new Date(),
): { periodKey: string; periodLabel: string } {
  const ymd = bangkokDateKey(at);
  const year = ymd.slice(0, 4);
  const month = Number(ymd.slice(5, 7));
  const monthKey = bangkokMonthKey(at);

  switch (period) {
    case "MONTHLY":
      return {
        periodKey: monthKey,
        periodLabel: `${CLUB_EVENT_DUES_PERIOD_LABELS.MONTHLY} ${monthKey}`,
      };
    case "QUARTERLY": {
      const q = Math.ceil(month / 3);
      return {
        periodKey: `${year}-Q${q}`,
        periodLabel: `${CLUB_EVENT_DUES_PERIOD_LABELS.QUARTERLY} ${year} ไตรมาส ${q}`,
      };
    }
    case "SEMIANNUAL": {
      const half = month <= 6 ? 1 : 2;
      return {
        periodKey: `${year}-H${half}`,
        periodLabel: `${CLUB_EVENT_DUES_PERIOD_LABELS.SEMIANNUAL} ${year} ครึ่งปีที่ ${half}`,
      };
    }
    case "YEARLY":
    default:
      return {
        periodKey: year,
        periodLabel: `${CLUB_EVENT_DUES_PERIOD_LABELS.YEARLY} ${year}`,
      };
  }
}
