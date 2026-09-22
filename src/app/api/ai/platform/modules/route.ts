import { NextResponse } from "next/server";
import { assertAiKnowledgeApiKey, listModules } from "@/lib/ai-platform-knowledge";

export const runtime = "nodejs";

function parseBool(v: string | null): boolean | undefined {
  if (v == null || v === "") return undefined;
  if (v === "1" || v.toLowerCase() === "true") return true;
  if (v === "0" || v.toLowerCase() === "false") return false;
  return undefined;
}

/** GET /api/ai/platform/modules */
export async function GET(req: Request) {
  const denied = assertAiKnowledgeApiKey(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const groupRaw = url.searchParams.get("groupId");
  const groupId =
    groupRaw != null && groupRaw !== "" && Number.isFinite(Number(groupRaw))
      ? Number(groupRaw)
      : undefined;

  const modules = listModules({
    freeOnly: parseBool(url.searchParams.get("freeOnly")),
    visibleOnly: parseBool(url.searchParams.get("visibleOnly")),
    dailyOnly: parseBool(url.searchParams.get("dailyOnly")),
    q: url.searchParams.get("q") ?? undefined,
    groupId,
  });

  return NextResponse.json({
    ok: true,
    count: modules.length,
    data: modules,
  });
}
