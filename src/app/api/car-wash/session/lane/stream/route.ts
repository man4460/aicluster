import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { createCarWashLaneBoardSseResponse } from "@/systems/car-wash/lib/lane-board-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเมื่อลานล้างวันนี้เปลี่ยนสถานะ / มีคิวใหม่ */
export async function GET(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;
  return createCarWashLaneBoardSseResponse(own.ownerId);
}
