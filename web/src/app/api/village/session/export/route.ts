import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const yearRaw = searchParams.get("year");
  const year = yearRaw != null && yearRaw !== "" ? Number.parseInt(yearRaw, 10) : NaN;
  const kind = (searchParams.get("kind") ?? "fees").trim();

  if (kind !== "residents" && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
    return NextResponse.json({ error: "ระบุ year" }, { status: 400 });
  }
  if (kind === "fees") {
    const rows = await prisma.villageCommonFeeRow.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: { gte: `${year}-01`, lte: `${year}-12` },
      },
      include: { house: { select: { houseNo: true, ownerName: true } } },
      orderBy: [{ yearMonth: "asc" }, { id: "asc" }],
    });
    const header = [
      "year_month",
      "house_no",
      "owner_name",
      "amount_due",
      "amount_paid",
      "status",
      "note",
      "paid_at",
    ];
    const lines = rows.map((r) =>
      [
        r.yearMonth,
        r.house.houseNo,
        r.house.ownerName ?? "",
        r.amountDue,
        r.amountPaid,
        r.status,
        r.note ?? "",
        r.paidAt?.toISOString() ?? "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    );
    const bom = "\uFEFF";
    const body = bom + header.join(",") + "\n" + lines.join("\n") + "\n";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="village-fees-${year}.csv"`,
      },
    });
  }

  if (kind === "slips") {
    const rows = await prisma.villageSlipSubmission.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: { gte: `${year}-01`, lte: `${year}-12` },
      },
      include: { house: { select: { houseNo: true, ownerName: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5000,
    });
    const header = [
      "id",
      "year_month",
      "house_no",
      "owner_name",
      "amount",
      "status",
      "submitted_at",
      "reviewed_at",
      "reviewer_note",
    ];
    const lines = rows.map((r) =>
      [
        r.id,
        r.yearMonth,
        r.house.houseNo,
        r.house.ownerName ?? "",
        r.amount,
        r.status,
        r.submittedAt.toISOString(),
        r.reviewedAt?.toISOString() ?? "",
        r.reviewerNote ?? "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    );
    const bom = "\uFEFF";
    const body = bom + header.join(",") + "\n" + lines.join("\n") + "\n";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="village-slips-${year}.csv"`,
      },
    });
  }

  if (kind === "residents") {
    const houses = await prisma.villageHouse.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        residents: { where: { isActive: true }, orderBy: { id: "asc" } },
      },
    });
    const header = [
      "house_no",
      "plot_label",
      "house_owner_name",
      "house_phone",
      "monthly_fee_override",
      "house_active",
      "resident_name",
      "resident_phone",
      "resident_note",
      "is_primary",
    ];
    const lines: string[] = [];
    for (const h of houses) {
      if (h.residents.length === 0) {
        lines.push(
          [
            h.houseNo,
            h.plotLabel ?? "",
            h.ownerName ?? "",
            h.phone ?? "",
            h.monthlyFeeOverride ?? "",
            h.isActive ? "1" : "0",
            "",
            "",
            "",
            "",
          ]
            .map((c) => csvEscape(String(c)))
            .join(","),
        );
      } else {
        for (const r of h.residents) {
          lines.push(
            [
              h.houseNo,
              h.plotLabel ?? "",
              h.ownerName ?? "",
              h.phone ?? "",
              h.monthlyFeeOverride ?? "",
              h.isActive ? "1" : "0",
              r.name,
              r.phone ?? "",
              r.note ?? "",
              r.isPrimary ? "1" : "0",
            ]
              .map((c) => csvEscape(String(c)))
              .join(","),
          );
        }
      }
    }
    const bom = "\uFEFF";
    const body = bom + header.join(",") + "\n" + lines.join("\n") + "\n";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="village-residents.csv"`,
      },
    });
  }

  if (kind === "annual_summary") {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(`${year}-${String(m).padStart(2, "0")}`);
    }
    const grouped = await prisma.villageCommonFeeRow.groupBy({
      by: ["yearMonth"],
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: { in: months },
      },
      _sum: { amountDue: true, amountPaid: true },
      _count: { id: true },
    });
    const byYm = new Map(grouped.map((g) => [g.yearMonth, g]));
    const header = ["year_month", "bill_rows", "total_due", "total_paid", "collection_percent"];
    const lines = months.map((ym) => {
      const g = byYm.get(ym);
      const due = Number(g?._sum.amountDue ?? 0);
      const paid = Number(g?._sum.amountPaid ?? 0);
      const pct = due > 0 ? Math.round(Math.min(100, (paid / due) * 100)) : "";
      return [ym, g?._count.id ?? 0, due, paid, pct].map((c) => csvEscape(String(c))).join(",");
    });
    const bom = "\uFEFF";
    const body = bom + header.join(",") + "\n" + lines.join("\n") + "\n";
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="village-annual-summary-${year}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "kind ไม่ถูกต้อง" }, { status: 400 });
}
