import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";
import { skipStaleCalledTickets } from "@/systems/wait-queue/lib/wait-queue-ticket-mutations";

export async function POST() {
  const ctx = await getWaitQueueOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const dateKey = bangkokDateKey();

  const next = await prisma.$transaction(async (tx) => {
    const waiting = await tx.waitQueueTicket.findFirst({
      where: { siteId: ctx.site.id, dateKey, status: "WAITING" },
      orderBy: { ticketSeq: "asc" },
    });
    if (!waiting) return null;

    await skipStaleCalledTickets(tx, ctx.site.id, dateKey);

    return tx.waitQueueTicket.update({
      where: { id: waiting.id },
      data: {
        status: "CALLED",
        calledAt: new Date(),
      },
    });
  });

  if (!next) {
    return NextResponse.json({ error: "ไม่มีคิวที่รออยู่" }, { status: 400 });
  }

  return NextResponse.json({
    ticket: {
      id: next.id,
      ticketLabel: formatWaitQueueTicketDisplay(next.ticketSeq),
      status: next.status,
      calledAt: next.calledAt?.toISOString() ?? null,
    },
  });
}
