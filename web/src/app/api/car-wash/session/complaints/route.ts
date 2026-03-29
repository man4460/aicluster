import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { mapComplaintStatus } from "@/lib/car-wash/http";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  subject: z.string().min(1).max(200),
  details: z.string().min(1).max(2000),
  status: z.enum(["Pending", "In Progress", "Resolved"]),
  photo_url: z.string().max(512).optional().nullable(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const rows = await prisma.carWashComplaint.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    complaints: rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      details: r.details,
      created_at: r.createdAt.toISOString(),
      status: mapComplaintStatus(r.status),
      photo_url: r.photoUrl,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashComplaint.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      subject: parsed.data.subject.trim(),
      details: parsed.data.details.trim(),
      status: parsed.data.status,
      photoUrl: parsed.data.photo_url?.trim() ?? "",
    },
  });
  return NextResponse.json({
    complaint: {
      id: row.id,
      subject: row.subject,
      details: row.details,
      created_at: row.createdAt.toISOString(),
      status: mapComplaintStatus(row.status),
      photo_url: row.photoUrl,
    },
  });
}
