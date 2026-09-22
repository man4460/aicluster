import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const ENV_KEY = "MAWELL_AI_KNOWLEDGE_API_KEY";

function readPresentedKey(req: Request): string {
  const headerKey = req.headers.get("x-mawell-ai-key")?.trim();
  if (headerKey) return headerKey;
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m?.[1]?.trim() ?? "";
}

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * ตรวจ API key สำหรับ Knowledge API (อ่านอย่างเดียว)
 * Header: `Authorization: Bearer …` หรือ `X-Mawell-Ai-Key: …`
 * Env: `MAWELL_AI_KNOWLEDGE_API_KEY`
 */
export function assertAiKnowledgeApiKey(req: Request): NextResponse | null {
  const expected = process.env[ENV_KEY]?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error: "AI knowledge API is not configured",
        hint: `Set ${ENV_KEY} in the server environment`,
      },
      { status: 503 },
    );
  }
  const presented = readPresentedKey(req);
  if (!presented || !safeEqualString(presented, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
