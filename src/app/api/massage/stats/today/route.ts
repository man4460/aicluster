import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDayStartEnd } from "@/lib/massage/bangkok-day";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);

  const { start, end } = bangkokDayStartEnd();

  const logs = await prisma.massageServiceLog.findMany({
    where: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      createdAt: { gte: start, lt: end },
    },
    select: {
      massageCustomerId: true,
      visitType: true,
    },
  });

  const uniqueCustomers = new Set(logs.map((l) => l.massageCustomerId)).size;
  const packageUses = logs.filter((l) => l.visitType === "PACKAGE_USE").length;
  const cashWalkIns = logs.filter((l) => l.visitType === "CASH_WALK_IN").length;

  return NextResponse.json({
    dateKey: start.toISOString().slice(0, 10),
    uniqueCustomers,
    packageUses,
    cashWalkIns,
    totalVisits: logs.length,
  });
}
