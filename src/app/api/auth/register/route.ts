import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const bodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(64),
  password: z.string().min(8),
  turnstileToken: z.string().optional(),
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
    return NextResponse.json(
      { error: "กรอกอีเมล ชื่อผู้ใช้ และรหัสผ่าน (อย่างน้อย 8 ตัว) ให้ครบ" },
      { status: 400 },
    );
  }

  const { email, username, password, turnstileToken } = parsed.data;
  const ip = clientIp(req.headers);
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "สมัครบ่อยเกินไป กรุณารอ" }, { status: 429 });
  }

  const humanOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!humanOk) {
    return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว ลองใหม่อีกครั้ง" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "USER",
      },
    });
  } catch {
    return NextResponse.json({ error: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  let token: string;
  try {
    token = await signSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ error: "การตั้งค่าเซิร์ฟเวอร์ไม่สมบูรณ์" }, { status: 500 });
  }

  await setSessionCookie(token);
  return NextResponse.json({
    ok: true,
    user: { username: user.username, role: user.role },
  });
}
