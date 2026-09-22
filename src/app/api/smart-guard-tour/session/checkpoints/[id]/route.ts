import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import {
  parseOptionalDecimal,
  smartGuardTourNewQrToken,
  smartGuardTourSlugify,
} from "@/systems/smart-guard-tour/lib/ids";

type Ctx = { params: Promise<{ id: string }> };

function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardCheckpoint.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบจุดตรวจ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 200);
    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = smartGuardTourSlugify(body.slug.trim());
      const clash = await prisma.smartGuardCheckpoint.findFirst({
        where: { shopId: shop.id, slug, NOT: { id } },
        select: { id: true },
      });
      data.slug = clash ? `${slug}-${smartGuardTourNewQrToken().slice(4, 10)}` : slug;
    }
    if (typeof body.zoneLabel === "string") data.zoneLabel = body.zoneLabel.trim().slice(0, 120) || null;
    if (typeof body.buildingLabel === "string")
      data.buildingLabel = body.buildingLabel.trim().slice(0, 120) || null;
    if (typeof body.floorLabel === "string") data.floorLabel = body.floorLabel.trim().slice(0, 60) || null;
    if ("lat" in body) data.lat = parseOptionalDecimal(body.lat);
    if ("lng" in body) data.lng = parseOptionalDecimal(body.lng);
    if (typeof body.geofenceRadiusM === "number" && body.geofenceRadiusM >= 10) {
      data.geofenceRadiusM = Math.min(2000, Math.floor(body.geofenceRadiusM));
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.coverImageUrl === "string") {
      data.coverImageUrl = body.coverImageUrl.startsWith("/uploads/")
        ? body.coverImageUrl.slice(0, 512)
        : null;
    }
    if (body.regenerateQr === true) data.qrToken = smartGuardTourNewQrToken();

    const row = await prisma.smartGuardCheckpoint.update({ where: { id }, data });
    return NextResponse.json({
      checkpoint: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        zoneLabel: row.zoneLabel,
        buildingLabel: row.buildingLabel,
        floorLabel: row.floorLabel,
        lat: toNum(row.lat),
        lng: toNum(row.lng),
        geofenceRadiusM: row.geofenceRadiusM,
        coverImageUrl: row.coverImageUrl,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/checkpoints PATCH]", e);
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
    const existing = await prisma.smartGuardCheckpoint.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบจุดตรวจ" }, { status: 404 });
    await prisma.smartGuardCheckpoint.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/checkpoints DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
