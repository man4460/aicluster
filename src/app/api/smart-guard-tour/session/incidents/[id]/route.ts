import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = new Set(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const KINDS = new Set(["ISSUE", "SOS_URGENT", "OTHER"]);

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardIncident.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบเหตุการณ์" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim().slice(0, 200);
    if (typeof body.detail === "string") data.detail = body.detail.trim().slice(0, 4000) || null;
    if (typeof body.kind === "string" && KINDS.has(body.kind)) data.kind = body.kind;
    if (typeof body.severity === "string" && SEVERITIES.has(body.severity)) data.severity = body.severity;
    if (typeof body.status === "string" && STATUSES.has(body.status)) {
      data.status = body.status;
      if (body.status === "RESOLVED" || body.status === "CLOSED") {
        data.resolvedAt = new Date();
        if (typeof body.resolvedNote === "string") {
          data.resolvedNote = body.resolvedNote.trim().slice(0, 2000) || null;
        }
      }
    }
    if (typeof body.resolvedNote === "string" && !("status" in body)) {
      data.resolvedNote = body.resolvedNote.trim().slice(0, 2000) || null;
    }
    const row = await prisma.smartGuardIncident.update({
      where: { id },
      data,
      include: {
        checkpoint: { select: { name: true } },
        staff: { select: { displayName: true } },
        contact: { select: { displayName: true } },
        images: { select: { id: true } },
      },
    });
    return NextResponse.json({
      incident: {
        id: row.id,
        title: row.title,
        kind: row.kind,
        status: row.status,
        severity: row.severity,
        detail: row.detail,
        checkpointName: row.checkpoint?.name ?? null,
        staffName: row.staff?.displayName ?? null,
        contactName: row.contact?.displayName ?? null,
        imageCount: row.images.length,
        resolvedNote: row.resolvedNote,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/incidents PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardIncident.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบเหตุการณ์" }, { status: 404 });
    await prisma.smartGuardIncident.update({
      where: { id },
      data: { status: "CLOSED", resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/incidents DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
