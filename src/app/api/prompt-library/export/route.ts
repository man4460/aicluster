import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

/** ส่งออก JSON ทั้งหมด (เทียบ `prompt.exportAll`) */
export async function GET() {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;

  const rows = await prisma.promptLibraryPrompt.findMany({
    where: { ownerUserId: auth.userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: { category: { select: { id: true, name: true } } },
  });

  const exportedAt = new Date().toISOString();
  const items = rows.map((r) => ({
    title: r.title,
    content: r.content,
    description: r.description,
    categoryName: r.category?.name ?? null,
    tags: r.tags,
    language: r.language,
    modelHint: r.modelHint,
    temperature: r.temperature,
    isFavorite: r.isFavorite,
    usageCount: r.usageCount,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return NextResponse.json(
    { meta: { app: "mawell-prompt-library", version: 1, exportedAt }, items },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
