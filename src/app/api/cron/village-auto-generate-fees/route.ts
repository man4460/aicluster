import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import { generateVillageFeeRowsForScope } from "@/lib/village/generate-fee-rows";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";

/**
 * สร้างบิลค่าส่วนกลางเดือนปัจจุบัน (เวลาไทย) สำหรับโปรไฟล์ที่เปิด autoGenerateFees
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

  const yearMonth = bangkokMonthKey();

  try {
    const profiles = await prisma.villageProfile.findMany({
      where: { autoGenerateFees: true },
      select: { ownerUserId: true, trialSessionId: true, id: true },
    });

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: { profileId: number; error: string }[] = [];

    for (const p of profiles) {
      try {
        const r = await generateVillageFeeRowsForScope({
          ownerUserId: p.ownerUserId,
          trialSessionId: p.trialSessionId,
          yearMonth,
        });
        totalCreated += r.created;
        totalUpdated += r.updated;
        totalSkipped += r.skipped;
      } catch (e) {
        console.error("[village-auto-generate-fees] profile", p.id, e);
        errors.push({
          profileId: p.id,
          error: e instanceof Error ? e.message : "failed",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      yearMonth,
      profiles: profiles.length,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("[village-auto-generate-fees]", e);
    return NextResponse.json({ error: "สร้างบิลอัตโนมัติไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
