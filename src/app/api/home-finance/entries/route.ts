import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { exclusiveEndAfterInclusiveTo, formatDbDateToYmd, parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { homeFinanceEntryPostSchema, zodFirstIssueMessage } from "@/lib/home-finance/entry-schema";
import type { HomeFinanceEntryType, HomeUtilityType, HomeVehicleType } from "@/generated/prisma/enums";

function mapRow(r: {
  id: number;
  entryDate: Date;
  type: HomeFinanceEntryType;
  categoryKey: string;
  categoryLabel: string;
  title: string;
  amount: unknown;
  dueDate: Date | null;
  billNumber: string | null;
  vehicleType: string | null;
  serviceCenter: string | null;
  paymentMethod: string | null;
  note: string | null;
  slipImageUrl: string | null;
  linkedUtilityId: number | null;
  linkedVehicleId: number | null;
  linkedUtility?: {
    id: number;
    label: string;
    utilityType: HomeUtilityType;
  } | null;
  linkedVehicle?: {
    id: number;
    label: string;
    plateNumber: string | null;
    vehicleType: HomeVehicleType;
  } | null;
}) {
  return {
    id: r.id,
    entryDate: formatDbDateToYmd(r.entryDate),
    type: r.type,
    categoryKey: r.categoryKey,
    categoryLabel: r.categoryLabel,
    title: r.title,
    amount: Number(r.amount),
    dueDate: r.dueDate ? formatDbDateToYmd(r.dueDate) : null,
    billNumber: r.billNumber,
    vehicleType: r.vehicleType,
    serviceCenter: r.serviceCenter,
    paymentMethod: r.paymentMethod,
    note: r.note,
    slipImageUrl: r.slipImageUrl,
    linkedUtilityId: r.linkedUtilityId,
    linkedVehicleId: r.linkedVehicleId,
    linkedUtility: r.linkedUtility ?? null,
    linkedVehicle: r.linkedVehicle ?? null,
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json(
      {
        error:
          ctx?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้",
      },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const from = parseYmdToDbDate(searchParams.get("from"));
  const to = parseYmdToDbDate(searchParams.get("to"));
  const type = searchParams.get("type")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  if (!from || !to) return NextResponse.json({ error: "from/to ไม่ถูกต้อง" }, { status: 400 });
  const toEnd = exclusiveEndAfterInclusiveTo(to);

  const rows = await prisma.homeFinanceEntry.findMany({
    where: {
      ownerUserId: ctx.billingUserId,
      entryDate: { gte: from, lt: toEnd },
      ...(type === "INCOME" || type === "EXPENSE" ? { type } : {}),
      ...(category ? { categoryKey: category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { note: { contains: q } },
              { billNumber: { contains: q } },
              { categoryLabel: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      linkedUtility: { select: { id: true, label: true, utilityType: true } },
      linkedVehicle: { select: { id: true, label: true, plateNumber: true, vehicleType: true } },
    },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    take: 1000,
  });

  const income = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + Number(r.amount), 0);

  return NextResponse.json({
    entries: rows.map(mapRow),
    summary: {
      count: rows.length,
      income,
      expense,
      balance: income - expense,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json(
      {
        error:
          ctx?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้",
      },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = homeFinanceEntryPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `ข้อมูลไม่ถูกต้อง — ${zodFirstIssueMessage(parsed.error)}` },
      { status: 400 },
    );
  }

  const entryDate = parseYmdToDbDate(parsed.data.entryDate);
  const dueDate = parseYmdToDbDate(parsed.data.dueDate ?? null);
  if (!entryDate) return NextResponse.json({ error: "วันที่รายการไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.dueDate && !dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });

  let linkedUtilityId = parsed.data.linkedUtilityId ?? null;
  let linkedVehicleId = parsed.data.linkedVehicleId ?? null;
  if (linkedUtilityId != null && linkedVehicleId != null) {
    return NextResponse.json({ error: "เลือกได้เพียงบิลค่าไฟ/น้ำ หรือรถ อย่างใดอย่างหนึ่ง" }, { status: 400 });
  }
  if (linkedUtilityId != null) {
    const u = await prisma.homeUtilityProfile.findFirst({
      where: { id: linkedUtilityId, ownerUserId: ctx.billingUserId },
      select: { id: true },
    });
    if (!u) return NextResponse.json({ error: "ไม่พบรายการค่าไฟ/ค่าน้ำ" }, { status: 400 });
  }
  if (linkedVehicleId != null) {
    const v = await prisma.homeVehicleProfile.findFirst({
      where: { id: linkedVehicleId, ownerUserId: ctx.billingUserId },
      select: { id: true },
    });
    if (!v) return NextResponse.json({ error: "ไม่พบรายการยานพาหนะ" }, { status: 400 });
  }

  const slip = parsed.data.slipImageUrl?.trim();
  const slipOk =
    !slip ||
    (slip.startsWith("/uploads/home-finance/") && !slip.includes("..") && slip.length <= 512);

  let row;
  try {
    row = await prisma.homeFinanceEntry.create({
      data: {
        ownerUserId: ctx.billingUserId,
        entryDate,
        type: parsed.data.type,
        categoryKey: parsed.data.categoryKey,
        categoryLabel: parsed.data.categoryLabel.trim().slice(0, 100),
        title: parsed.data.title.trim(),
        amount: parsed.data.amount,
        dueDate,
        billNumber: parsed.data.billNumber?.trim() || null,
        vehicleType: parsed.data.vehicleType?.trim() || null,
        serviceCenter: parsed.data.serviceCenter?.trim() || null,
        paymentMethod: parsed.data.paymentMethod?.trim() || null,
        note: parsed.data.note?.trim() || null,
        slipImageUrl: slipOk ? slip || null : null,
        linkedUtilityId,
        linkedVehicleId,
      },
      include: {
        linkedUtility: { select: { id: true, label: true, utilityType: true } },
        linkedVehicle: { select: { id: true, label: true, plateNumber: true, vehicleType: true } },
      },
    });
  } catch (e) {
    console.error("homeFinanceEntry.create", e);
    return NextResponse.json(
      { error: "บันทึกลงฐานข้อมูลไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ" },
      { status: 500 },
    );
  }

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "CREATE",
    modelName: "HomeFinanceEntry",
    payload: { id: row.id, ownerUserId: ctx.billingUserId, title: row.title, amount: Number(row.amount) },
  });

  return NextResponse.json({ entry: mapRow(row) });
}
