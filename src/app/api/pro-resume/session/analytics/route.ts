import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokWeekStartKey, last30BangkokDateKeys } from "@/systems/pro-resume/lib/helpers";
import { bangkokDateKey } from "@/lib/time/bangkok";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile } = await proResumeSessionContext(own.ownerId);
    const weekStart = bangkokWeekStartKey();
    const todayKey = bangkokDateKey();
    const dayKeys = last30BangkokDateKeys();
    const rangeStart = dayKeys[0] < weekStart ? dayKeys[0] : weekStart;

    const views = await prisma.resumeViewAnalytics.findMany({
      where: {
        profileId: profile.id,
        portfolioItemId: null,
        viewedAt: {
          gte: new Date(`${rangeStart}T00:00:00+07:00`),
        },
      },
      select: { viewedAt: true },
    });

    const viewsThisWeek = views.filter((v) => {
      const k = v.viewedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      return k >= weekStart;
    }).length;

    const viewsByDay = dayKeys.map((dateKey) => ({
      dateKey,
      count: views.filter((v) => {
        const k = v.viewedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
        return k === dateKey;
      }).length,
    }));

    const topItems = await prisma.resumePortfolioItem.findMany({
      where: { profileId: profile.id },
      orderBy: [{ clickCount: "desc" }, { updatedAt: "desc" }],
      take: 5,
      select: { id: true, title: true, clickCount: true, coverImage: true },
    });

    return NextResponse.json({
      viewsThisWeek,
      weekStart,
      todayKey,
      viewsByDay,
      topPortfolioItems: topItems,
      isPremium: profile.isPremium,
    });
  } catch (e) {
    console.error("[pro-resume/session/analytics GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
