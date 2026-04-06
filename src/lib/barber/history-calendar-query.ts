import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { daysInBangkokMonth } from "./bangkok-day";

const DAY_MS = 24 * 60 * 60 * 1000;

/** เลขเดือน 1–12 หรือ `all` = รวมทุกเดือนในปีที่เลือก (เวลาไทย) */
export function parseHistoryMonthParam(searchParams: URLSearchParams): number | "all" {
  const raw = (searchParams.get("month") ?? "").trim().toLowerCase();
  if (raw === "all") return "all";
  const key = bangkokDateKey();
  const defM = Number(key.split("-")[1]);
  const month = Number(raw);
  if (!Number.isFinite(month) || month < 1 || month > 12) return defM;
  return month;
}

/** `all` = ทุกวันในเดือน · 1–31 ตามปฏิทินไทย */
export function parseHistoryDayParam(
  searchParams: URLSearchParams,
  year: number,
  month: number | "all",
): number | "all" {
  if (month === "all") return "all";
  const raw = (searchParams.get("day") ?? "all").trim().toLowerCase();
  if (raw === "all" || raw === "") return "all";
  const d = Number(raw);
  const dim = daysInBangkokMonth(year, month);
  if (!Number.isFinite(d) || d < 1 || d > dim) return "all";
  return d;
}

/** ปีปฏิทินไทยที่มี log จริง */
export async function distinctBangkokYearsForOwner(
  ownerId: string,
  trialSessionId: string,
): Promise<number[]> {
  const bounds = await prisma.barberServiceLog.aggregate({
    where: { ownerUserId: ownerId, trialSessionId },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });
  const minAt = bounds._min.createdAt;
  const maxAt = bounds._max.createdAt;
  if (!minAt || !maxAt) return [];

  const years = new Set<number>();
  const startKey = minAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const endKey = maxAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const start = new Date(`${startKey}T12:00:00+07:00`);
  const end = new Date(`${endKey}T12:00:00+07:00`);
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const y = Number(
      new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4),
    );
    if (Number.isFinite(y)) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

export async function resolveBarberHistoryCalendarFromSearchParams(
  ownerId: string,
  trialSessionId: string,
  searchParams: URLSearchParams,
): Promise<{
  year: number;
  month: number | "all";
  day: number | "all";
  availableYears: number[];
}> {
  const monthParam = parseHistoryMonthParam(searchParams);
  const key = bangkokDateKey();
  const defY = Number(key.split("-")[0]);

  const dbYears = await distinctBangkokYearsForOwner(ownerId, trialSessionId);
  const fromDb = dbYears.length > 0 ? dbYears : [];
  const availableYears = [...new Set([...fromDb, defY])].sort((a, b) => a - b);

  const yearParam = Number(searchParams.get("year"));
  let year = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : defY;
  if (!availableYears.includes(year)) {
    year = availableYears[availableYears.length - 1]!;
  }

  const dayParam = parseHistoryDayParam(searchParams, year, monthParam);
  return { year, month: monthParam, day: dayParam, availableYears };
}
