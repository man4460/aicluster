import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { prisma } from "@/lib/prisma";
import { syncStaffAfterGuardChange } from "@/systems/smart-guard-tour/lib/staff-sync";

function digitsPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 20);
}

export type SmartGuardStaffDto = {
  id: string;
  displayName: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  workStartHm: string | null;
  workEndHm: string | null;
  wageBahtPerShift: number;
  otBahtPerHour: number;
};

function mapStaff(row: {
  id: string;
  displayName: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  workStartHm: string | null;
  workEndHm: string | null;
  wageBahtPerShift: number;
  otBahtPerHour: number;
}): SmartGuardStaffDto {
  return {
    id: row.id,
    displayName: row.displayName,
    phone: row.phone,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
    workStartHm: row.workStartHm,
    workEndHm: row.workEndHm,
    wageBahtPerShift: row.wageBahtPerShift,
    otBahtPerHour: row.otBahtPerHour,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);

    const rows = await prisma.smartGuardStaff.findMany({
      where: { shopId: shop.id },
      orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    });
    return NextResponse.json({
      staff: rows.map(mapStaff),
      attendanceLinkEnabled: shop.attendanceLinkEnabled,
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/staff GET]", e);
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
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 200) : "";
    if (displayName.length < 1) {
      return NextResponse.json({ error: "กรอกชื่อพนักงาน" }, { status: 400 });
    }
    const phoneRaw = typeof body.phone === "string" ? body.phone : "";
    const phone = digitsPhone(phoneRaw);
    const phoneVal = phone.length >= 9 ? phone : phoneRaw.trim().slice(0, 32) || null;
    const photoUrl =
      body.photoUrl === null
        ? null
        : typeof body.photoUrl === "string"
          ? body.photoUrl.trim().slice(0, 512) || null
          : null;
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    const row = await prisma.smartGuardStaff.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        displayName,
        phone: phoneVal,
        photoUrl,
        isActive,
      },
    });

    void syncStaffAfterGuardChange({ shopId: shop.id, guardStaffId: row.id });

    return NextResponse.json({ staff: mapStaff(row) });
  } catch (e) {
    console.error("[smart-guard-tour/session/staff POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
