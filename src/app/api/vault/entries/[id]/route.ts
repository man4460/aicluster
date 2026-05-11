import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withVaultAuth } from "@/systems/vault/lib/api-auth";
import { encryptVaultPassword } from "@/lib/vault/password-cipher";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const patchSchema = z.object({
  serviceName: z.string().trim().min(1).max(120).optional(),
  username: z.string().trim().min(1).max(255).optional(),
  password: z.string().min(1).max(4096).optional(),
  websiteUrl: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().max(64).nullable().optional(),
  brandKey: z.string().trim().max(64).nullable().optional(),
  note: z.string().max(8192).nullable().optional(),
  isFavorite: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withVaultAuth();
  if (!auth.ok) return auth.res;

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const existing = await prisma.vaultEntry.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.vaultEntry.update({
      where: { id },
      data: {
        ...(parsed.data.serviceName !== undefined ? { serviceName: parsed.data.serviceName } : {}),
        ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
        ...(parsed.data.password !== undefined
          ? { passwordEnc: encryptVaultPassword(parsed.data.password) }
          : {}),
        ...(parsed.data.websiteUrl !== undefined
          ? { websiteUrl: parsed.data.websiteUrl?.trim() || null }
          : {}),
        ...(parsed.data.category !== undefined
          ? { category: parsed.data.category?.trim() || null }
          : {}),
        ...(parsed.data.brandKey !== undefined
          ? { brandKey: parsed.data.brandKey?.trim() || null }
          : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
        ...(parsed.data.isFavorite !== undefined ? { isFavorite: parsed.data.isFavorite } : {}),
      },
      select: {
        id: true,
        serviceName: true,
        username: true,
        websiteUrl: true,
        category: true,
        brandKey: true,
        note: true,
        isFavorite: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ entry: row });
  } catch (e) {
    console.error("vault entries PATCH", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await withVaultAuth();
  if (!auth.ok) return auth.res;
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const existing = await prisma.vaultEntry.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  await prisma.vaultEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
