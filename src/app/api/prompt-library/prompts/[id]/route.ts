import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

const MAX_TAGS_PARTS = 10;

function normalizeTags(raw: string | undefined): string {
  if (!raw || !raw.trim()) return "";
  const parts = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS_PARTS);
  return parts.join(", ");
}

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().min(1).max(20000).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  categoryId: z.string().min(1).max(191).optional().nullable(),
  tags: z.string().max(512).optional(),
  language: z.enum(["th", "en", "mixed"]).optional(),
  modelHint: z.string().trim().max(120).optional().nullable(),
  temperature: z.number().min(0).max(2).optional(),
  isFavorite: z.boolean().optional(),
  changeNote: z.string().trim().max(280).optional().nullable(),
});

async function loadOwned(authUserId: string, id: string) {
  return prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: authUserId },
    include: { category: { select: { id: true, name: true, icon: true, color: true } } },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const item = await loadOwned(auth.userId, id);
  if (!item) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });

  const d = parsed.data;
  if (d.categoryId) {
    const cat = await prisma.promptLibraryCategory.findFirst({
      where: { id: d.categoryId, ownerUserId: auth.userId },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }

  const newContent = d.content !== undefined ? d.content : existing.content;
  const contentChanged = d.content !== undefined && d.content !== existing.content;

  const item = await prisma.$transaction(async (tx) => {
    await tx.promptLibraryPrompt.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.content !== undefined ? { content: d.content } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.categoryId !== undefined ? { categoryId: d.categoryId } : {}),
        ...(d.tags !== undefined ? { tags: normalizeTags(d.tags) } : {}),
        ...(d.language !== undefined ? { language: d.language } : {}),
        ...(d.modelHint !== undefined ? { modelHint: d.modelHint } : {}),
        ...(d.temperature !== undefined ? { temperature: d.temperature } : {}),
        ...(d.isFavorite !== undefined ? { isFavorite: d.isFavorite } : {}),
      },
    });

    if (contentChanged) {
      const agg = await tx.promptLibraryVersion.aggregate({
        where: { promptId: id },
        _max: { versionNo: true },
      });
      const nextNo = (agg._max.versionNo ?? 0) + 1;
      await tx.promptLibraryVersion.create({
        data: {
          promptId: id,
          content: newContent,
          versionNo: nextNo,
          changeNote: d.changeNote ?? null,
          createdById: auth.userId,
        },
      });
    }

    return tx.promptLibraryPrompt.findFirstOrThrow({
      where: { id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const found = await prisma.promptLibraryPrompt.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });
  await prisma.promptLibraryPrompt.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  return NextResponse.json({ ok: true });
}
