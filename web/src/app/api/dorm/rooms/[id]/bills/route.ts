/**
 * มิเตอร์น้ำ-ไฟ & บิลค่าใช้จ่าย — ระดับห้อง (room) เท่านั้น
 * POST: upsert utility_bills ตาม room + งวด แล้วสร้าง/อัปเดต payments แยกรายคนจากผู้พัก ACTIVE
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { computeUtilityTotalRoomAmount, refreshPendingSplitPaymentsForBill } from "@/systems/dormitory/lib/split-payments";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

/** ขีดจำกัดของคอลัมน์ DECIMAL(10,2) ใน MySQL สำหรับยอดเงินในตาราง utility_bills / payments */
const MAX_DECIMAL_10_2 = 99_999_999.99;

const fixedItemSchema = z.object({
  label: z.string().trim().min(1, "ต้องมีชื่อรายการ").max(64),
  amount: z.number().finite().min(0).max(99_999_999),
});

const upsertSchema = z.object({
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/),
  waterMeterPrev: z.number().int().min(0),
  waterMeterCurr: z.number().int().min(0),
  electricMeterPrev: z.number().int().min(0),
  electricMeterCurr: z.number().int().min(0),
  waterPrice: z.number().finite().min(0),
  electricPrice: z.number().finite().min(0),
  fixedCosts: z.array(fixedItemSchema).max(20).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseRoomId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function fixedCostsToJson(
  rows?: z.infer<typeof upsertSchema>["fixedCosts"],
): Prisma.UtilityBillUncheckedCreateInput["fixedFees"] {
  if (!rows?.length) return Prisma.DbNull;
  const o: Record<string, number> = {};
  for (const r of rows) {
    o[r.label] = r.amount;
  }
  return o;
}

/** ข้อความย่อยสำหรับผู้ใช้ — ส่งหลายข้อเมื่อ Zod มีหลาย issue */
function zodIssuesToDetails(issues: z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const key = issue.path[0];
    const sub = issue.path[1];
    if (key === "fixedCosts" && typeof sub === "number") {
      return `ค่าคงที่ แถวที่ ${sub + 1}: ${issue.message}`;
    }
    if (key === "periodMonth") {
      return `งวดบิล: ${issue.message} (ต้องเป็นรูปแบบ เช่น 2025-03)`;
    }
    const pathStr = issue.path.length ? issue.path.join(".") : "ข้อมูล";
    return `${pathStr}: ${issue.message}`;
  });
}

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบใหม่ (เซสชันหมดอายุหรือยังไม่ได้ล็อกอิน)" },
      { status: 401 },
    );
  }
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const { searchParams } = new URL(req.url);
  const periodMonth = searchParams.get("periodMonth");

  const room = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  if (periodMonth) {
    const [ys, ms] = periodMonth.split("-");
    const billingYear = Number(ys);
    const billingMonth = Number(ms);
    if (!Number.isInteger(billingYear) || !Number.isInteger(billingMonth)) {
      return NextResponse.json({ error: "งวดไม่ถูกต้อง" }, { status: 400 });
    }
    const bill = await prisma.utilityBill.findUnique({
      where: {
        roomId_billingYear_billingMonth: { roomId: rid, billingYear, billingMonth },
      },
      include: { payments: true },
    });
    return NextResponse.json({
      bill: bill
        ? {
            id: bill.id,
            billingMonth: bill.billingMonth,
            billingYear: bill.billingYear,
            periodMonth,
            waterMeterPrev: bill.waterMeterPrev,
            waterMeterCurr: bill.waterMeterCurr,
            electricMeterPrev: bill.electricMeterPrev,
            electricMeterCurr: bill.electricMeterCurr,
            waterPrice: Number(bill.waterPrice),
            electricPrice: Number(bill.electricPrice),
            fixedFees: bill.fixedFees,
            totalRoomAmount: Number(bill.totalRoomAmount),
            payments: bill.payments.map((p) => ({
              id: p.id,
              tenantId: p.tenantId,
              amountToPay: Number(p.amountToPay),
              paymentStatus: p.paymentStatus,
            })),
          }
        : null,
    });
  }

  const bills = await prisma.utilityBill.findMany({
    where: { roomId: rid },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
    include: { payments: { take: 20 } },
  });
  return NextResponse.json({
    bills: bills.map((b) => ({
      id: b.id,
      billingMonth: b.billingMonth,
      billingYear: b.billingYear,
      periodMonth: `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`,
      waterMeterPrev: b.waterMeterPrev,
      waterMeterCurr: b.waterMeterCurr,
      electricMeterPrev: b.electricMeterPrev,
      electricMeterCurr: b.electricMeterCurr,
      waterPrice: Number(b.waterPrice),
      electricPrice: Number(b.electricPrice),
      fixedFees: b.fixedFees,
      totalRoomAmount: Number(b.totalRoomAmount),
    })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบใหม่ (เซสชันหมดอายุหรือยังไม่ได้ล็อกอิน)" },
      { status: 401 },
    );
  }
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const room = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    const details = zodIssuesToDetails(parsed.error.issues);
    const error =
      details[0] ??
      "ข้อมูลที่ส่งไม่ผ่านการตรวจสอบ — ตรวจสอบมิเตอร์ (ตัวเลขจำนวนเต็ม), ราคาต่อหน่วย, งวด และค่าคงที่";
    return NextResponse.json(
      { error, details: details.slice(0, 8) },
      { status: 400 },
    );
  }

  const { periodMonth, fixedCosts, ...meters } = parsed.data;
  const [ys, ms] = periodMonth.split("-");
  const billingYear = Number(ys);
  const billingMonth = Number(ms);

  const fixedFees = fixedCostsToJson(fixedCosts);
  const totalRoomAmount = computeUtilityTotalRoomAmount({
    waterMeterPrev: meters.waterMeterPrev,
    waterMeterCurr: meters.waterMeterCurr,
    electricMeterPrev: meters.electricMeterPrev,
    electricMeterCurr: meters.electricMeterCurr,
    waterPrice: meters.waterPrice,
    electricPrice: meters.electricPrice,
    fixedFeesJson: fixedFees === Prisma.DbNull ? null : fixedFees,
  });

  if (!Number.isFinite(totalRoomAmount)) {
    return NextResponse.json(
      {
        error: "คำนวณยอดน้ำไฟห้องไม่ได้ — ตรวจสอบตัวเลขมิเตอร์และราคาต่อหน่วย",
        details: ["ตัวเลขต้องเป็นจำนวนที่คำนวณได้ (ไม่ใช่ค่าว่างหรือไม่ใช่ตัวเลข)"],
      },
      { status: 400 },
    );
  }

  if (totalRoomAmount > MAX_DECIMAL_10_2) {
    return NextResponse.json(
      {
        error: `ยอดน้ำไฟ+ค่าคงที่รวมห้องสูงเกินระบบรองรับ (สูงสุด ${MAX_DECIMAL_10_2.toLocaleString("th-TH")} บาท)`,
        details: [
          "มักเกิดจากเลขมิเตอร์ผิด (เช่น พิมพ์เลขมากเกินจริง) หรือราคาต่อหน่วยสูงผิดปกติ",
          "ลองแก้มิเตอร์ก่อน/หลัง ราคาน้ำ-ไฟต่อหน่วย และรายการค่าคงที่ให้สอดคล้องกับจริง",
        ],
      },
      { status: 400 },
    );
  }

  const basePrice = Number(room.basePrice);
  const activeTenantCount = await prisma.tenant.count({
    where: { roomId: rid, status: "ACTIVE" },
  });

  if (activeTenantCount > 0) {
    const perShare = Math.round(((basePrice + totalRoomAmount) / activeTenantCount) * 100) / 100;
    if (!Number.isFinite(perShare) || perShare > MAX_DECIMAL_10_2) {
      return NextResponse.json(
        {
          error: `ยอดที่แบ่งต่อผู้พัก 1 คนเกินระบบรองรับ (สูงสุด ${MAX_DECIMAL_10_2.toLocaleString("th-TH")} บาท) — คิดจาก (ค่าเช่าห้อง + น้ำไฟห้อง) ÷ จำนวนผู้พัก ACTIVE`,
          details: [
            `ค่าเช่าห้อง ${basePrice.toLocaleString("th-TH")} + น้ำไฟห้อง ${totalRoomAmount.toLocaleString("th-TH")} หาร ${activeTenantCount} คน ≈ ${perShare.toLocaleString("th-TH")} บ./คน`,
            "ฐานข้อมูลเก็บยอดต่อคนได้ไม่เกิน ~99 ล้านบาท — ถ้ายอดจริงไม่ได้สูงขนาดนี้ ให้ตรวจมิเตอร์และค่าเช่าว่าพิมพ์ถูกหรือไม่",
          ],
        },
        { status: 400 },
      );
    }
  }

  try {
    const bill = await prisma.utilityBill.upsert({
      where: {
        roomId_billingYear_billingMonth: { roomId: rid, billingYear, billingMonth },
      },
      create: {
        roomId: rid,
        billingMonth,
        billingYear,
        waterMeterPrev: meters.waterMeterPrev,
        waterMeterCurr: meters.waterMeterCurr,
        electricMeterPrev: meters.electricMeterPrev,
        electricMeterCurr: meters.electricMeterCurr,
        waterPrice: meters.waterPrice,
        electricPrice: meters.electricPrice,
        fixedFees,
        totalRoomAmount,
      },
      update: {
        waterMeterPrev: meters.waterMeterPrev,
        waterMeterCurr: meters.waterMeterCurr,
        electricMeterPrev: meters.electricMeterPrev,
        electricMeterCurr: meters.electricMeterCurr,
        waterPrice: meters.waterPrice,
        electricPrice: meters.electricPrice,
        fixedFees,
        totalRoomAmount,
      },
    });

    await refreshPendingSplitPaymentsForBill(bill.id);

    return NextResponse.json({
      bill: {
        id: bill.id,
        billingMonth: bill.billingMonth,
        billingYear: bill.billingYear,
        periodMonth,
        waterMeterPrev: bill.waterMeterPrev,
        waterMeterCurr: bill.waterMeterCurr,
        electricMeterPrev: bill.electricMeterPrev,
        electricMeterCurr: bill.electricMeterCurr,
        waterPrice: Number(bill.waterPrice),
        electricPrice: Number(bill.electricPrice),
        fixedFees: bill.fixedFees,
        totalRoomAmount: Number(bill.totalRoomAmount),
      },
    });
  } catch (err) {
    console.error("[dorm bills POST]", err);
    const details: string[] = [
      "ลองรีเฟรชหน้าแล้วบันทึกใหม่",
      "ตรวจสอบว่ารัน `npx prisma migrate deploy` และ `npx prisma generate` แล้ว และเซิร์ฟเวอร์ฐานข้อมูลทำงานปกติ",
    ];
    let error =
      "บันทึกลงฐานข้อมูลไม่สำเร็จ — อาจเป็นปัญหาเชื่อมต่อ DB หรือข้อมูลไม่ตรงกับที่ระบบรองรับ";

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      details.unshift(`รหัส Prisma: ${err.code}`);
      if (err.code === "P2022") {
        error =
          "ฐานข้อมูลไม่มีคอลัมน์ที่โปรแกรมต้องการ — โครงสร้าง DB ล้าหลังกว่าโค้ด (มักแก้ด้วย migration)";
        details.push("รันคำสั่ง: npx prisma migrate deploy บนเครื่อง/เซิร์ฟเวอร์ที่ใช้ฐานข้อมูลชุดนี้");
      } else if (err.code === "P2002") {
        error = "ข้อมูลซ้ำกับที่ระบบกำหนดไว้ (คีย์ไม่ซ้ำ) — ลองรีเฟรชแล้วบันทึกใหม่";
      } else if (err.code === "P2003") {
        error = "อ้างอิงข้อมูลที่ไม่มีในฐานข้อมูล (Foreign key) — ลองเปิดห้องจากรายการใหม่";
      }
      const cause = err.meta?.cause;
      if (typeof cause === "string" && cause.length > 0) {
        details.push(`สาเหตุ: ${cause.slice(0, 300)}`);
      }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      details.unshift("(ข้อมูลไม่ตรงรูปแบบที่ Prisma คาด)");
      const line = err.message.split("\n").find((l) => l.trim().length > 0);
      if (line) details.push(line.slice(0, 280));
    } else if (err instanceof Error) {
      const m = err.message;
      if (/out of range|Out of range|DECIMAL|1264|22003/i.test(m)) {
        error =
          "ตัวเลขยอดเงินเกินขีดจำกัดในฐานข้อมูล — มักเกิดเมื่อมิเตอร์หรือราคาต่อหน่วยสูงผิดจริง";
        details.push(
          "ลองลดเลขมิเตอร์/ราคาน้ำ-ไฟ หรือค่าคงที่ — ระบบรองรับยอดต่อช่องประมาณไม่เกิน 99,999,999.99 บาท",
        );
      }
    }

    return NextResponse.json({ error, details }, { status: 500 });
  }
}
