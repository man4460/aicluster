import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { normalizeUsedCarYoutubeUrl, mapUsedCarVehicleVideoRow } from "@/systems/used-car-showroom/lib/youtube";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: vehicleId } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await usedCarShowroomSessionContext(own.ownerId);
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const rawUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";
    const normalized = normalizeUsedCarYoutubeUrl(rawUrl);
    if (!normalized) {
      return NextResponse.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
    }
    const maxSort = await prisma.usedCarVehicleVideo.aggregate({
      where: { vehicleId },
      _max: { sortOrder: true },
    });
    const row = await prisma.usedCarVehicleVideo.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        vehicleId,
        youtubeUrl: normalized,
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ video: mapUsedCarVehicleVideoRow(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom videos POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id: vehicleId } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const videoId = new URL(req.url).searchParams.get("videoId")?.trim();
    if (!videoId) return NextResponse.json({ error: "ระบุ videoId" }, { status: 400 });
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const video = await prisma.usedCarVehicleVideo.findFirst({ where: { id: videoId, vehicleId } });
    if (!video) return NextResponse.json({ error: "ไม่พบวิดีโอ" }, { status: 404 });
    await prisma.usedCarVehicleVideo.delete({ where: { id: videoId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom videos DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
