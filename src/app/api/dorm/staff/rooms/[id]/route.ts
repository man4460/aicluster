import { NextResponse } from "next/server";
import { requireDormitoryStaff } from "@/lib/dormitory/staff-auth";
import { loadDormRoomDetailPayload } from "@/lib/dormitory/load-room-detail";

type Ctx = { params: Promise<{ id: string }> };

function parseRoomId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireDormitoryStaff(req);
  if ("error" in auth) return auth.error;
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const payload = await loadDormRoomDetailPayload(auth.ctx.ownerId, auth.ctx.trialSessionId, rid);
  if (!payload) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  return NextResponse.json(payload);
}
