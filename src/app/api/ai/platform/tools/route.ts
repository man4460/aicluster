import { NextResponse } from "next/server";
import { assertAiKnowledgeApiKey, geminiToolsPayload } from "@/lib/ai-platform-knowledge";

export const runtime = "nodejs";

function resolveBaseUrl(req: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }
  return new URL(req.url).origin;
}

/** GET /api/ai/platform/tools — Gemini function declarations + endpoint map */
export async function GET(req: Request) {
  const denied = assertAiKnowledgeApiKey(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, data: geminiToolsPayload(resolveBaseUrl(req)) });
}
