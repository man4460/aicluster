import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withVaultAuth } from "@/systems/vault/lib/api-auth";
import { encryptVaultPassword } from "@/lib/vault/password-cipher";

const createSchema = z.object({
  serviceName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(4096),
  websiteUrl: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().max(64).optional().nullable(),
  brandKey: z.string().trim().max(64).optional().nullable(),
  note: z.string().max(8192).optional().nullable(),
  isFavorite: z.boolean().optional(),
});

export async function GET() {
  const auth = await withVaultAuth();
  if (!auth.ok) return auth.res;
  const rows = await prisma.vaultEntry.findMany({
    where: { ownerUserId: auth.userId },
    orderBy: [{ isFavorite: "desc" }, { lastUsedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
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
  return NextResponse.json({ entries: rows });
}

export async function POST(req: Request) {
  const auth = await withVaultAuth();
  if (!auth.ok) return auth.res;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ — กรอกชื่อบริการ ผู้ใช้ และรหัสผ่าน" }, { status: 400 });
  }
  try {
    const passwordEnc = encryptVaultPassword(parsed.data.password);
    const row = await prisma.vaultEntry.create({
      data: {
        ownerUserId: auth.userId,
        serviceName: parsed.data.serviceName,
        username: parsed.data.username,
        passwordEnc,
        websiteUrl: parsed.data.websiteUrl?.trim() || null,
        category: parsed.data.category?.trim() || null,
        brandKey: parsed.data.brandKey?.trim() || null,
        note: parsed.data.note?.trim() || null,
        isFavorite: parsed.data.isFavorite ?? false,
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
    console.error("vault entries POST", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
