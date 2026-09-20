import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { prisma } from "@/lib/prisma";
import { syncStaffAfterGuardChange } from "@/systems/smart-guard-tour/lib/staff-sync";

type Ctx = { params: Promise<{ id: string }> };

function digitsPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 20);
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const id = (await ctx.params).id;

    const existing = await prisma.smartGuardStaff.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const data: {
      displayName?: string;
      phone?: string | null;
      photoUrl?: string | null;
      isActive?: boolean;
      hourlyRateBaht?: number;
      wageBahtPerShift?: number;
    } = {};

    if (typeof body.displayName === "string") {
      const n = body.displayName.trim().slice(0, 200);
      if (n.length < 1) return NextResponse.json({ error: "กรอกชื่อพนักงาน" }, { status: 400 });
      data.displayName = n;
    }
    if (body.phone !== undefined) {
      if (body.phone === null || body.phone === "") {
        data.phone = null;
      } else if (typeof body.phone === "string") {
        const p = digitsPhone(body.phone);
        data.phone = p.length >= 9 ? p : body.phone.trim().slice(0, 32) || null;
      }
    }
    if (body.photoUrl !== undefined) {
      if (body.photoUrl === null) data.photoUrl = null;
      else if (typeof body.photoUrl === "string") {
        data.photoUrl = body.photoUrl.trim().slice(0, 512) || null;
      }
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.hourlyRateBaht === "number" && body.hourlyRateBaht >= 0) {
      data.hourlyRateBaht = Math.min(100000, Math.floor(body.hourlyRateBaht));
    }
    if (typeof body.wageBahtPerShift === "number" && body.wageBahtPerShift >= 0) {
      data.wageBahtPerShift = Math.min(1000000, Math.floor(body.wageBahtPerShift));
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "ไม่มีฟิลด์ที่อัปเดต" }, { status: 400 });
    }

    const row = await prisma.smartGuardStaff.update({
      where: { id },
      data,
    });

    void syncStaffAfterGuardChange({ shopId: shop.id, guardStaffId: row.id });

    return NextResponse.json({
      staff: {
        id: row.id,
        displayName: row.displayName,
        phone: row.phone,
        photoUrl: row.photoUrl,
        isActive: row.isActive,
        workStartHm: row.workStartHm,
        workEndHm: row.workEndHm,
        wageBahtPerShift: row.wageBahtPerShift,
        otBahtPerHour: row.otBahtPerHour,
        hourlyRateBaht: row.hourlyRateBaht,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/staff PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const id = (await ctx.params).id;

    const existing = await prisma.smartGuardStaff.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

    const linked = await prisma.smartGuardAttendanceStaffLink.count({
      where: { guardStaffId: id },
    });
    if (linked > 0 || shop.attendanceLinkEnabled) {
      await prisma.smartGuardStaff.update({
        where: { id },
        data: { isActive: false },
      });
      await syncStaffAfterGuardChange({ shopId: shop.id, guardStaffId: id });
      return NextResponse.json({ ok: true, softDeactivated: true });
    }

    await prisma.smartGuardStaff.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/session/staff DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
