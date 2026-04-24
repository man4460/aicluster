import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;

  const id = (await ctx.params).id?.trim();
  if (!id) return NextResponse.json({ error: "ไม่พบรหัสโน้ต" }, { status: 400 });

  const result = await prisma.personalAiNote.deleteMany({
    where: { id, userId: guard.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "ไม่พบโน้ตหรือไม่มีสิทธิ์ลบ" }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
