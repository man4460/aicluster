import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const prompt = await prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!prompt) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });

  const items = await prisma.promptLibraryVersion.findMany({
    where: { promptId: id },
    orderBy: { versionNo: "desc" },
    select: {
      id: true,
      versionNo: true,
      changeNote: true,
      createdAt: true,
      content: true,
    },
  });
  return NextResponse.json({ items });
}
