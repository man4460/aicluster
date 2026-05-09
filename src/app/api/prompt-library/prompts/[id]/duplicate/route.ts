import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const src = await prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: auth.userId, status: "ACTIVE" },
  });
  if (!src) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });

  const title = src.title.startsWith("สำเนา: ") ? src.title : `สำเนา: ${src.title}`;

  const item = await prisma.$transaction(async (tx) => {
    const p = await tx.promptLibraryPrompt.create({
      data: {
        ownerUserId: auth.userId,
        title: title.slice(0, 200),
        content: src.content,
        description: src.description,
        categoryId: src.categoryId,
        tags: src.tags,
        language: src.language,
        modelHint: src.modelHint,
        temperature: src.temperature,
        isFavorite: false,
        usageCount: 0,
      },
    });
    await tx.promptLibraryVersion.create({
      data: {
        promptId: p.id,
        content: p.content,
        versionNo: 1,
        changeNote: `คัดลอกจาก ${src.id}`,
        createdById: auth.userId,
      },
    });
    return tx.promptLibraryPrompt.findFirstOrThrow({
      where: { id: p.id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  });

  return NextResponse.json({ item });
}
