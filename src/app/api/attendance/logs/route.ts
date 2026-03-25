import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { bangkokDayRangeFromDateKey } from "@/lib/barber/booking-datetime";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fromKey = searchParams.get("from")?.trim();
  const toKey = searchParams.get("to")?.trim();
  const q = searchParams.get("q")?.trim() ?? "";
  const kind = searchParams.get("kind")?.trim() ?? "";

  const fromR = fromKey ? bangkokDayRangeFromDateKey(fromKey) : null;
  const toR = toKey ? bangkokDayRangeFromDateKey(toKey) : null;
  if ((fromKey && !fromR) || (toKey && !toR)) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const start = fromR?.start ?? new Date(Date.now() - 7 * 86400000);
  const end = toR?.end ?? new Date(Date.now() + 86400000);

  const whereBase = {
    ownerUserId: ctx.billingUserId,
    checkInTime: { gte: start, lt: end },
  } as const;

  const searchFilter =
    q.length > 0
      ? {
          OR: [
            { guestPhone: { contains: q } },
            { guestName: { contains: q } },
            {
              actor: {
                OR: [{ username: { contains: q } }, { fullName: { contains: q } }],
              },
            },
          ],
        }
      : {};

  const kindFilter =
    kind === "platform"
      ? { actorUserId: { not: null } }
      : kind === "roster_staff"
        ? { publicVisitorKind: "ROSTER_STAFF" as const }
        : kind === "external"
          ? { publicVisitorKind: "EXTERNAL_GUEST" as const }
          : kind === "public_legacy"
            ? {
                actorUserId: null,
                guestPhone: { not: null },
                publicVisitorKind: null,
              }
            : {};

  let rows;
  try {
    rows = await prisma.attendanceLog.findMany({
      where: { ...whereBase, ...searchFilter, ...kindFilter },
      orderBy: { checkInTime: "desc" },
      take: 500,
      include: {
        actor: { select: { id: true, username: true, fullName: true } },
      },
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance logs GET] schema mismatch", e);
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH, logs: [] }, { status: 503 });
    }
    throw e;
  }

  return NextResponse.json({
    logs: rows.map((r) => ({
      id: r.id,
      guestPhone: r.guestPhone,
      guestName: r.guestName,
      publicVisitorKind: r.publicVisitorKind,
      actorUsername: r.actor?.username ?? null,
      actorFullName: r.actor?.fullName ?? null,
      checkInTime: r.checkInTime?.toISOString() ?? null,
      checkOutTime: r.checkOutTime?.toISOString() ?? null,
      status: r.status,
      lateCheckIn: r.lateCheckIn,
      earlyCheckOut: r.earlyCheckOut,
      checkInFacePhotoUrl: r.checkInFacePhotoUrl,
    })),
  });
}
