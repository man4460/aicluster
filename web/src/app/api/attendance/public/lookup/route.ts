import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import { resolvePublicAttendanceTrialSessionId } from "@/lib/attendance/public-trial-scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(9).max(32),
  trialSessionId: z.string().max(36).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-lookup:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const portalOk = await isAttendancePublicOpenForOwner(parsed.data.ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  const { trialSessionId } = await resolvePublicAttendanceTrialSessionId(
    parsed.data.ownerId,
    parsed.data.trialSessionId,
  );

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) return NextResponse.json({ displayName: null });

  const row = await prisma.attendanceRosterEntry.findFirst({
    where: {
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      phone,
      isActive: true,
    },
    select: { displayName: true },
  });

  return NextResponse.json({
    displayName: row?.displayName?.trim() ?? null,
  });
}
