import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDormitoryStaff } from "@/lib/dormitory/staff-auth";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
  roomBillingUiStatus,
} from "@/systems/dormitory/lib/compute";

export async function GET(req: Request) {
  const auth = await requireDormitoryStaff(req);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const rooms = await prisma.room.findMany({
    where: { ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    include: {
      tenants: true,
      utilityBills: { include: { payments: true } },
    },
  });

  const allLines = rooms.flatMap((r) => computeAllBalanceLines(buildRoomComputeInput(r)));
  const overdue = overdueLines(allLines);
  const overdueRoomIds = new Set(overdue.map((o) => o.roomId));
  const vacantCount = rooms.filter((r) => r.tenants.every((t) => t.status !== "ACTIVE")).length;

  const roomsForGrid = rooms.map((r) => {
    const input = buildRoomComputeInput(r);
    const billing = roomBillingUiStatus(input);
    const activeN = r.tenants.filter((t) => t.status === "ACTIVE").length;
    const occ = activeN === 0 ? "ว่าง" : activeN >= r.maxOccupants ? "เต็ม" : `พัก ${activeN}/${r.maxOccupants}`;
    return {
      id: r.id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      basePrice: r.basePrice,
      occupancyLabel: occ,
      billingStatus: billing,
      showOverdueDot: overdueRoomIds.has(String(r.id)),
    };
  });

  const manageRows = rooms.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    floor: r.floor,
    roomType: r.roomType,
    basePrice: Number(r.basePrice),
    maxOccupants: r.maxOccupants,
    activeTenants: r.tenants.filter((t) => t.status === "ACTIVE").length,
    billingStatus: roomBillingUiStatus(buildRoomComputeInput(r)),
  }));

  const overdueRows = overdue.map((row) => ({
    roomId: String(row.roomId),
    roomNumber: row.roomNumber,
    tenantId: String(row.tenantId),
    tenantName: row.tenantName,
    month: row.month,
    balance: row.balance,
  }));

  return NextResponse.json({
    stats: {
      roomCount: rooms.length,
      occupiedCount: rooms.length - vacantCount,
      vacantCount,
      overdueCount: overdue.length,
      overdueTotalBaht: overdue.reduce((s, o) => s + o.balance, 0),
    },
    rooms: roomsForGrid,
    manageRows,
    overdueRows,
  });
}
