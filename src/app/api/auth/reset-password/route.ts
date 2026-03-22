import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.password?.[0] ?? "ข้อมูลไม่ถูกต้อง";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ลองบ่อยเกินไป กรุณารอ" }, { status: 429 });
  }

  const { token, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return NextResponse.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จ" });
}
