import { NextResponse } from "next/server";
import {
  assertAiKnowledgeApiKey,
  getPlatformRules,
  parseRuleTopic,
} from "@/lib/ai-platform-knowledge";

export const runtime = "nodejs";

/** GET /api/ai/platform/rules?topic=billing|timezone|qr|roles|ux|print|security|all */
export async function GET(req: Request) {
  const denied = assertAiKnowledgeApiKey(req);
  if (denied) return denied;

  const topic = parseRuleTopic(new URL(req.url).searchParams.get("topic"));
  return NextResponse.json({ ok: true, data: getPlatformRules(topic) });
}
