import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";

const MAX_LIMIT = 500;

export async function GET(req: Request) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const raw = Number(searchParams.get("limit") ?? "300");
  const limit = Number.isFinite(raw) ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(raw))) : 300;

  const rows = await prisma.personalAiNote.findMany({
    where: { userId: guard.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, content: true, tags: true, createdAt: true },
  });

  const notes = rows.map((r) => {
    const tagsRaw = r.tags;
    const tags = Array.isArray(tagsRaw) ? tagsRaw.filter((t): t is string => typeof t === "string") : [];
    return {
      id: r.id,
      content: r.content,
      tags,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return NextResponse.json(
    { notes },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
