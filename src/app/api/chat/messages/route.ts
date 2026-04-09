import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonServerError } from "@/lib/api-server-error-response";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
import { canAccessChatThread } from "@/lib/chat/thread-policy";

const postSchema = z.object({
  threadId: z.string().min(1),
  content: z.string().min(1).max(2000),
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

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const u = await loadUserForChat(auth.session.sub);
    if (!u) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (!computeDashboardAccessAllowed(u)) {
      return NextResponse.json({ error: "โทเคนไม่พอหรือยังไม่ครบงวดแพ็กเกจ — กรุณาเติมโทเคน" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    if (!threadId) {
      return NextResponse.json({ error: "ระบุ threadId" }, { status: 400 });
    }

    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { id: true, authorId: true, roomKind: true },
    });
    if (!thread) return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });

    if (!canAccessChatThread({ id: u.id, role: u.role }, thread)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ดูกระทู้นี้" }, { status: 403 });
    }

    const after = searchParams.get("after");

    let list;
    if (after) {
      list = await prisma.chatMessage.findMany({
        where: { threadId, createdAt: { gt: new Date(after) } },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, fullName: true },
          },
        },
      });
    } else {
      list = await prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, fullName: true },
          },
        },
      });
      list.reverse();
    }

    return NextResponse.json({
      messages: list.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        user: {
          id: m.user.id,
          username: m.user.username,
          displayName: m.user.fullName || m.user.username,
          avatarUrl: m.user.avatarUrl,
        },
      })),
    });
  } catch (e) {
    console.error("[api/chat/messages GET]", e);
    return NextResponse.json(
      {
        error:
          "เซิร์ฟเวอร์ผิดพลาด — ตรวจสอบ prisma migrate / generate และตาราง ChatThread",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const u = await loadUserForChat(auth.session.sub);
    if (!u) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (!computeDashboardAccessAllowed(u)) {
      return NextResponse.json({ error: "โทเคนไม่พอหรือยังไม่ครบงวดแพ็กเกจ — กรุณาเติมโทเคน" }, { status: 403 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อความไม่ถูกต้อง" }, { status: 400 });
    }

    const thread = await prisma.chatThread.findUnique({
      where: { id: parsed.data.threadId },
      select: { id: true, authorId: true, roomKind: true },
    });
    if (!thread) return NextResponse.json({ error: "ไม่พบกระทู้" }, { status: 404 });

    if (!canAccessChatThread({ id: u.id, role: u.role }, thread)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์โพสต์ในกระทู้นี้" }, { status: 403 });
    }

    const msg = await prisma.$transaction(async (tx) => {
      const m = await tx.chatMessage.create({
        data: {
          threadId: thread.id,
          userId: u.id,
          content: parsed.data.content.trim(),
        },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true, fullName: true },
          },
        },
      });
      await tx.chatThread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() },
      });
      return m;
    });

    return NextResponse.json({
      message: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        user: {
          id: msg.user.id,
          username: msg.user.username,
          displayName: msg.user.fullName || msg.user.username,
          avatarUrl: msg.user.avatarUrl,
        },
      },
    });
  } catch (e) {
    return jsonServerError("[api/chat/messages POST]", e);
  }
}
