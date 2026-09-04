import type { PrismaClient } from "@/generated/prisma/client";

type ReorderDelegate = {
  findMany: (args: {
    where: { profileId: string; ownerUserId: string; trialSessionId: string };
    select: { id: true };
  }) => Promise<{ id: string }[]>;
  update: (args: { where: { id: string }; data: { orderIndex: number } }) => Promise<unknown>;
};

export async function applyOrderedIds(
  delegate: ReorderDelegate,
  profileId: string,
  ownerUserId: string,
  trialSessionId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: "orderedIds ว่าง" };
  }
  const existing = await delegate.findMany({
    where: { profileId, ownerUserId, trialSessionId },
    select: { id: true },
  });
  const allowed = new Set(existing.map((r) => r.id));
  if (orderedIds.some((id) => !allowed.has(id))) {
    return { ok: false, error: "รายการไม่ถูกต้อง" };
  }
  await Promise.all(
    orderedIds.map((id, index) =>
      delegate.update({ where: { id }, data: { orderIndex: index } }),
    ),
  );
  return { ok: true };
}

export function detectDeviceType(ua: string | null): string {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(s)) return "mobile";
  if (/ipad|tablet/.test(s)) return "tablet";
  return "desktop";
}

export function last7BangkokDateKeys(end = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(end.getTime() - i * 86400000);
    keys.push(
      d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }),
    );
  }
  return keys;
}

export function bangkokWeekStartKey(d = new Date()): string {
  const todayKey = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = map[weekday] ?? 0;
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(`${todayKey}T12:00:00+07:00`);
  monday.setDate(monday.getDate() + mondayOffset);
  return monday.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}
