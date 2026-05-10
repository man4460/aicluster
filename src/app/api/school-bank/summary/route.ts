import { NextResponse } from "next/server";
import { getSchoolBankOwnerContext } from "@/systems/school-bank/lib/school-bank-api-auth";
import { buildSchoolBankDashboardDto } from "@/systems/school-bank/lib/load-school-bank-dashboard";

export async function GET() {
  const ctx = await getSchoolBankOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dto = await buildSchoolBankDashboardDto(ctx.settings, ctx.userId, ctx.scope.trialSessionId);
  return NextResponse.json(dto);
}
