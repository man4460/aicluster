import { NextResponse } from "next/server";
import { z } from "zod";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  sessionId: z.string().min(1).max(64),
});

/**
 * ดึงข้อความใน session แชท AI (สำหรับ poll รับผลจาก Mavel หลังส่งสลิป)
 */
export async function GET(req: Request) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ sessionId: searchParams.get("sessionId") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องระบุ sessionId" }, { status: 400 });
  }

  const session = await prisma.personalChatSession.findFirst({
    where: { id: parsed.data.sessionId, userId: user.id },
    select: { id: true },
  });
  if (!session) {
    return NextResponse.json({ error: "ไม่พบเซสชัน" }, { status: 404 });
  }

  const messages = await prisma.personalChatMessage.findMany({
    where: { sessionId: session.id, userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return NextResponse.json(
    {
      sessionId: session.id,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );
}
