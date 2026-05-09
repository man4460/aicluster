import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";

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

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().min(1).max(20000),
  description: z.string().trim().max(500).optional().nullable(),
  categoryId: z.string().min(1).max(191).optional().nullable(),
  tags: z.string().max(512).optional(),
  language: z.enum(["th", "en", "mixed"]).optional(),
  modelHint: z.string().trim().max(120).optional().nullable(),
  temperature: z.number().min(0).max(2).optional(),
  isFavorite: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  await ensureDefaultPromptCategories(auth.userId);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const categoryId = searchParams.get("categoryId") || undefined;
  const favoriteOnly = searchParams.get("favorite") === "1";
  const includeArchived = searchParams.get("archived") === "1";

  const where: Prisma.PromptLibraryPromptWhereInput = {
    ownerUserId: auth.userId,
    ...(includeArchived ? {} : { status: "ACTIVE" }),
    ...(categoryId ? { categoryId } : {}),
    ...(favoriteOnly ? { isFavorite: true } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
            { content: { contains: q } },
          ],
        }
      : {}),
  };

  const items = await prisma.promptLibraryPrompt.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.categoryId) {
    const cat = await prisma.promptLibraryCategory.findFirst({
      where: { id: d.categoryId, ownerUserId: auth.userId },
      select: { id: true },
    });
    if (!cat) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
    }
  }

  const item = await prisma.$transaction(async (tx) => {
    const p = await tx.promptLibraryPrompt.create({
      data: {
        ownerUserId: auth.userId,
        title: d.title,
        content: d.content,
        description: d.description ?? null,
        categoryId: d.categoryId ?? null,
        tags: normalizeTags(d.tags),
        language: d.language ?? "th",
        modelHint: d.modelHint ?? null,
        temperature: d.temperature ?? 0.7,
        isFavorite: d.isFavorite ?? false,
      },
    });
    await tx.promptLibraryVersion.create({
      data: {
        promptId: p.id,
        content: p.content,
        versionNo: 1,
        changeNote: null,
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
