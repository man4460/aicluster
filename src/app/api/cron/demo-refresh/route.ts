import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { runDemoRefreshForOwners } from "@/lib/trial/run-demo-refresh";

/**
 * รีเฟรชข้อมูลตัวอย่างบัญชีทดลองทุกโมดูล (รวมโรงแรม) ตามวันปฏิทินไทย
 * เรียกจาก cron — ตั้ง CRON_SECRET แล้วส่ง
 *   Authorization: Bearer <CRON_SECRET> หรือ ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 8) {
    return NextResponse.json(
      { error: "CRON_SECRET ยังไม่ตั้งค่าในเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const url = new URL(req.url);
  const q = url.searchParams.get("secret");
  if (bearer !== secret && q !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateKey = bangkokDateKey();
  try {
    const result = await runDemoRefreshForOwners(prisma);
    const failed = result.owners.flatMap((o) => o.lines.filter((l) => !l.ok));
    if (!result.barberPortalMedia.ok) failed.push(result.barberPortalMedia);

    return NextResponse.json({
      ok: failed.length === 0,
      dateKey,
      owners: result.owners.map((o) => ({
        email: o.email,
        ok: o.lines.filter((l) => l.ok).length,
        fail: o.lines.filter((l) => !l.ok).length,
      })),
      failures: failed.length
        ? failed.map((f) => ({ label: f.label, error: f.error }))
        : undefined,
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("[cron/demo-refresh]", e);
    return NextResponse.json({ error: "รีเฟรชข้อมูลทดลองไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
