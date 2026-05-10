import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";
import { skipStaleCalledTickets } from "@/systems/wait-queue/lib/wait-queue-ticket-mutations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await getWaitQueueOwnerContext();
  if (!owner) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";

  const ticket = await prisma.waitQueueTicket.findFirst({
    where: { id, siteId: owner.site.id },
  });
  if (!ticket) {
    return NextResponse.json({ error: "ไม่พบบัตรคิว" }, { status: 404 });
  }

  const dateKey = bangkokDateKey();
  if (ticket.dateKey !== dateKey) {
    return NextResponse.json({ error: "บัตรคิวไม่ใช่วันนี้" }, { status: 400 });
  }

  let updated;

  if (action === "call") {
    if (ticket.status !== "WAITING") {
      return NextResponse.json({ error: "เรียกได้เฉพาะคิวที่กำลังรอ" }, { status: 400 });
    }
    updated = await prisma.$transaction(async (tx) => {
      await skipStaleCalledTickets(tx, owner.site.id, dateKey);
      return tx.waitQueueTicket.update({
        where: { id: ticket.id },
        data: { status: "CALLED", calledAt: new Date() },
      });
    });
  } else if (action === "seat") {
    if (ticket.status !== "CALLED") {
      return NextResponse.json({ error: "ยืนยันเข้าร้านได้เมื่อเรียกคิวแล้วเท่านั้น" }, { status: 400 });
    }
    updated = await prisma.waitQueueTicket.update({
      where: { id: ticket.id },
      data: { status: "SEATED", seatedAt: new Date() },
    });
  } else if (action === "skip") {
    if (ticket.status !== "CALLED") {
      return NextResponse.json({ error: "ข้ามได้เมื่ออยู่ในสถานะเรียกแล้ว" }, { status: 400 });
    }
    updated = await prisma.waitQueueTicket.update({
      where: { id: ticket.id },
      data: { status: "SKIPPED" },
    });
  } else if (action === "cancel") {
    if (ticket.status !== "WAITING" && ticket.status !== "CALLED") {
      return NextResponse.json({ error: "ยกเลิกได้เฉพาะคิวที่รอหรือถูกเรียก" }, { status: 400 });
    }
    updated = await prisma.waitQueueTicket.update({
      where: { id: ticket.id },
      data: { status: "CANCELLED" },
    });
  } else {
    return NextResponse.json({ error: "ระบุ action: call | seat | skip | cancel" }, { status: 400 });
  }

  return NextResponse.json({
    ticket: {
      id: updated.id,
      ticketLabel: formatWaitQueueTicketDisplay(updated.ticketSeq),
      status: updated.status,
      calledAt: updated.calledAt?.toISOString() ?? null,
      seatedAt: updated.seatedAt?.toISOString() ?? null,
    },
  });
}
