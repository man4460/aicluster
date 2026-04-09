import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonServerError } from "@/lib/api-server-error-response";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
import { canModerateChatThread } from "@/lib/chat/thread-policy";

const patchSchema = z.object({
  title: z.string().min(1).max(280),
});

async function loadUserForChat(sub: string) {
  return prisma.user.findUnique({
    where: { id: sub },
    select: {
      id: true,
      role: true,
      tokens: true,
      subscriptionType: true,
      subscriptionTier: true,
      lastBuffetBillingMonth: true,
    },
  });
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "ระบุกระทู้" }, { status: 400 });

    const u = await loadUserForChat(auth.session.sub);
    if (!u) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (!computeDashboardAccessAllowed(u)) {
      return NextResponse.json({ error: "โทเคนไม่พอหรือยังไม่ครบงวดแพ็กเกจ — กรุณาเติมโทเคน" }, { status: 403 });
    }
    if (!canModerateChatThread(u)) {
      return NextResponse.json({ error: "เฉพาะแอดมินเท่านั้น" }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const title = parsed.data.title.trim();
    if (!title) {
      return NextResponse.json({ error: "กรุณาใส่หัวข้อ" }, { status: 400 });
    }

    const existing = await prisma.chatThread.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });

    const thread = await prisma.chatThread.update({
      where: { id },
      data: { title },
      select: {
        id: true,
        title: true,
        roomKind: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        title: thread.title,
        roomKind: thread.roomKind,
        updatedAt: thread.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonServerError("[api/chat/threads/[id] PATCH]", e);
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "ระบุกระทู้" }, { status: 400 });

    const u = await loadUserForChat(auth.session.sub);
    if (!u) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (!computeDashboardAccessAllowed(u)) {
      return NextResponse.json({ error: "โทเคนไม่พอหรือยังไม่ครบงวดแพ็กเกจ — กรุณาเติมโทเคน" }, { status: 403 });
    }
    if (!canModerateChatThread(u)) {
      return NextResponse.json({ error: "เฉพาะแอดมินเท่านั้น" }, { status: 403 });
    }

    const existing = await prisma.chatThread.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });

    await prisma.chatThread.delete({ where: { id } });

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    return jsonServerError("[api/chat/threads/[id] DELETE]", e);
  }
}
