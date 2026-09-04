import { NextResponse } from "next/server";
import { loadProResumePublicPortal } from "@/lib/pro-resume/load-public-portal";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const data = await loadProResumePublicPortal(slug, trialParam);
    if (!data) return NextResponse.json({ error: "ไม่พบโปรไฟล์" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[pro-resume/public/[slug] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
