import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import type { MassageBookingStatus } from "@/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["ARRIVED", "IN_SERVICE", "COMPLETED", "NO_SHOW", "CANCELLED"]),
});

const ALLOWED: Record<MassageBookingStatus, MassageBookingStatus[]> = {
  SCHEDULED: ["ARRIVED", "NO_SHOW", "CANCELLED"],
  ARRIVED: ["IN_SERVICE", "NO_SHOW", "CANCELLED"],
  IN_SERVICE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.massageBooking.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const next = parsed.data.status;
  const allowed = ALLOWED[existing.status] ?? [];
  if (!allowed.includes(next)) {
    return NextResponse.json(
      { error: `ไม่สามารถเปลี่ยนจาก ${existing.status} เป็น ${next} ได้` },
      { status: 400 },
    );
  }

  const row = await prisma.massageBooking.update({
    where: { id },
    data: { status: next },
  });

  return NextResponse.json({
    booking: {
      id: row.id,
      phone: row.phone,
      customerName: row.customerName,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      massageCustomerId: row.massageCustomerId,
    },
  });
}
