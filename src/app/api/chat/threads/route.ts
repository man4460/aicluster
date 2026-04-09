import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonServerError } from "@/lib/api-server-error-response";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";
const postSchema = z.object({
  roomKind: z.enum(["COMMUNITY", "ADMIN_SUPPORT"]),
  title: z.string().min(1).max(280).optional(),
});

const ADMIN_SUPPORT_DEFAULT_TITLE = "ติดต่อผู้ดูแลระบบ";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const u = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: {
        id: true,
        role: true,
        tokens: true,
        subscriptionType: true,
        subscriptionTier: true,
        lastBuffetBillingMonth: true,
      },
    });
    if (!u) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (!computeDashboardAccessAllowed(u)) {
      return NextResponse.json({ error: "โทเคนไม่พอหรือยังไม่ครบงวดแพ็กเกจ — กรุณาเติมโทเคน" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roomKind = searchParams.get("roomKind");
    if (roomKind !== "COMMUNITY" && roomKind !== "ADMIN_SUPPORT") {
      return NextResponse.json({ error: "ระบุ roomKind=COMMUNITY หรือ ADMIN_SUPPORT" }, { status: 400 });
    }

    const scopeAll = searchParams.get("scope") === "all" && u.role === "ADMIN";

    let threads;
    if (roomKind === "COMMUNITY") {
      threads = await prisma.chatThread.findMany({
        where: { roomKind: "COMMUNITY" },
        orderBy: { updatedAt: "desc" },
        take: 80,
        include: {
          author: { select: { id: true, username: true, fullName: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true, content: true },
          },
        },
      });
    } else if (scopeAll) {
      threads = await prisma.chatThread.findMany({
        where: { roomKind: "ADMIN_SUPPORT" },
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: {
          author: { select: { id: true, username: true, fullName: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true, content: true },
          },
        },
      });
    } else {
      threads = await prisma.chatThread.findMany({
        where: { roomKind: "ADMIN_SUPPORT", authorId: u.id },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: {
          author: { select: { id: true, username: true, fullName: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true, content: true },
          },
        },
      });
    }

    return NextResponse.json({
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        roomKind: t.roomKind,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        author: {
          id: t.author.id,
          username: t.author.username,
          displayName: t.author.fullName || t.author.username,
        },
        lastMessagePreview: t.messages[0]?.content?.slice(0, 120) ?? null,
        lastMessageAt: t.messages[0]?.createdAt.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("[api/chat/threads GET]", e);
    return NextResponse.json(
      {
        error:
          "เซิร์ฟเวอร์ผิดพลาด — ตรวจสอบว่ารัน prisma migrate deploy แล้ว และ prisma generate (ปิด dev server ก่อน generate)",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const u = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: {
        id: true,
        role: true,
        tokens: true,
        subscriptionType: true,
        subscriptionTier: true,
        lastBuffetBillingMonth: true,
      },
    });
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
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { roomKind, title } = parsed.data;

    if (roomKind === "ADMIN_SUPPORT") {
      const existing = await prisma.chatThread.findFirst({
        where: { roomKind: "ADMIN_SUPPORT", authorId: u.id },
        orderBy: { createdAt: "asc" },
      });
      if (existing) {
        return NextResponse.json({
          thread: {
            id: existing.id,
            title: existing.title,
            roomKind: existing.roomKind,
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
            reused: true as const,
          },
        });
      }
      const thread = await prisma.chatThread.create({
        data: {
          title: ADMIN_SUPPORT_DEFAULT_TITLE,
          authorId: u.id,
          roomKind: "ADMIN_SUPPORT",
        },
      });
      return NextResponse.json({
        thread: {
          id: thread.id,
          title: thread.title,
          roomKind: thread.roomKind,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
          reused: false as const,
        },
      });
    }

    const t = (title ?? "").trim();
    if (!t) {
      return NextResponse.json({ error: "กรุณาใส่หัวข้อกระทู้" }, { status: 400 });
    }

    const thread = await prisma.chatThread.create({
      data: {
        title: t,
        authorId: u.id,
        roomKind: "COMMUNITY",
      },
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        title: thread.title,
        roomKind: thread.roomKind,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    return jsonServerError("[api/chat/threads POST]", e);
  }
}
