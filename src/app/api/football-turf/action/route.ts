import { NextResponse } from "next/server";
import { getFootballTurfOwnerContext } from "@/systems/football-turf/lib/api-auth";
import { runFootballTurfAction } from "@/systems/football-turf/lib/run-action";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

export async function POST(req: Request) {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { op: string; id?: number; input?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.op) return NextResponse.json({ error: "op required" }, { status: 400 });

  const repo = createFootballTurfServerRepo(ctx.userId, ctx.scope.trialSessionId);
  try {
    const outcome = await runFootballTurfAction(repo, body);
    if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return NextResponse.json({ result: outcome.result });
  } catch (error) {
    console.error("[football-turf/action]", body.op, error);
    const message =
      error instanceof Error && /สลิป|ใหญ่เกิน|P2000|too long/i.test(error.message)
        ? error.message.includes("too long")
          ? "สลิปใหญ่เกินไป — ลองเลือกรูปที่เล็กลง"
          : error.message
        : "บันทึกไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
