import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";

const patchSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).max(64).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const data: {
    email?: string;
    username?: string;
    passwordHash?: string;
    role?: "USER" | "ADMIN";
  } = {};

  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.username !== undefined) data.username = parsed.data.username;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.password !== undefined) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "ไม่พบผู้ใช้หรือข้อมูลซ้ำ" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }

  const { id } = await ctx.params;

  if (id === auth.session.sub) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }
}
