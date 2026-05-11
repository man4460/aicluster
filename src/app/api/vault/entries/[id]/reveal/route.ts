import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withVaultAuth } from "@/systems/vault/lib/api-auth";
import { decryptVaultPassword } from "@/lib/vault/password-cipher";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** POST = ดูรหัสจริง + บันทึก lastUsedAt (เพื่อใช้จัดเรียง "ใช้ล่าสุด") */
export async function POST(_req: Request, ctx: Ctx) {
  const auth = await withVaultAuth();
  if (!auth.ok) return auth.res;
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const row = await prisma.vaultEntry.findFirst({
    where: { id, ownerUserId: auth.userId },
    select: { id: true, passwordEnc: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const password = decryptVaultPassword(row.passwordEnc);
  if (password === null) {
    return NextResponse.json({ error: "ถอดรหัสไม่สำเร็จ — โปรดติดต่อแอดมิน" }, { status: 500 });
  }

  await prisma.vaultEntry.update({
    where: { id },
    data: { lastUsedAt: new Date() },
  });

  return NextResponse.json({ password });
}
