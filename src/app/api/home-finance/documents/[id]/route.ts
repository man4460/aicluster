import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { isAllowedHomeFinanceUploadPath } from "@/lib/home-finance/attachments";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  fileUrl: z
    .string()
    .max(512)
    .refine((s) => isAllowedHomeFinanceUploadPath(s), "เส้นทางไฟล์ไม่ถูกต้อง")
    .optional(),
  mimeType: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(600).optional().nullable(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function resolveCategory(
  billingUserId: string,
  categoryId: number | null | undefined,
  categoryLabel: string | null | undefined,
  hasCategoryId: boolean,
  hasCategoryLabel: boolean,
): Promise<{ categoryId?: number | null; category?: string | null } | { error: string }> {
  if (hasCategoryId) {
    if (categoryId == null) {
      return { categoryId: null, category: hasCategoryLabel ? categoryLabel?.trim() || null : null };
    }
    const cat = await prisma.homeFinanceDocumentCategory.findFirst({
      where: { id: categoryId, ownerUserId: billingUserId },
    });
    if (!cat) return { error: "ไม่พบหมวดที่เลือก" };
    return { categoryId: cat.id, category: cat.name };
  }
  if (hasCategoryLabel) {
    return { category: categoryLabel?.trim() || null };
  }
  return {};
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeFinancePersonalDocument.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const resolved = await resolveCategory(
    mod.billingUserId,
    parsed.data.categoryId,
    parsed.data.category,
    parsed.data.categoryId !== undefined,
    parsed.data.category !== undefined,
  );
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

  try {
    const row = await prisma.homeFinancePersonalDocument.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...resolved,
        ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl } : {}),
        ...(parsed.data.mimeType !== undefined ? { mimeType: parsed.data.mimeType?.trim() || null } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      },
    });
    return NextResponse.json({
      item: {
        id: row.id,
        title: row.title,
        category: row.category,
        categoryId: row.categoryId,
        fileUrl: row.fileUrl,
        mimeType: row.mimeType,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("home-finance/documents PATCH", e);
    return NextResponse.json({ error: "แก้ไขเอกสารไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeFinancePersonalDocument.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.homeFinancePersonalDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
