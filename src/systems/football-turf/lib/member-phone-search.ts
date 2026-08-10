import type { FootballTurfCustomer } from "@/systems/football-turf/lib/types";

export function normalizeFootballTurfPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

type FootballTurfMemberSearchRow = Pick<
  FootballTurfCustomer,
  "id" | "name" | "phone" | "teamName" | "isActive" | "photoUrl"
> & { pointsBalance?: number };

/** ค้นหาสมาชิกจากเบอร์เต็มหรือ 4 หลักท้าย */
export function findFootballTurfCustomersByPhone(
  list: FootballTurfMemberSearchRow[],
  raw: string,
): FootballTurfMemberSearchRow[] {
  const digits = normalizeFootballTurfPhoneDigits(raw);
  if (digits.length < 4) return [];
  const scored: { c: (typeof list)[number]; score: number }[] = [];
  for (const c of list) {
    if (!c.isActive) continue;
    const p = normalizeFootballTurfPhoneDigits(c.phone);
    if (!p) continue;
    if (digits.length >= 9 && (p === digits || p.endsWith(digits) || digits.endsWith(p))) {
      scored.push({ c, score: 3 });
      continue;
    }
    if (p.endsWith(digits.slice(-4))) {
      scored.push({ c, score: 1 });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, "th"));
  const seen = new Set<number>();
  const out: typeof list = [];
  for (const row of scored) {
    if (seen.has(row.c.id)) continue;
    seen.add(row.c.id);
    out.push(row.c);
  }
  return out;
}

export function phonesMatchFootballTurf(a: string, b: string): boolean {
  const pa = normalizeFootballTurfPhoneDigits(a);
  const pb = normalizeFootballTurfPhoneDigits(b);
  if (!pa || !pb) return false;
  if (pa === pb) return true;
  if (pa.length >= 9 && pb.length >= 9) return pa.endsWith(pb) || pb.endsWith(pa);
  if (pa.length >= 4 && pb.length >= 4) {
    return pa.endsWith(pb.slice(-4)) || pb.endsWith(pa.slice(-4));
  }
  return false;
}
