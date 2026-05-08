import { NextResponse } from "next/server";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";
import { loadEducareDashboard } from "@/systems/educare/lib/educare-data";

export async function GET() {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;
  const data = await loadEducareDashboard(r.ctx);
  return NextResponse.json({ data });
}
