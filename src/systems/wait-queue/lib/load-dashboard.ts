import type { WaitQueueSite, WaitQueueTicket } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureDefaultWaitQueueSite } from "@/systems/wait-queue/lib/ensure-site";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";

export async function loadWaitQueueSiteForOwner(ownerUserId: string, trialSessionId: string) {
  return ensureDefaultWaitQueueSite(ownerUserId, trialSessionId);
}

export async function loadWaitQueueDashboardPayload(siteId: string, dateKey = bangkokDateKey()) {
  const tickets = await prisma.waitQueueTicket.findMany({
    where: { siteId, dateKey },
    orderBy: { ticketSeq: "asc" },
  });
  const currentCalled = tickets.find((t) => t.status === "CALLED") ?? null;
  const stats = {
    waiting: tickets.filter((t) => t.status === "WAITING").length,
    called: tickets.filter((t) => t.status === "CALLED").length,
    seated: tickets.filter((t) => t.status === "SEATED").length,
    cancelled: tickets.filter((t) => t.status === "CANCELLED").length,
    skipped: tickets.filter((t) => t.status === "SKIPPED").length,
  };
  return { dateKey, tickets, currentCalled, stats };
}

export function mapWaitQueueTicketToDto(t: WaitQueueTicket) {
  return {
    id: t.id,
    dateKey: t.dateKey,
    ticketSeq: t.ticketSeq,
    ticketLabel: formatWaitQueueTicketDisplay(t.ticketSeq),
    partySize: t.partySize,
    customerName: t.customerName,
    note: t.note,
    status: t.status,
    calledAt: t.calledAt?.toISOString() ?? null,
    seatedAt: t.seatedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function buildWaitQueueDashboardDto(
  site: Pick<WaitQueueSite, "id" | "name" | "callMessage">,
  payload: Awaited<ReturnType<typeof loadWaitQueueDashboardPayload>>,
) {
  return {
    site: { id: site.id, name: site.name, callMessage: site.callMessage },
    dateKey: payload.dateKey,
    tickets: payload.tickets.map(mapWaitQueueTicketToDto),
    currentCalled: payload.currentCalled ? mapWaitQueueTicketToDto(payload.currentCalled) : null,
    stats: payload.stats,
  };
}

export type WaitQueueDashboardDto = ReturnType<typeof buildWaitQueueDashboardDto>;
