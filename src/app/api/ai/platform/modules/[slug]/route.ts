import { NextResponse } from "next/server";
import { assertAiKnowledgeApiKey, getModuleDetail } from "@/lib/ai-platform-knowledge";

export const runtime = "nodejs";

/** GET /api/ai/platform/modules/[slug] */
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const denied = assertAiKnowledgeApiKey(req);
  if (denied) return denied;

  const { slug } = await ctx.params;
  const detail = getModuleDetail(slug);
  if (!detail) {
    return NextResponse.json({ ok: false, error: "Module not found", slug }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: detail });
}
