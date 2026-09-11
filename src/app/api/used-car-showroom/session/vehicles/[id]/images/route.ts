import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";

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

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    const isCover = form.get("isCover") === "1" || form.get("isCover") === "true";
    const saved = await saveOwnerModuleUploadImage(file, USED_CAR_SHOWROOM_MODULE_SLUG, "vehicles", own.ownerId);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });

    const maxSort = await prisma.usedCarVehicleImage.aggregate({
      where: { vehicleId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

    const image = await prisma.$transaction(async (tx) => {
      if (isCover) {
        await tx.usedCarVehicleImage.updateMany({
          where: { vehicleId },
          data: { isCover: false },
        });
      }
      const created = await tx.usedCarVehicleImage.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          vehicleId,
          imageUrl: saved.imageUrl,
          isCover: isCover || sortOrder === 0,
          sortOrder,
        },
      });
      if (created.isCover) {
        await tx.usedCarVehicle.update({
          where: { id: vehicleId },
          data: { coverImageUrl: created.imageUrl },
        });
      }
      return created;
    });

    return NextResponse.json({
      image: {
        id: image.id,
        imageUrl: image.imageUrl,
        isCover: image.isCover,
        sortOrder: image.sortOrder,
      },
    }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom images POST]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id: vehicleId } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const body = (await req.json()) as { imageId?: string };
    if (!body.imageId) return NextResponse.json({ error: "ระบุ imageId" }, { status: 400 });
    const image = await prisma.usedCarVehicleImage.findFirst({
      where: { id: body.imageId, vehicleId },
    });
    if (!image) return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });
    await prisma.$transaction([
      prisma.usedCarVehicleImage.updateMany({ where: { vehicleId }, data: { isCover: false } }),
      prisma.usedCarVehicleImage.update({ where: { id: image.id }, data: { isCover: true } }),
      prisma.usedCarVehicle.update({ where: { id: vehicleId }, data: { coverImageUrl: image.imageUrl } }),
    ]);
    return NextResponse.json({ ok: true, coverImageUrl: image.imageUrl });
  } catch (e) {
    console.error("[used-car-showroom images PATCH]", e);
    return NextResponse.json({ error: "ตั้งปกไม่สำเร็จ" }, { status: 500 });
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
    const url = new URL(req.url);
    const imageId = url.searchParams.get("imageId")?.trim();
    if (!imageId) return NextResponse.json({ error: "ระบุ imageId" }, { status: 400 });
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const image = await prisma.usedCarVehicleImage.findFirst({ where: { id: imageId, vehicleId } });
    if (!image) return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });
    await prisma.usedCarVehicleImage.delete({ where: { id: imageId } });
    if (image.isCover) {
      const next = await prisma.usedCarVehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await prisma.usedCarVehicleImage.update({ where: { id: next.id }, data: { isCover: true } });
        await prisma.usedCarVehicle.update({
          where: { id: vehicleId },
          data: { coverImageUrl: next.imageUrl },
        });
      } else {
        await prisma.usedCarVehicle.update({ where: { id: vehicleId }, data: { coverImageUrl: null } });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom images DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
