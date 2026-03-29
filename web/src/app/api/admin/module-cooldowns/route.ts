import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  listActiveResubscribeCooldowns,
  listAllActiveResubscribeCooldownsForAdmin,
} from "@/lib/modules/subscriptions-store";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const email = new URL(req.url).searchParams.get("email")?.trim();
  if (!email) {
    const entries = await listAllActiveResubscribeCooldownsForAdmin();
    return NextResponse.json({ mode: "all" as const, entries });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true },
  });
  if (!user) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  const rows = await listActiveResubscribeCooldowns(user.id);
  if (rows.length === 0) {
    return NextResponse.json({
      mode: "user" as const,
      user: { id: user.id, email: user.email, username: user.username },
      cooldowns: [] as Array<{ moduleId: string; title: string; slug: string; unlockAtIso: string }>,
    });
  }

  const modules = await prisma.appModule.findMany({
    where: { id: { in: rows.map((r) => r.moduleId) } },
    select: { id: true, title: true, slug: true },
  });
  const map = new Map(modules.map((m) => [m.id, m]));

  return NextResponse.json({
    mode: "user" as const,
    user: { id: user.id, email: user.email, username: user.username },
    cooldowns: rows.map((r) => {
      const mod = map.get(r.moduleId);
      return {
        moduleId: r.moduleId,
        unlockAtIso: r.unlockAtIso,
        title: mod?.title ?? r.moduleId,
        slug: mod?.slug ?? "",
      };
    }),
  });
}
