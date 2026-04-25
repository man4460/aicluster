import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  })
  .refine((b) => b.title !== undefined || b.status !== undefined, { message: "ต้องส่ง title หรือ status" });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;

  const id = (await ctx.params).id?.trim();
  if (!id) return NextResponse.json({ error: "ไม่พบรหัสแผน" }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors[0] ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const data: { title?: string; status?: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  const result = await prisma.personalAiPlan.updateMany({
    where: { id, userId: guard.user.id },
    data: data as never,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "ไม่พบแผนงานหรือไม่มีสิทธิ์" }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
