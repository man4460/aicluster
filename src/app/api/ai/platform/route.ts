import { NextResponse } from "next/server";
import { assertAiKnowledgeApiKey, getPlatformOverview } from "@/lib/ai-platform-knowledge";

export const runtime = "nodejs";

/** GET /api/ai/platform — overview สำหรับ Gemini / AI อื่น */
export async function GET(req: Request) {
  const denied = assertAiKnowledgeApiKey(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, data: getPlatformOverview() });
}
