import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireAttendanceDeviceAuth } from "@/lib/attendance/device-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/attendance/device/fingerprint
 * ผูก fingerprintSlot (จากเซ็นเซอร์ ESP32) กับ rosterId
 *
 * { "rosterId": 12, "fingerprintSlot": 3 }
 * { "rosterId": 12, "fingerprintSlot": null }  // ลบการผูก
 */
const bodySchema = z.object({
  rosterId: z.number().int().positive(),
  fingerprintSlot: z.union([z.number().int().min(1).max(1000), z.null()]),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-device-fp:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  const auth = await requireAttendanceDeviceAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "ต้องส่ง JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { ownerUserId, trialSessionId } = auth.auth;
  const { rosterId, fingerprintSlot } = parsed.data;

  const entry = await prisma.attendanceRosterEntry.findFirst({
    where: { id: rosterId, ownerUserId, trialSessionId },
  });
  if (!entry) return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });

  if (fingerprintSlot != null) {
    const clash = await prisma.attendanceRosterEntry.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        fingerprintSlot,
        NOT: { id: rosterId },
      },
      select: { id: true, displayName: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `slot ${fingerprintSlot} ถูกใช้โดย ${clash.displayName} แล้ว` },
        { status: 409 },
      );
    }
  }

  const row = await prisma.attendanceRosterEntry.update({
    where: { id: rosterId },
    data: {
      fingerprintSlot,
      fingerprintEnrolledAt: fingerprintSlot == null ? null : new Date(),
    },
    select: {
      id: true,
      displayName: true,
      phone: true,
      fingerprintSlot: true,
      fingerprintEnrolledAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    entry: {
      rosterId: row.id,
      displayName: row.displayName,
      phone: row.phone,
      fingerprintSlot: row.fingerprintSlot,
      fingerprintEnrolledAt: row.fingerprintEnrolledAt?.toISOString() ?? null,
    },
  });
}
