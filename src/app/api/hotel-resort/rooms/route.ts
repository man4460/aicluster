import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext, withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortDefaultBuilding } from "@/systems/hotel-resort/lib/ensure-building";
import { ensureHotelResortRoomCatalog } from "@/systems/hotel-resort/lib/ensure-catalog";
import {
  hotelResortRoomDetailPatchData,
  mapHotelResortRoomDetails,
} from "@/systems/hotel-resort/lib/room-detail-fields";
import {
  hotelResortAsOfInputValue,
  hotelResortBookingOverdueBlocking,
  hotelResortDisplayRoomStatus,
  hotelResortFollowingBooking,
  hotelResortNeedsCloseKind,
  hotelResortNextDayBooking,
  hotelResortNextUpcomingBooking,
  hotelResortOccupancyClock,
  hotelResortParseAsOfDate,
  hotelResortPickBookingForRoomDay,
  type HotelResortOccupancyBooking,
} from "@/systems/hotel-resort/lib/room-occupancy";

export async function GET(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  await ensureHotelResortDefaultBuilding(prisma, ownerUserId);
  await ensureHotelResortRoomCatalog(prisma, ownerUserId);

  const url = new URL(req.url);
  const asOf = hotelResortParseAsOfDate(url.searchParams.get("asOf"));
  const asOfKey = hotelResortAsOfInputValue(asOf);
  const clock = hotelResortOccupancyClock(asOf);

  const [rooms, activeBookings, profile] = await Promise.all([
    prisma.hotelResortRoom.findMany({
      where: { ownerUserId },
      include: {
        roomType: { select: { name: true, basePriceBaht: true } },
        building: { select: { id: true, name: true, code: true, sortOrder: true } },
      },
      orderBy: [
        { building: { sortOrder: "asc" } },
        { floor: "asc" },
        { sortOrder: "asc" },
        { roomNumber: "asc" },
      ],
    }),
    prisma.hotelResortBooking.findMany({
      where: { ownerUserId, status: { in: ["RESERVED", "CHECKED_IN"] }, roomId: { not: null } },
      select: {
        id: true,
        roomId: true,
        guestName: true,
        guestPhone: true,
        status: true,
        checkInAt: true,
        checkOutAt: true,
      },
    }),
    prisma.hotelResortProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId,
          trialSessionId: auth.ctx.trialSessionId,
        },
      },
      select: { checkInTime: true, checkOutTime: true },
    }),
  ]);

  const checkInTimeHm = profile?.checkInTime?.trim() || "14:00";
  const checkOutTimeHm = profile?.checkOutTime?.trim() || "12:00";
  const pickOpts = { clock, checkOutTimeHm, checkInTimeHm };

  const bookings: HotelResortOccupancyBooking[] = activeBookings
    .filter((b): b is typeof b & { roomId: string } => Boolean(b.roomId))
    .map((b) => ({
      id: b.id,
      roomId: b.roomId,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      status: b.status as "RESERVED" | "CHECKED_IN",
      checkInAt: b.checkInAt,
      checkOutAt: b.checkOutAt,
    }));

  return NextResponse.json({
    asOf: asOfKey,
    rooms: rooms.map((r) => {
      const b = hotelResortPickBookingForRoomDay(bookings, r.id, asOf, pickOpts);
      const needsClose = b
        ? hotelResortBookingOverdueBlocking(b, asOf, {
            clock,
            checkOutTimeHm,
            checkInTimeHm,
          })
        : false;
      const needsCloseKind = needsClose ? hotelResortNeedsCloseKind(b?.status) : null;
      /** ผู้จองถัดไปที่ต้องเช็คอินต่อ (วันนี้หรือหลังจากนี้) */
      const following = hotelResortFollowingBooking(bookings, r.id, asOf, b?.id);
      const nextDay =
        following ?? hotelResortNextDayBooking(bookings, r.id, asOf, b?.id);
      const upcoming =
        nextDay ?? (b ? null : hotelResortNextUpcomingBooking(bookings, r.id, asOf));
      const displayStatus = hotelResortDisplayRoomStatus(r.status, b);
      const nextDayLabel = nextDay
        ? `${nextDay.guestName} · ${nextDay.guestPhone}`
        : null;
      const upcomingLabel =
        !nextDay && upcoming
          ? `จอง ${upcoming.checkInAt.toLocaleDateString("th-TH")} · ${upcoming.guestName}`
          : null;
      const asOfStart = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate()).getTime();
      const nextInToday =
        nextDay != null &&
        new Date(
          nextDay.checkInAt.getFullYear(),
          nextDay.checkInAt.getMonth(),
          nextDay.checkInAt.getDate(),
        ).getTime() === asOfStart;

      return {
        id: r.id,
        roomNumber: r.roomNumber,
        floor: r.floor,
        status: displayStatus,
        storedStatus: r.status,
        note: r.note,
        sortOrder: r.sortOrder,
        buildingId: r.buildingId,
        buildingName: r.building.name,
        buildingCode: r.building.code,
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomType.name,
        basePriceBaht: r.roomType.basePriceBaht,
        guestLabel: b ? `${b.guestName} · ${b.guestPhone}` : null,
        bookingId: b?.id ?? null,
        bookingStatus: b?.status ?? null,
        checkInAt: b ? b.checkInAt.toISOString() : null,
        checkOutAt: b ? b.checkOutAt.toISOString() : null,
        needsClose,
        needsCloseKind,
        nextDayGuestLabel: nextDayLabel,
        nextDayBookingId: nextDay?.id ?? null,
        nextDayCheckInAt: nextDay ? nextDay.checkInAt.toISOString() : null,
        nextDayIsContinuous: Boolean(b && nextDay),
        nextDayIsToday: nextInToday,
        upcomingLabel,
        upcomingBookingId: !nextDay && upcoming ? upcoming.id : null,
        asOf: asOfKey,
        displayStatus,
        ...mapHotelResortRoomDetails(r),
      };
    }),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: {
    roomNumber?: string;
    floor?: number;
    roomTypeId?: string;
    buildingId?: string;
    status?: string;
    note?: string;
    sortOrder?: number;
    bedType?: string | null;
    roomSizeSqm?: number | null;
    viewType?: string | null;
    amenities?: string[] | null;
    imageUrls?: string[] | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const roomNumber = body.roomNumber?.trim();
  const roomTypeId = body.roomTypeId?.trim();
  if (!roomNumber || !roomTypeId) {
    return NextResponse.json({ error: "กรอกเลขห้องและประเภทห้อง" }, { status: 400 });
  }

  const typeOk = await prisma.hotelResortRoomType.findFirst({
    where: { id: roomTypeId, ownerUserId },
    select: { id: true },
  });
  if (!typeOk) return NextResponse.json({ error: "ไม่พบประเภทห้อง" }, { status: 400 });

  let buildingId = body.buildingId?.trim() || "";
  if (buildingId) {
    const buildingOk = await prisma.hotelResortBuilding.findFirst({
      where: { id: buildingId, ownerUserId },
      select: { id: true },
    });
    if (!buildingOk) return NextResponse.json({ error: "ไม่พบอาคาร" }, { status: 400 });
  } else {
    const fallback = await ensureHotelResortDefaultBuilding(prisma, ownerUserId);
    buildingId = fallback.id;
  }

  const details = hotelResortRoomDetailPatchData(body);

  try {
    const row = await prisma.hotelResortRoom.create({
      data: {
        ownerUserId,
        buildingId,
        roomNumber,
        floor: Number.isFinite(body.floor) ? Math.max(0, Math.floor(body.floor!)) : 1,
        roomTypeId,
        status: body.status === "MAINTENANCE" ? "MAINTENANCE" : "VACANT",
        note: body.note?.trim() || null,
        sortOrder: Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder!) : 0,
        ...details,
      },
    });
    return NextResponse.json({ room: row });
  } catch {
    return NextResponse.json({ error: "เลขห้องซ้ำในอาคารนี้ หรือบันทึกไม่สำเร็จ" }, { status: 400 });
  }
}
