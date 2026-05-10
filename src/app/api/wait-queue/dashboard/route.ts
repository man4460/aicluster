import { NextResponse } from "next/server";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";
import { loadWaitQueueDashboardPayload } from "@/systems/wait-queue/lib/load-dashboard";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";

function serializeTicket(t: {
  id: string;
  dateKey: string;
  ticketSeq: number;
  ticketLabel: string;
  partySize: number;
  customerName: string | null;
  note: string | null;
  status: string;
  calledAt: Date | null;
  seatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
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

export async function GET() {
  const ctx = await getWaitQueueOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const payload = await loadWaitQueueDashboardPayload(ctx.site.id);
  const currentCalled = payload.currentCalled ? serializeTicket(payload.currentCalled) : null;

  return NextResponse.json({
    site: {
      id: ctx.site.id,
      name: ctx.site.name,
      callMessage: ctx.site.callMessage,
    },
    dateKey: payload.dateKey,
    tickets: payload.tickets.map(serializeTicket),
    currentCalled,
    stats: payload.stats,
  });
}
