import { NextResponse } from "next/server";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";
import { createWaitQueueTicket } from "@/systems/wait-queue/lib/wait-queue-ticket-mutations";

export async function POST(req: Request) {
  const ctx = await getWaitQueueOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const rawParty = body?.partySize;
  const partySize =
    typeof rawParty === "number" && Number.isFinite(rawParty)
      ? Math.round(rawParty)
      : typeof rawParty === "string"
        ? parseInt(rawParty, 10)
        : 1;
  if (!Number.isFinite(partySize) || partySize < 1 || partySize > 99) {
    return NextResponse.json({ error: "จำนวนคน 1–99" }, { status: 400 });
  }

  const customerName =
    typeof body?.customerName === "string" ? body.customerName : undefined;
  const note = typeof body?.note === "string" ? body.note : undefined;

  try {
    const ticket = await createWaitQueueTicket({
      siteId: ctx.site.id,
      partySize,
      customerName,
      note,
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticketLabel: formatWaitQueueTicketDisplay(ticket.ticketSeq),
        status: ticket.status,
      },
    });
  } catch (e) {
    if (String(e).includes("SITE_NOT_FOUND")) {
      return NextResponse.json({ error: "ไม่พบจุดบริการ" }, { status: 404 });
    }
    throw e;
  }
}
