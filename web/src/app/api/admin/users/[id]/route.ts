import { NextResponse } from "next/server";
import { z } from "zod";
import type { SubscriptionTier } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";
import { bangkokMonthKey } from "@/lib/time/bangkok";

const tierEnum = z.enum([
  "NONE",
  "TIER_199",
  "TIER_299",
  "TIER_399",
  "TIER_499",
  "TIER_599",
]);

const patchSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).max(64).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  subscriptionType: z.enum(["BUFFET", "DAILY"]).optional(),
  subscriptionTier: tierEnum.optional(),
  /** ตั้งยอดโทเคนเป็นค่าที่ระบุ */
  tokens: z.number().int().min(0).max(999_999_999).optional(),
  /** บวก/ลบโทเคน (เติมเป็นบวก) — ใช้แยกจาก tokens ทีละคำขอ */
  tokensAdd: z.number().int().min(-999_999_999).max(999_999_999).optional(),
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

  if (
    parsed.data.tokens !== undefined &&
    parsed.data.tokensAdd !== undefined
  ) {
    return NextResponse.json(
      { error: "ตั้งค่าได้ทีละอย่าง: โทเคนรวม หรือ เติม/หักโทเคน" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, tokens: true, subscriptionTier: true, subscriptionType: true },
  });
  if (!target) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  if (parsed.data.tokensAdd !== undefined) {
    const next = target.tokens + parsed.data.tokensAdd;
    if (next < 0) {
      return NextResponse.json(
        { error: "ยอดโทเคนไม่พอสำหรับการหัก" },
        { status: 400 },
      );
    }
  }

  const data: {
    email?: string;
    username?: string;
    passwordHash?: string;
    role?: "USER" | "ADMIN";
    subscriptionType?: "BUFFET" | "DAILY";
    subscriptionTier?: SubscriptionTier;
    tokens?: number | { increment: number };
    lastBuffetBillingMonth?: string | null;
  } = {};

  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.username !== undefined) data.username = parsed.data.username;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.subscriptionTier !== undefined) {
    data.subscriptionTier = parsed.data.subscriptionTier;
  }
  if (parsed.data.subscriptionType !== undefined) {
    data.subscriptionType = parsed.data.subscriptionType;
  } else if (parsed.data.subscriptionTier !== undefined) {
    data.subscriptionType =
      parsed.data.subscriptionTier === "NONE" ? "DAILY" : "BUFFET";
  }
  if (parsed.data.password !== undefined) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }
  if (parsed.data.tokensAdd !== undefined) {
    data.tokens = { increment: parsed.data.tokensAdd };
  } else if (parsed.data.tokens !== undefined) {
    data.tokens = parsed.data.tokens;
  }

  const subChanged =
    parsed.data.subscriptionTier !== undefined || parsed.data.subscriptionType !== undefined;
  if (subChanged && target) {
    const mergedTier = parsed.data.subscriptionTier ?? target.subscriptionTier;
    let mergedType = parsed.data.subscriptionType ?? target.subscriptionType;
    if (parsed.data.subscriptionTier !== undefined && parsed.data.subscriptionType === undefined) {
      mergedType = mergedTier === "NONE" ? "DAILY" : "BUFFET";
    }
    if (mergedType === "BUFFET" && mergedTier !== "NONE") {
      data.lastBuffetBillingMonth = bangkokMonthKey();
    } else {
      data.lastBuffetBillingMonth = null;
    }
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
        tokens: true,
        subscriptionTier: true,
        subscriptionType: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จหรือข้อมูลซ้ำ" }, { status: 404 });
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
