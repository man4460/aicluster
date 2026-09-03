import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsCoursePurchase } from "@/systems/lms/lib/purchases";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { scope } = await lmsSessionContext(own.ownerId);
    const rows = await prisma.lmsCoursePurchase.findMany({
      where: lmsOwnerWhere(own.ownerId, scope.trialSessionId),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        learner: { select: { id: true, username: true, fullName: true, status: true } },
        course: { select: { id: true, title: true, coverImageUrl: true, priceBaht: true } },
      },
    });

    return NextResponse.json({ purchases: rows.map(mapLmsCoursePurchase) });
  } catch (e) {
    console.error("[lms/session/purchases GET]", e);
    return NextResponse.json({ error: "โหลดคำขอซื้อไม่สำเร็จ" }, { status: 500 });
  }
}
