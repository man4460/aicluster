import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendPasswordResetEmail } from "@/lib/mail";

const bodySchema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: "กรุณากรอกอีเมลที่ถูกต้อง" }, { status: 400 });
  }

  const { email, turnstileToken } = parsed.data;
  const ip = clientIp(req.headers);
  const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ส่งคำขอบ่อยเกินไป กรุณารอ" }, { status: 429 });
  }

  const humanOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!humanOk) {
    return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const generic = {
    message: "หากอีเมลมีอยู่ในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่าน",
  };

  if (!user) {
    return NextResponse.json(generic);
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  await sendPasswordResetEmail(user.email, token);

  return NextResponse.json(generic);
}
