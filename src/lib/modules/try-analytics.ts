import { createHash, randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  bangkokMonthStartYmd,
  bangkokTodayYmd,
  bangkokYearCalendar,
} from "@/lib/dates/bangkok-calendar";

export const MODULE_TRY_VISITOR_COOKIE = "mw_try_vid";
export const MODULE_TRY_UTM_COOKIE = "mw_try_utm";

export type ModuleTryUtm = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export type ModuleTryPeriodKey = "today" | "month" | "year" | "custom";

const UTM_MAX = 120;

function clip(raw: string | null | undefined, max = UTM_MAX): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  return s.slice(0, max);
}

export function parseModuleTryUtm(
  input: Record<string, string | null | undefined> | URLSearchParams,
): ModuleTryUtm {
  const get = (k: string) => {
    if (input instanceof URLSearchParams) return input.get(k);
    return input[k] ?? input[k.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "")];
  };
  return {
    utmSource: clip(get("utm_source") ?? get("utmSource")),
    utmMedium: clip(get("utm_medium") ?? get("utmMedium")),
    utmCampaign: clip(get("utm_campaign") ?? get("utmCampaign")),
    utmContent: clip(get("utm_content") ?? get("utmContent")),
    utmTerm: clip(get("utm_term") ?? get("utmTerm")),
  };
}

export function moduleTryUtmFromCookieValue(raw: string | null | undefined): ModuleTryUtm {
  if (!raw?.trim()) {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null };
  }
  try {
    const j = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    return parseModuleTryUtm({
      utm_source: typeof j.utm_source === "string" ? j.utm_source : typeof j.utmSource === "string" ? j.utmSource : null,
      utm_medium: typeof j.utm_medium === "string" ? j.utm_medium : typeof j.utmMedium === "string" ? j.utmMedium : null,
      utm_campaign:
        typeof j.utm_campaign === "string" ? j.utm_campaign : typeof j.utmCampaign === "string" ? j.utmCampaign : null,
      utm_content:
        typeof j.utm_content === "string" ? j.utm_content : typeof j.utmContent === "string" ? j.utmContent : null,
      utm_term: typeof j.utm_term === "string" ? j.utm_term : typeof j.utmTerm === "string" ? j.utmTerm : null,
    });
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null };
  }
}

export function serializeModuleTryUtmCookie(utm: ModuleTryUtm): string {
  return encodeURIComponent(
    JSON.stringify({
      utm_source: utm.utmSource,
      utm_medium: utm.utmMedium,
      utm_campaign: utm.utmCampaign,
      utm_content: utm.utmContent,
      utm_term: utm.utmTerm,
    }),
  );
}

export function hasAnyUtm(utm: ModuleTryUtm): boolean {
  return Boolean(utm.utmSource || utm.utmMedium || utm.utmCampaign || utm.utmContent || utm.utmTerm);
}

/** ดึง slug โมดูลจาก next=/dashboard/{slug} */
export function moduleSlugFromTryNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const path = next.split("?")[0] ?? next;
  const m = path.match(/^\/dashboard\/([^/]+)/);
  if (!m?.[1]) return null;
  const seg = decodeURIComponent(m[1]).trim();
  if (!seg) return null;
  const skip = new Set([
    "modules",
    "admin",
    "profile",
    "plans",
    "chat",
    "chat-ai",
    "settings",
    "notifications",
  ]);
  if (skip.has(seg)) return null;
  return seg.slice(0, 191);
}

