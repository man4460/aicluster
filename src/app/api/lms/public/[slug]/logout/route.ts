import { NextResponse } from "next/server";
import { clearLmsLearnerSessionCookie } from "@/lib/lms/learner-session";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, _ctx: Ctx) {
  try {
    await clearLmsLearnerSessionCookie(req);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lms/public/[slug]/logout POST]", e);
    return NextResponse.json({ error: "ออกจากระบบไม่สำเร็จ" }, { status: 500 });
  }
}
