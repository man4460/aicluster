import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  aggregateModuleTryStats,
  type ModuleTryPeriodKey,
} from "@/lib/modules/try-analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const url = new URL(req.url);
  const periodRaw = url.searchParams.get("period") ?? "month";
  const period: ModuleTryPeriodKey =
    periodRaw === "today" || periodRaw === "month" || periodRaw === "year" || periodRaw === "custom"
      ? periodRaw
      : "month";

  const data = await aggregateModuleTryStats(prisma, {
    period,
    moduleSlug: url.searchParams.get("moduleSlug"),
    utmCampaign: url.searchParams.get("utmCampaign"),
    utmSource: url.searchParams.get("utmSource"),
    fromYmd: url.searchParams.get("from") ?? undefined,
    toYmd: url.searchParams.get("to") ?? undefined,
  });

  return NextResponse.json(data);
}