export function hashModuleTryVisitorKey(parts: {
  cookieId?: string | null;
  ip?: string | null;
  ua?: string | null;
}): string {
  const cookie = parts.cookieId?.trim();
  if (cookie && /^[a-f0-9]{16,64}$/i.test(cookie)) {
    return cookie.toLowerCase().slice(0, 64);
  }
  const raw = `${parts.ip ?? "0"}|${(parts.ua ?? "").slice(0, 120)}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function newModuleTryVisitorId(): string {
  return randomBytes(16).toString("hex");
}

export function parseReferrerHost(referer: string | null | undefined): string | null {
  if (!referer?.trim()) return null;
  try {
    return new URL(referer).host.slice(0, 255) || null;
  } catch {
    return null;
  }
}

/** ช่วงวันปฏิทินไทย → Date UTC สำหรับ query */
export function bangkokYmdRangeToUtc(fromYmd: string, toYmdInclusive: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${fromYmd}T00:00:00+07:00`);
  const endDay = new Date(`${toYmdInclusive}T00:00:00+07:00`);
  const endExclusive = new Date(endDay.getTime() + 24 * 60 * 60 * 1000);
  return { start, endExclusive };
}

export function moduleTryPeriodBounds(
  period: ModuleTryPeriodKey,
  opts?: { fromYmd?: string; toYmd?: string; now?: Date },
): { fromYmd: string; toYmd: string; start: Date; endExclusive: Date; label: string } {
  const now = opts?.now ?? new Date();
  const today = bangkokTodayYmd(now);
  if (period === "today") {
    const { start, endExclusive } = bangkokYmdRangeToUtc(today, today);
    return { fromYmd: today, toYmd: today, start, endExclusive, label: "วันนี้" };
  }
  if (period === "month") {
    const from = bangkokMonthStartYmd(now);
    const { start, endExclusive } = bangkokYmdRangeToUtc(from, today);
    return { fromYmd: from, toYmd: today, start, endExclusive, label: "เดือนนี้" };
  }
  if (period === "year") {
    const y = bangkokYearCalendar(now);
    const from = `${y}-01-01`;
    const { start, endExclusive } = bangkokYmdRangeToUtc(from, today);
    return { fromYmd: from, toYmd: today, start, endExclusive, label: "ปีนี้" };
  }
  const from = opts?.fromYmd && /^\d{4}-\d{2}-\d{2}$/.test(opts.fromYmd) ? opts.fromYmd : bangkokMonthStartYmd(now);
  const to = opts?.toYmd && /^\d{4}-\d{2}-\d{2}$/.test(opts.toYmd) ? opts.toYmd : today;
  const { start, endExclusive } = bangkokYmdRangeToUtc(from, to);
  return { fromYmd: from, toYmd: to, start, endExclusive, label: "กำหนดเอง" };
}

type Db = PrismaClient;

