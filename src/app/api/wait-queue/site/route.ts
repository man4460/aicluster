import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";

export async function PATCH(req: Request) {
  const ctx = await getWaitQueueOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const callMessage = typeof body?.callMessage === "string" ? body.callMessage.trim() : "";

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "ระบุชื่อจุดบริการ (ไม่เกิน 120 ตัว)" }, { status: 400 });
  }
  if (!callMessage || callMessage.length > 200) {
    return NextResponse.json({ error: "ระบุข้อความเรียกคิว (ไม่เกิน 200 ตัว)" }, { status: 400 });
  }

  const site = await prisma.waitQueueSite.update({
    where: { id: ctx.site.id },
    data: { name, callMessage },
  });

  return NextResponse.json({
    site: {
      id: site.id,
      name: site.name,
      callMessage: site.callMessage,
    },
  });
}
