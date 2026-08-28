import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { buildAttendanceRosterImportTemplateXls } from "@/lib/attendance/roster-excel-template";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);
  await ensureAttendanceLocationsFromLegacy(ctx.billingUserId, scope.trialSessionId);

  const branches = await prisma.attendanceBranch.findMany({
    where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true, address: true },
  });

  const body = buildAttendanceRosterImportTemplateXls(
    branches.map((b) => ({
      code: b.code,
      name: b.name,
      address: b.address,
    })),
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendance-roster-import-template.xls"',
    },
  });
}
