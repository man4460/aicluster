import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

/**
 * List laundry customers (package + walk-in) for manage → สมาชิก search.
 */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await laundryOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getLaundryDataScope(own.ownerId);
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500) : 200;
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const phoneQ = (searchParams.get("phone") ?? "").replace(/\D/g, "");
  const walkInOnly = searchParams.get("walk_in") === "1" || searchParams.get("walk_in") === "true";

  const rows = await prisma.laundryCustomer.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      subscriptions: {
        select: { id: true, status: true, remainingSessions: true },
      },
      _count: { select: { orders: true, serviceLogs: true } },
    },
  });

  const customers = rows
    .map((c) => {
      const activeSubs = c.subscriptions.filter((s) => s.status === "ACTIVE" && s.remainingSessions > 0);
      const anySub = c.subscriptions.length > 0;
      return {
        id: c.id,
        phone: c.phone,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        hasPackage: anySub,
        hasActivePackage: activeSubs.length > 0,
        subscriptionCount: c.subscriptions.length,
        orderCount: c._count.orders,
        serviceLogCount: c._count.serviceLogs,
        taxInvoiceEnabled: c.taxInvoiceEnabled,
        billingName: c.billingName,
        taxId: c.taxId,
        taxAddress: c.taxAddress,
        taxBranch: c.taxBranch,
      };
    })
    .filter((c) => {
      if (walkInOnly && c.hasPackage) return false;
      if (phoneQ.length > 0) {
        if (!c.phone.replace(/\D/g, "").includes(phoneQ)) return false;
      }
      if (q.length > 0) {
        const blob = `${c.phone} ${c.name ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

  return NextResponse.json({ customers });
}
