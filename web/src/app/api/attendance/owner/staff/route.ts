import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const postSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(64),
  password: z.string().min(8).max(128),
  fullName: z.string().max(255).optional().nullable(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: { employerUserId: ctx.billingUserId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const passwordHash = await hashPassword(parsed.data.password);
  const name = parsed.data.fullName?.trim() || null;

  try {
    const u = await prisma.user.create({
      data: {
        email: parsed.data.email,
        username: parsed.data.username,
        passwordHash,
        role: "USER",
        tokens: 0,
        subscriptionType: "DAILY",
        subscriptionTier: "NONE",
        employerUserId: ctx.billingUserId,
        fullName: name,
        lastDeductionDate: null,
      },
      select: { id: true, email: true, username: true, fullName: true, createdAt: true },
    });
    return NextResponse.json({ staff: u });
  } catch {
    return NextResponse.json({ error: "อีเมลหรือชื่อผู้ใช้ซ้ำ" }, { status: 409 });
  }
}
