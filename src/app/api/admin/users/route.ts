import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";

const createSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(64),
  password: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
  }

  const { email, username, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: role ?? "USER",
      },
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
    return NextResponse.json({ error: "อีเมลหรือชื่อผู้ใช้ซ้ำ" }, { status: 409 });
  }
}
