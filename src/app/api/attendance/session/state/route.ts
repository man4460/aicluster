import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getOwnerShiftWindowsOrdered } from "@/lib/attendance/owner-shift-slots";
import { latestTodayUserLog, openTodayUserLog } from "@/lib/attendance/service";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";

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
  actor: { fullName: string | null; username: string; email: string } | null,
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
    actorFullName: actor?.fullName ?? null,
    actorUsername: actor?.username ?? null,
    actorEmail: actor?.email ?? null,
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const windows = await getOwnerShiftWindowsOrdered(ctx.billingUserId);

    const [open, latest] = await Promise.all([
      openTodayUserLog(ctx.billingUserId, ctx.actorUserId),
      latestTodayUserLog(ctx.billingUserId, ctx.actorUserId),
    ]);
    function latestDto(l: typeof latest) {
      if (!l) return null;
      const idx = l.appliedShiftIndex ?? null;
      return {
        id: l.id,
        checkInTime: l.checkInTime?.toISOString() ?? null,
        checkOutTime: l.checkOutTime?.toISOString() ?? null,
        status: l.status,
        lateCheckIn: l.lateCheckIn,
        earlyCheckOut: l.earlyCheckOut,
        appliedShiftIndex: idx,
        appliedShiftLabel:
          idx != null && idx >= 0 && idx < windows.length ? windows[idx]?.label ?? null : null,
      };
    }

    return NextResponse.json({
      openLog: open ? dto(open, open.actor, windows) : null,
      todayLatest: latestDto(latest),
      syncWarning: null as string | null,
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance session/state] schema mismatch", e);
      return NextResponse.json({
        openLog: null,
        todayLatest: null,
        syncWarning: PRISMA_SYNC_HINT_TH,
      });
    }
    throw e;
  }
}
