import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  const { start, end } = bangkokDayStartEnd();

  const logs = await prisma.barberServiceLog.findMany({
    where: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      createdAt: { gte: start, lt: end },
    },
    select: {
      barberCustomerId: true,
      visitType: true,
    },
  });

  const uniqueCustomers = new Set(logs.map((l) => l.barberCustomerId)).size;
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
