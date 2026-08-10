import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";
import { createFootballTurfLiveBoardSseResponse } from "@/systems/football-turf/lib/live-board-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — patch การจอง/สนาม ฯลฯ เฉพาะส่วนที่เปลี่ยน (แดชบอร์ด + พนักงาน) */
export async function GET(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;
  return createFootballTurfLiveBoardSseResponse(gate.userId);
}
