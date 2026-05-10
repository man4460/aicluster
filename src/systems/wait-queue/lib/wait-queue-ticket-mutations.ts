import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";

export async function skipStaleCalledTickets(tx: Prisma.TransactionClient, siteId: string, dateKey: string) {
  await tx.waitQueueTicket.updateMany({
    where: { siteId, dateKey, status: "CALLED" },
    data: { status: "SKIPPED" },
  });
}

export async function createWaitQueueTicket(params: {
  siteId: string;
  partySize: number;
  customerName?: string | null;
  note?: string | null;
}) {
  const { siteId, partySize, customerName, note } = params;
  const dateKey = bangkokDateKey();

  return prisma.$transaction(async (tx) => {
    const site = await tx.waitQueueSite.findUnique({ where: { id: siteId } });
    if (!site) throw new Error("SITE_NOT_FOUND");

    const agg = await tx.waitQueueTicket.aggregate({
      where: { siteId, dateKey },
      _max: { ticketSeq: true },
    });
    const nextSeq = (agg._max.ticketSeq ?? 0) + 1;
    const ticketLabel = formatWaitQueueTicketDisplay(nextSeq);

    return tx.waitQueueTicket.create({
      data: {
        siteId,
        dateKey,
        ticketSeq: nextSeq,
        ticketLabel,
        partySize,
        customerName: customerName?.trim() ? customerName.trim().slice(0, 120) : null,
        note: note?.trim() ? note.trim().slice(0, 500) : null,
      },
    });
  });
}
