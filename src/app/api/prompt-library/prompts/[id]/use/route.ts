import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

/** นับการใช้งาน (เทียบ `prompt.use` ใน Prompt Master) */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const found = await prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: auth.userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });

  const item = await prisma.promptLibraryPrompt.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
    include: { category: { select: { id: true, name: true, icon: true, color: true } } },
  });
  return NextResponse.json({ item });
}
