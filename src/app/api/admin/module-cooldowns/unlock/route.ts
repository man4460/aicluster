import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { deleteResubscribeCooldown } from "@/lib/modules/subscriptions-store";

const bodySchema = z.union([
  z.object({
    moduleId: z.string().min(1),
    email: z.string().email(),
  }),
  z.object({
    moduleId: z.string().min(1),
    userId: z.string().min(1),
  }),
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง (ต้องมี moduleId และ email หรือ userId)" }, { status: 400 });
  }

  let userId: string;
  if ("email" in parsed.data) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.trim() },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    userId = user.id;
  } else {
    userId = parsed.data.userId;
  }

  await deleteResubscribeCooldown(userId, parsed.data.moduleId);
  return NextResponse.json({ ok: true });
}
