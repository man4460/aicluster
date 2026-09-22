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

function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapRow(row: {
  id: string;
  name: string;
  slug: string;
  zoneLabel: string | null;
  buildingLabel: string | null;
  floorLabel: string | null;
  lat: unknown;
  lng: unknown;
  geofenceRadiusM: number;
  coverImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}) {
  return {
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
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const rows = await prisma.smartGuardCheckpoint.findMany({
      where: { shopId: shop.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ checkpoints: rows.map(mapRow) });
  } catch (e) {
    console.error("[smart-guard-tour/checkpoints GET]", e);
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
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อจุดตรวจ" }, { status: 400 });

    let slug =
      typeof body.slug === "string" && body.slug.trim()
        ? smartGuardTourSlugify(body.slug.trim())
        : smartGuardTourSlugify(name);
    const existingSlug = await prisma.smartGuardCheckpoint.findFirst({
      where: { shopId: shop.id, slug },
      select: { id: true },
    });
    if (existingSlug) slug = `${slug}-${smartGuardTourNewQrToken().slice(4, 10)}`;

    const lat = parseOptionalDecimal(body.lat);
    const lng = parseOptionalDecimal(body.lng);
    const geofence =
      typeof body.geofenceRadiusM === "number" && body.geofenceRadiusM >= 10
        ? Math.min(2000, Math.floor(body.geofenceRadiusM))
        : 80;

    const row = await prisma.smartGuardCheckpoint.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        name,
        slug,
        zoneLabel:
          typeof body.zoneLabel === "string" ? body.zoneLabel.trim().slice(0, 120) || null : null,
        buildingLabel:
          typeof body.buildingLabel === "string"
            ? body.buildingLabel.trim().slice(0, 120) || null
            : null,
        floorLabel:
          typeof body.floorLabel === "string" ? body.floorLabel.trim().slice(0, 60) || null : null,
        lat: lat,
        lng: lng,
        geofenceRadiusM: geofence,
        coverImageUrl:
          typeof body.coverImageUrl === "string" && body.coverImageUrl.startsWith("/uploads/")
            ? body.coverImageUrl.slice(0, 512)
            : null,
        qrToken: smartGuardTourNewQrToken(),
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    });
    return NextResponse.json({ checkpoint: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/checkpoints POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
