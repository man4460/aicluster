import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, signSessionToken } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { applyBuffetMonthlyBilling } from "@/lib/tokens/buffet-monthly-billing";
import { applyDailyTokenDeduction } from "@/lib/tokens/daily-deduction";
import { authRouteErrorResponse } from "@/lib/auth/route-error-response";

const bodySchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
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
    return NextResponse.json({ error: "กรอกอีเมล/ชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
  }

  const { identifier, password, turnstileToken } = parsed.data;
  const ip = clientIp(req.headers);
  const rl = rateLimit(`login:${ip}:${identifier.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const humanOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!humanOk) {
    return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว ลองใหม่อีกครั้ง" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "บัญชีนี้เชื่อมกับ Google — กรุณาเข้าสู่ระบบด้วย Google" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "อีเมล/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    await applyDailyTokenDeduction(user.id);
    await applyBuffetMonthlyBilling(user.id);
    const fresh = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tokens: true },
    });

    const token = await signSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    await setSessionCookie(token, req);
    return NextResponse.json({
      ok: true,
      user: {
        username: user.username,
        role: user.role,
        tokens: fresh?.tokens ?? user.tokens,
      },
    });
  } catch (err) {
    return authRouteErrorResponse(err, "api/auth/login");
  }
}
