import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { computeDashboardAccessAllowed } from "@/lib/tokens/dashboard-access";

const postSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      tokens: true,
      role: true,
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
  const after = searchParams.get("after");

  let list;
  if (after) {
    list = await prisma.chatMessage.findMany({
      where: { createdAt: { gt: new Date(after) } },
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
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      tokens: true,
      role: true,
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
    return NextResponse.json({ error: "ข้อความไม่ถูกต้อง" }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      userId: auth.session.sub,
      content: parsed.data.content.trim(),
    },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true, fullName: true },
      },
    },
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
}
