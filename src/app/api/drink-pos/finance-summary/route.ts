import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

function bangkokDayKey(d: Date): string {
  return d.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
}

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const now = new Date();
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(bangkokDayKey(d));
  }
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);

  const [sales, costs] = await Promise.all([
    prisma.drinkPosSale.findMany({
      where: { ownerUserId, createdAt: { gte: from } },
      select: { totalBaht: true, createdAt: true },
    }),
    prisma.drinkPosCostEntry.findMany({
      where: { ownerUserId, spentAt: { gte: from } },
      select: { amountBaht: true, spentAt: true },
    }),
  ]);

  const revMap = new Map(keys.map((k) => [k, 0]));
  const costMap = new Map(keys.map((k) => [k, 0]));
  for (const s of sales) {
    const k = bangkokDayKey(s.createdAt);
    if (revMap.has(k)) revMap.set(k, (revMap.get(k) ?? 0) + s.totalBaht);
  }
  for (const c of costs) {
    const k = bangkokDayKey(c.spentAt);
    if (costMap.has(k)) costMap.set(k, (costMap.get(k) ?? 0) + c.amountBaht);
  }

  const buckets = keys.map((dateKey) => ({
    dateKey,
    label: dateKey.slice(5).replace("-", "/"),
    revenueBaht: revMap.get(dateKey) ?? 0,
    costBaht: costMap.get(dateKey) ?? 0,
  }));

  const totalRevenue7d = buckets.reduce((s, b) => s + b.revenueBaht, 0);
  const totalCost7d = buckets.reduce((s, b) => s + b.costBaht, 0);

  return NextResponse.json({ buckets, totalRevenue7d, totalCost7d });
}
