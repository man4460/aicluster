import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPromptLibraryAuth } from "@/systems/prompt-library/lib/api-context";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  icon: z.string().trim().max(12).optional(),
  color: z.string().trim().max(20).optional(),
  description: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

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

  const found = await prisma.promptLibraryCategory.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });

  const patch = parsed.data;
  const item = await prisma.promptLibraryCategory.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withPromptLibraryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const found = await prisma.promptLibraryCategory.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  await prisma.promptLibraryCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
