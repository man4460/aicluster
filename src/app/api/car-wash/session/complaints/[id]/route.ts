import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { mapComplaintStatus } from "@/lib/car-wash/http";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  details: z.string().min(1).max(2000).optional(),
  status: z.enum(["Pending", "In Progress", "Resolved"]).optional(),
  photo_url: z.string().max(512).optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const p = await ctx.params;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashComplaint.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const updated = await prisma.carWashComplaint.update({
    where: { id: row.id },
    data: {
      ...(parsed.data.subject != null ? { subject: parsed.data.subject.trim() } : {}),
      ...(parsed.data.details != null ? { details: parsed.data.details.trim() } : {}),
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
      ...(parsed.data.photo_url !== undefined ? { photoUrl: parsed.data.photo_url?.trim() ?? "" } : {}),
    },
  });
  return NextResponse.json({
    complaint: {
      id: updated.id,
      subject: updated.subject,
      details: updated.details,
      created_at: updated.createdAt.toISOString(),
      status: mapComplaintStatus(updated.status),
      photo_url: updated.photoUrl,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const p = await ctx.params;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashComplaint.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ ok: false });
  await prisma.carWashComplaint.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
