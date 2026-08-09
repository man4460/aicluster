import { NextResponse } from "next/server";
import {
  FOOTBALL_TURF_STAFF_ALLOWED_OPS,
  getFootballTurfOwnerOrStaffContext,
} from "@/systems/football-turf/lib/api-auth";
import { runFootballTurfAction } from "@/systems/football-turf/lib/run-action";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

export async function POST(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;

  let body: { op: string; id?: number; input?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.op) return NextResponse.json({ error: "op required" }, { status: 400 });

  if (gate.isStaff && !FOOTBALL_TURF_STAFF_ALLOWED_OPS.has(body.op)) {
    return NextResponse.json({ error: "พนักงานไม่มีสิทธิ์การกระทำนี้" }, { status: 403 });
  }

  const repo = createFootballTurfServerRepo(gate.userId, gate.trialSessionId);
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