export async function recordModuleTryEvent(
  prisma: Db,
  input: {
    moduleSlug: string;
    eventType: "VIEW" | "TRY_CLICK";
    utm: ModuleTryUtm;
    visitorKey: string;
    referrerHost?: string | null;
  },
): Promise<void> {
  const slug = input.moduleSlug.trim().slice(0, 191);
  if (!slug) return;
  const visitorKey = input.visitorKey.trim().slice(0, 64) || "anon";

  // กัน VIEW ซ้ำถี่ ๆ จาก refresh / Strict Mode ภายใน ~30 นาที ต่อ visitor+slug
  if (input.eventType === "VIEW") {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const dup = await prisma.moduleTryEvent.findFirst({
      where: {
        moduleSlug: slug,
        eventType: "VIEW",
        visitorKey,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (dup) return;
  }

  await prisma.moduleTryEvent.create({
    data: {
      moduleSlug: slug,
      eventType: input.eventType,
      utmSource: input.utm.utmSource,
      utmMedium: input.utm.utmMedium,
      utmCampaign: input.utm.utmCampaign,
      utmContent: input.utm.utmContent,
      utmTerm: input.utm.utmTerm,
      referrerHost: clip(input.referrerHost, 255),
      visitorKey,
    },
  });
}

export type ModuleTryPeriodStats = {
  views: number;
  tryClicks: number;
  uniqueViews: number;
  uniqueTryClicks: number;
  conversionPct: number;
};

function emptyStats(): ModuleTryPeriodStats {
  return { views: 0, tryClicks: 0, uniqueViews: 0, uniqueTryClicks: 0, conversionPct: 0 };
}

function withConversion(s: ModuleTryPeriodStats): ModuleTryPeriodStats {
  const conversionPct = s.views > 0 ? Math.round((s.tryClicks / s.views) * 1000) / 10 : 0;
  return { ...s, conversionPct };
}

export type ModuleTryStatsRow = {
  moduleSlug: string;
  moduleTitle: string;
  cardImageUrl: string | null;
  groupId: number;
  today: ModuleTryPeriodStats;
  month: ModuleTryPeriodStats;
  year: ModuleTryPeriodStats;
  filtered: ModuleTryPeriodStats;
};

export async function aggregateModuleTryStats(
  prisma: Db,
  opts: {
    moduleSlug?: string | null;
    utmCampaign?: string | null;
    utmSource?: string | null;
    period: ModuleTryPeriodKey;
    fromYmd?: string;
    toYmd?: string;
  },
): Promise<{
  totals: { today: ModuleTryPeriodStats; month: ModuleTryPeriodStats; year: ModuleTryPeriodStats; filtered: ModuleTryPeriodStats };
  rows: ModuleTryStatsRow[];
  campaigns: string[];
  filter: { fromYmd: string; toYmd: string; period: ModuleTryPeriodKey; label: string };
}> {
  const now = new Date();
  const todayB = moduleTryPeriodBounds("today", { now });
  const monthB = moduleTryPeriodBounds("month", { now });
  const yearB = moduleTryPeriodBounds("year", { now });
  const filteredB = moduleTryPeriodBounds(opts.period, {
    now,
    fromYmd: opts.fromYmd,
    toYmd: opts.toYmd,
  });

  const whereBase: Prisma.ModuleTryEventWhereInput = {};
  if (opts.moduleSlug?.trim()) whereBase.moduleSlug = opts.moduleSlug.trim();
  if (opts.utmCampaign?.trim()) whereBase.utmCampaign = opts.utmCampaign.trim();
  if (opts.utmSource?.trim()) whereBase.utmSource = opts.utmSource.trim();

  const modules = await prisma.appModule.findMany({
    where: { isActive: true, ...(opts.moduleSlug?.trim() ? { slug: opts.moduleSlug.trim() } : {}) },
    orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
    select: { slug: true, title: true, cardImageUrl: true, groupId: true },
  });

  const slugSet = new Set(modules.map((m) => m.slug));

  // ดึง event ปีนี้ (หรือช่วง custom ที่กว้างกว่า) แล้ว aggregate ใน memory
  const rangeStartMs = Math.min(yearB.start.getTime(), filteredB.start.getTime());
  const rangeEndMs = Math.max(yearB.endExclusive.getTime(), filteredB.endExclusive.getTime());
  const events = await prisma.moduleTryEvent.findMany({
    where: {
      ...whereBase,
      createdAt: { gte: new Date(rangeStartMs), lt: new Date(rangeEndMs) },
    },
    select: {
      moduleSlug: true,
      eventType: true,
      visitorKey: true,
      createdAt: true,
      utmCampaign: true,
    },
  });

  type Acc = {
    todayV: number;
    todayT: number;
    todayUv: Set<string>;
    todayUt: Set<string>;
    monthV: number;
    monthT: number;
    monthUv: Set<string>;
    monthUt: Set<string>;
    yearV: number;
    yearT: number;
    yearUv: Set<string>;
    yearUt: Set<string>;
    filtV: number;
    filtT: number;
    filtUv: Set<string>;
    filtUt: Set<string>;
  };

  const bySlug = new Map<string, Acc>();
  const ensure = (slug: string): Acc => {
    let a = bySlug.get(slug);
    if (!a) {
      a = {
        todayV: 0,
        todayT: 0,
        todayUv: new Set(),
        todayUt: new Set(),
        monthV: 0,
        monthT: 0,
        monthUv: new Set(),
        monthUt: new Set(),
        yearV: 0,
        yearT: 0,
        yearUv: new Set(),
        yearUt: new Set(),
        filtV: 0,
        filtT: 0,
        filtUv: new Set(),
        filtUt: new Set(),
      };
      bySlug.set(slug, a);
    }
    return a;
  };

  const campaignSet = new Set<string>();
  const t0 = todayB.start.getTime();
  const t1 = todayB.endExclusive.getTime();
  const m0 = monthB.start.getTime();
  const m1 = monthB.endExclusive.getTime();
  const y0 = yearB.start.getTime();
  const y1 = yearB.endExclusive.getTime();
  const f0 = filteredB.start.getTime();
  const f1 = filteredB.endExclusive.getTime();

  for (const ev of events) {
    if (ev.utmCampaign) campaignSet.add(ev.utmCampaign);
    if (opts.moduleSlug?.trim() && ev.moduleSlug !== opts.moduleSlug.trim()) continue;
    if (!slugSet.has(ev.moduleSlug) && !opts.moduleSlug?.trim()) {
      // ยังโชว์ slug ที่ไม่มีใน module_list แล้ว
      slugSet.add(ev.moduleSlug);
    }
    const a = ensure(ev.moduleSlug);
    const ts = ev.createdAt.getTime();
    const isView = ev.eventType === "VIEW";

    const bump = (
      vKey: "todayV" | "monthV" | "yearV" | "filtV",
      tKey: "todayT" | "monthT" | "yearT" | "filtT",
      uv: Set<string>,
      ut: Set<string>,
    ) => {
      if (isView) {
        a[vKey] += 1;
        uv.add(ev.visitorKey);
      } else {
        a[tKey] += 1;
        ut.add(ev.visitorKey);
      }
    };

    if (ts >= t0 && ts < t1) bump("todayV", "todayT", a.todayUv, a.todayUt);
    if (ts >= m0 && ts < m1) bump("monthV", "monthT", a.monthUv, a.monthUt);
    if (ts >= y0 && ts < y1) bump("yearV", "yearT", a.yearUv, a.yearUt);
    if (ts >= f0 && ts < f1) bump("filtV", "filtT", a.filtUv, a.filtUt);
  }

  const toStats = (
    v: number,
    t: number,
    uv: Set<string>,
    ut: Set<string>,
  ): ModuleTryPeriodStats =>
    withConversion({
      views: v,
      tryClicks: t,
      uniqueViews: uv.size,
      uniqueTryClicks: ut.size,
      conversionPct: 0,
    });

  const titleBySlug = new Map(modules.map((m) => [m.slug, m]));
  const allSlugs = [...slugSet].sort((a, b) => {
    const ga = titleBySlug.get(a)?.groupId ?? 99;
    const gb = titleBySlug.get(b)?.groupId ?? 99;
    if (ga !== gb) return ga - gb;
    return (titleBySlug.get(a)?.title ?? a).localeCompare(titleBySlug.get(b)?.title ?? b, "th");
  });

  const rows: ModuleTryStatsRow[] = allSlugs
    .map((slug) => {
      const a = bySlug.get(slug) ?? ensure(slug);
      const meta = titleBySlug.get(slug);
      const filtered = toStats(a.filtV, a.filtT, a.filtUv, a.filtUt);
      const today = toStats(a.todayV, a.todayT, a.todayUv, a.todayUt);
      const month = toStats(a.monthV, a.monthT, a.monthUv, a.monthUt);
      const year = toStats(a.yearV, a.yearT, a.yearUv, a.yearUt);
      const hasAny =
        filtered.views + filtered.tryClicks + today.views + today.tryClicks + month.views + month.tryClicks + year.views + year.tryClicks > 0;
      if (!hasAny && !opts.moduleSlug?.trim()) return null;
      if (!hasAny && (opts.utmCampaign || opts.utmSource)) return null;
      return {
        moduleSlug: slug,
        moduleTitle: meta?.title ?? slug,
        cardImageUrl: meta?.cardImageUrl ?? null,
        groupId: meta?.groupId ?? 0,
        today,
        month,
        year,
        filtered,
      };
    })
    .filter((r): r is ModuleTryStatsRow => r != null);

  // ถ้าไม่มีตัวกรองแคมเปญ — เรียงโมดูลที่มีกิจกรรม filtered ก่อน
  rows.sort((a, b) => {
    const sa = a.filtered.views + a.filtered.tryClicks * 2;
    const sb = b.filtered.views + b.filtered.tryClicks * 2;
    if (sb !== sa) return sb - sa;
    return a.moduleTitle.localeCompare(b.moduleTitle, "th");
  });

  const sum = (pick: (r: ModuleTryStatsRow) => ModuleTryPeriodStats): ModuleTryPeriodStats => {
    const acc = emptyStats();
    const uv = new Set<string>();
    const ut = new Set<string>();
    // totals จากแถว — unique รวมข้ามโมดูลจะสูงเกินจริงถ้าใช้ sum unique; ใช้ sum ดิบ + unique จาก events รวม
    for (const r of rows) {
      const s = pick(r);
      acc.views += s.views;
      acc.tryClicks += s.tryClicks;
    }
    void uv;
    void ut;
    return withConversion(acc);
  };

  // unique รวมทั้งระบบจาก events โดยตรง
  const totalUnique = async (start: Date, end: Date, type: "VIEW" | "TRY_CLICK") => {
    const rowsU = await prisma.moduleTryEvent.findMany({
      where: {
        ...whereBase,
        eventType: type,
        createdAt: { gte: start, lt: end },
      },
      distinct: ["visitorKey"],
      select: { visitorKey: true },
    });
    return rowsU.length;
  };

  const [tuV, tuT, muV, muT, yuV, yuT, fuV, fuT] = await Promise.all([
    totalUnique(todayB.start, todayB.endExclusive, "VIEW"),
    totalUnique(todayB.start, todayB.endExclusive, "TRY_CLICK"),
    totalUnique(monthB.start, monthB.endExclusive, "VIEW"),
    totalUnique(monthB.start, monthB.endExclusive, "TRY_CLICK"),
    totalUnique(yearB.start, yearB.endExclusive, "VIEW"),
    totalUnique(yearB.start, yearB.endExclusive, "TRY_CLICK"),
    totalUnique(filteredB.start, filteredB.endExclusive, "VIEW"),
    totalUnique(filteredB.start, filteredB.endExclusive, "TRY_CLICK"),
  ]);

  const totalsToday = withConversion({
    ...sum((r) => r.today),
    uniqueViews: tuV,
    uniqueTryClicks: tuT,
    conversionPct: 0,
  });
  const totalsMonth = withConversion({
    ...sum((r) => r.month),
    uniqueViews: muV,
    uniqueTryClicks: muT,
    conversionPct: 0,
  });
  const totalsYear = withConversion({
    ...sum((r) => r.year),
    uniqueViews: yuV,
    uniqueTryClicks: yuT,
    conversionPct: 0,
  });
  const totalsFiltered = withConversion({
    ...sum((r) => r.filtered),
    uniqueViews: fuV,
    uniqueTryClicks: fuT,
    conversionPct: 0,
  });

  return {
    totals: {
      today: totalsToday,
      month: totalsMonth,
      year: totalsYear,
      filtered: totalsFiltered,
    },
    rows,
    campaigns: [...campaignSet].sort((a, b) => a.localeCompare(b, "th")),
    filter: {
      fromYmd: filteredB.fromYmd,
      toYmd: filteredB.toYmd,
      period: opts.period,
      label: filteredB.label,
    },
  };
}

/** Bangkok date key สำหรับทดสอบ */
export function moduleTryAnalyticsTodayKey(): string {
  return bangkokDateKey();
}
