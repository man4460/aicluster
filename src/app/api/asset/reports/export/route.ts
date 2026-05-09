import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";
import {
  ASSET_STATUS_LABEL,
  ASSET_CONDITION_LABEL,
  calcStraightLineValue,
} from "@/systems/asset/lib/asset-types";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toRow(arr: unknown[]): string {
  return arr.map(csvEscape).join(",");
}

function ymd(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function GET(req: Request) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "assets";

  const baseWhere = {
    ownerUserId: ctx.ownerUserId,
    trialSessionId: ctx.trialSessionId,
  } as const;

  let csv = "";
  let filename = "asset-report.csv";

  if (kind === "assets") {
    const items = await prisma.asset.findMany({
      where: { ...baseWhere, isDeleted: false },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        location: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { assetCode: "asc" },
    });
    const header = [
      "รหัส",
      "ชื่อทรัพย์สิน",
      "หมวดหมู่",
      "แผนก",
      "สถานที่",
      "ผู้ขาย",
      "ผู้ครอบครอง",
      "Serial",
      "ยี่ห้อ/รุ่น",
      "วันที่ซื้อ",
      "ราคาซื้อ",
      "อายุการใช้ (ปี)",
      "มูลค่าคงเหลือ",
      "ประกันถึง",
      "สถานะ",
      "สภาพ",
    ];
    const rows = items.map((a) => {
      const purchase = a.purchasePrice ? Number(a.purchasePrice) : 0;
      const current = calcStraightLineValue({
        purchasePrice: purchase,
        purchaseDate: a.purchaseDate,
        depreciationYears: a.depreciationYears ?? 5,
      });
      return toRow([
        a.assetCode,
        a.assetName,
        a.category?.name ?? "",
        a.department?.name ?? "",
        a.location?.name ?? "",
        a.supplier?.name ?? "",
        a.holderName ?? "",
        a.serialNumber ?? "",
        [a.brand, a.model].filter(Boolean).join(" "),
        ymd(a.purchaseDate),
        purchase,
        a.depreciationYears,
        Math.round(current * 100) / 100,
        ymd(a.warrantyUntil),
        ASSET_STATUS_LABEL[a.status],
        ASSET_CONDITION_LABEL[a.condition],
      ]);
    });
    csv = [toRow(header), ...rows].join("\r\n");
    filename = "assets.csv";
  } else if (kind === "transactions") {
    const items = await prisma.assetTransaction.findMany({
      where: baseWhere,
      include: {
        asset: { select: { assetCode: true, assetName: true } },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
      },
      orderBy: { transactionDate: "desc" },
    });
    const header = [
      "เลขที่",
      "วันที่",
      "ประเภท",
      "รหัสทรัพย์สิน",
      "ชื่อทรัพย์สิน",
      "จากผู้ครอบครอง",
      "ถึงผู้ครอบครอง",
      "จากสถานที่",
      "ถึงสถานที่",
      "หมายเหตุ",
    ];
    const rows = items.map((t) =>
      toRow([
        t.transactionCode,
        ymd(t.transactionDate),
        t.type,
        t.asset?.assetCode ?? "",
        t.asset?.assetName ?? "",
        t.fromHolderName ?? "",
        t.toHolderName ?? "",
        t.fromLocation?.name ?? "",
        t.toLocation?.name ?? "",
        t.note ?? "",
      ]),
    );
    csv = [toRow(header), ...rows].join("\r\n");
    filename = "transactions.csv";
  } else if (kind === "maintenance") {
    const items = await prisma.assetMaintenance.findMany({
      where: baseWhere,
      include: { asset: { select: { assetCode: true, assetName: true } } },
      orderBy: { startDate: "desc" },
    });
    const header = [
      "เลขที่",
      "วันเริ่ม",
      "วันเสร็จ",
      "ประเภท",
      "สถานะ",
      "รหัสทรัพย์สิน",
      "ชื่อทรัพย์สิน",
      "ค่าใช้จ่าย",
      "ผู้ให้บริการ",
      "อาการ/รายละเอียด",
    ];
    const rows = items.map((m) =>
      toRow([
        m.maintenanceCode,
        ymd(m.startDate),
        ymd(m.endDate),
        m.type,
        m.status,
        m.asset?.assetCode ?? "",
        m.asset?.assetName ?? "",
        m.cost ? Number(m.cost) : 0,
        m.vendor ?? "",
        m.description ?? "",
      ]),
    );
    csv = [toRow(header), ...rows].join("\r\n");
    filename = "maintenance.csv";
  } else if (kind === "disposals") {
    const items = await prisma.assetDisposal.findMany({
      where: baseWhere,
      include: { asset: { select: { assetCode: true, assetName: true } } },
      orderBy: { disposalDate: "desc" },
    });
    const header = [
      "เลขที่",
      "วันที่",
      "วิธี",
      "รหัสทรัพย์สิน",
      "ชื่อทรัพย์สิน",
      "มูลค่าจำหน่าย",
      "ผู้รับ/ผู้ซื้อ",
      "เหตุผล",
    ];
    const rows = items.map((d) =>
      toRow([
        d.disposalCode,
        ymd(d.disposalDate),
        d.method,
        d.asset?.assetCode ?? "",
        d.asset?.assetName ?? "",
        d.salePrice ? Number(d.salePrice) : 0,
        d.buyer ?? "",
        d.reason ?? "",
      ]),
    );
    csv = [toRow(header), ...rows].join("\r\n");
    filename = "disposals.csv";
  } else if (kind === "audits") {
    const items = await prisma.assetAudit.findMany({
      where: baseWhere,
      include: { asset: { select: { assetCode: true, assetName: true } } },
      orderBy: { auditDate: "desc" },
    });
    const header = [
      "เลขที่",
      "วันที่",
      "สถานะ",
      "รหัสทรัพย์สิน",
      "ชื่อทรัพย์สิน",
      "สภาพที่พบ",
      "ผู้ตรวจ",
      "หมายเหตุ",
    ];
    const rows = items.map((a) =>
      toRow([
        a.auditCode,
        ymd(a.auditDate),
        a.status,
        a.asset?.assetCode ?? "",
        a.asset?.assetName ?? "",
        a.actualCondition ?? "",
        a.auditorName ?? "",
        a.note ?? "",
      ]),
    );
    csv = [toRow(header), ...rows].join("\r\n");
    filename = "audits.csv";
  } else {
    return NextResponse.json({ error: "ประเภทรายงานไม่ถูกต้อง" }, { status: 400 });
  }

  // Add UTF-8 BOM so Excel opens Thai correctly
  const bom = "\ufeff";
  return new NextResponse(bom + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
