import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { bangkokDayRangeFromDateKey } from "@/lib/barber/booking-datetime";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

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

  const start = fromR?.start ?? new Date(Date.now() - 31 * 86400000);
  const end = toR?.end ?? new Date(Date.now() + 86400000);

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

  const rows = await prisma.attendanceLog.findMany({
    where: {
      ownerUserId: ctx.billingUserId,
      trialSessionId: scope.trialSessionId,
      checkInTime: { gte: start, lt: end },
      ...searchFilter,
      ...kindFilter,
    },
    orderBy: { checkInTime: "asc" },
    take: 5000,
    include: {
      actor: { select: { username: true, fullName: true } },
    },
  });

  const header = [
    "id",
    "visitor_kind",
    "guest_phone",
    "guest_name",
    "staff_username",
    "staff_full_name",
    "check_in",
    "check_out",
    "status",
    "late_in",
    "early_out",
    "check_in_face_photo_url",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.publicVisitorKind ?? (r.actorUserId ? "PLATFORM_APP" : r.guestPhone ? "LEGACY_PUBLIC" : ""),
      r.guestPhone ?? "",
      r.guestName ?? "",
      r.actor?.username ?? "",
      r.actor?.fullName ?? "",
      r.checkInTime?.toISOString() ?? "",
      r.checkOutTime?.toISOString() ?? "",
      r.status,
      r.lateCheckIn ? "1" : "0",
      r.earlyCheckOut ? "1" : "0",
      r.checkInFacePhotoUrl ?? "",
    ]
      .map((c) => csvEscape(String(c)))
      .join(","),
  );

  const bom = "\uFEFF";
  const body = bom + header.join(",") + "\n" + lines.join("\n") + "\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-export.csv"`,
    },
  });
}
