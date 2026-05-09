import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: z.string().trim().max(12).optional(),
  color: z.string().trim().max(20).optional(),
  description: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  await ensureDefaultPromptCategories(auth.userId);
  const items = await prisma.promptLibraryCategory.findMany({
    where: { ownerUserId: auth.userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
  const maxSort = await prisma.promptLibraryCategory.aggregate({
    where: { ownerUserId: auth.userId },
    _max: { sortOrder: true },
  });
  const sortOrder = d.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 10;
  const item = await prisma.promptLibraryCategory.create({
    data: {
      ownerUserId: auth.userId,
      name: d.name,
      icon: d.icon ?? "📁",
      color: d.color ?? "#64748b",
      description: d.description ?? null,
      sortOrder,
    },
  });
  return NextResponse.json({ item });
}
