import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";

export const dynamic = "force-dynamic";

const ItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().min(1).max(20000),
  description: z.string().trim().max(500).optional().nullable(),
  categoryName: z.string().trim().max(100).optional().nullable(),
  tags: z.string().max(512).optional(),
  language: z.enum(["th", "en", "mixed"]).optional(),
  modelHint: z.string().trim().max(120).optional().nullable(),
  temperature: z.number().min(0).max(2).optional(),
  isFavorite: z.boolean().optional(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(500),
});

export async function POST(req: Request) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  await ensureDefaultPromptCategories(auth.userId);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const cats = await prisma.promptLibraryCategory.findMany({
    where: { ownerUserId: auth.userId },
    select: { id: true, name: true },
  });
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const it of parsed.data.items) {
      let categoryId: string | null = null;
      if (it.categoryName?.trim()) {
        const key = it.categoryName.trim().toLowerCase();
        const cid = catByName.get(key);
        if (cid) categoryId = cid;
      }
      const p = await tx.promptLibraryPrompt.create({
        data: {
          ownerUserId: auth.userId,
          title: it.title,
          content: it.content,
          description: it.description ?? null,
          categoryId,
          tags: it.tags?.trim() ?? "",
          language: it.language ?? "th",
          modelHint: it.modelHint ?? null,
          temperature: it.temperature ?? 0.7,
          isFavorite: it.isFavorite ?? false,
        },
      });
      await tx.promptLibraryVersion.create({
        data: {
          promptId: p.id,
          content: p.content,
          versionNo: 1,
          changeNote: "นำเข้า",
          createdById: auth.userId,
        },
      });
      created += 1;
    }
  });

  return NextResponse.json({ ok: true, created });
}
