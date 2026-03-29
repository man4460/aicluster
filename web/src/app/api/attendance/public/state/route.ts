import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import { getOwnerShiftWindowsOrdered } from "@/lib/attendance/owner-shift-slots";
import { latestTodayGuestLog, openTodayGuestLog } from "@/lib/attendance/service";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { resolvePublicAttendanceTrialSessionId } from "@/lib/attendance/public-trial-scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(9).max(32),
  trialSessionId: z.string().max(36).optional().nullable(),
});

function dto(
  row: {
    id: number;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    status: string;
    lateCheckIn: boolean;
    earlyCheckOut: boolean;
    guestPhone: string | null;
    guestName: string | null;
    publicVisitorKind: string | null;
    checkInLat: number | null;
    checkInLng: number | null;
    checkInFacePhotoUrl: string | null;
    appliedShiftIndex?: number | null;
    note: string | null;
  },
  windows: { label: string }[],
) {
  const idx = row.appliedShiftIndex ?? null;
  return {
    id: row.id,
    checkInTime: row.checkInTime?.toISOString() ?? null,
    checkOutTime: row.checkOutTime?.toISOString() ?? null,
    status: row.status,
    lateCheckIn: row.lateCheckIn,
    earlyCheckOut: row.earlyCheckOut,
    guestPhone: row.guestPhone,
    guestName: row.guestName,
    publicVisitorKind: row.publicVisitorKind,
    checkInLat: row.checkInLat,
    checkInLng: row.checkInLng,
    checkInFacePhotoUrl: row.checkInFacePhotoUrl,
    appliedShiftIndex: idx,
    appliedShiftLabel:
      idx != null && idx >= 0 && idx < windows.length ? windows[idx]?.label ?? null : null,
    note: row.note,
  };
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-state:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const open = await isAttendancePublicOpenForOwner(parsed.data.ownerId);
  if (!open) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  const { trialSessionId } = await resolvePublicAttendanceTrialSessionId(
    parsed.data.ownerId,
    parsed.data.trialSessionId,
  );

  try {
    const windows = await getOwnerShiftWindowsOrdered(parsed.data.ownerId, trialSessionId);

    const [o, l] = await Promise.all([
      openTodayGuestLog(parsed.data.ownerId, parsed.data.phone, trialSessionId),
      latestTodayGuestLog(parsed.data.ownerId, parsed.data.phone, trialSessionId),
    ]);

    return NextResponse.json({
      openLog: o ? dto(o, windows) : null,
      todayLatest: l ? dto(l, windows) : null,
      syncWarning: null as string | null,
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance public/state] schema mismatch", e);
      return NextResponse.json({
        openLog: null,
        todayLatest: null,
        syncWarning: PRISMA_SYNC_HINT_TH,
      });
    }
    throw e;
  }
}
