import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

const KINDS = new Set(["ISSUE", "SOS_URGENT", "OTHER"]);
const SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function mapRow(row: {
  id: string;
  title: string;
  kind: string;
  status: string;
  severity: string;
  detail: string | null;
  checkpoint: { name: string } | null;
  staff: { displayName: string } | null;
  contact: { displayName: string } | null;
  images: { id: string }[];
  resolvedNote: string | null;
  createdAt: Date;
}) {
  return {
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
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const rows = await prisma.smartGuardIncident.findMany({
      where: { shopId: shop.id },
      include: {
        checkpoint: { select: { name: true } },
        staff: { select: { displayName: true } },
        contact: { select: { displayName: true } },
        images: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ incidents: rows.map(mapRow) });
  } catch (e) {
    console.error("[smart-guard-tour/incidents GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!title) return NextResponse.json({ error: "กรอกหัวข้อเหตุการณ์" }, { status: 400 });
    const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : "ISSUE";
    const severity =
      typeof body.severity === "string" && SEVERITIES.has(body.severity) ? body.severity : "MEDIUM";
    const checkpointId =
      typeof body.checkpointId === "string" && body.checkpointId.trim()
        ? body.checkpointId.trim()
        : null;
    const staffId =
      typeof body.staffId === "string" && body.staffId.trim() ? body.staffId.trim() : null;
    const contactId =
      typeof body.contactId === "string" && body.contactId.trim() ? body.contactId.trim() : null;

    if (checkpointId) {
      const ok = await prisma.smartGuardCheckpoint.findFirst({
        where: { id: checkpointId, shopId: shop.id },
        select: { id: true },
      });
      if (!ok) return NextResponse.json({ error: "จุดตรวจไม่ถูกต้อง" }, { status: 400 });
    }
    if (staffId) {
      const ok = await prisma.smartGuardStaff.findFirst({
        where: { id: staffId, shopId: shop.id },
        select: { id: true },
      });
      if (!ok) return NextResponse.json({ error: "พนักงานไม่ถูกต้อง" }, { status: 400 });
    }
    if (contactId) {
      const ok = await prisma.smartGuardContact.findFirst({
        where: { id: contactId, shopId: shop.id },
        select: { id: true },
      });
      if (!ok) return NextResponse.json({ error: "ผู้ติดต่อไม่ถูกต้อง" }, { status: 400 });
    }

    const row = await prisma.smartGuardIncident.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        title,
        kind,
        severity,
        status: "PENDING",
        detail: typeof body.detail === "string" ? body.detail.trim().slice(0, 4000) || null : null,
        checkpointId,
        staffId,
        contactId,
      },
      include: {
        checkpoint: { select: { name: true } },
        staff: { select: { displayName: true } },
        contact: { select: { displayName: true } },
        images: { select: { id: true } },
      },
    });
    return NextResponse.json({ incident: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/incidents POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
