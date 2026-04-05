import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const ymdOptional = z.preprocess(
  (v: unknown) => (v === "" ? null : v),
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional().nullable(),
);

const vehicleYearOpt = z.preprocess((v: unknown) => {
  if (v === "" || v === null) return null;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return v;
}, z.number().int().min(1900).max(2100).optional().nullable());

const postSchema = z.object({
  vehicleType: z.enum(["CAR", "MOTORCYCLE"]),
  label: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional().nullable(),
  model: z.string().trim().max(80).optional().nullable(),
  plateNumber: z.string().trim().max(40).optional().nullable(),
  vehicleYear: vehicleYearOpt,
  taxDueDate: ymdOptional,
  serviceDueDate: ymdOptional,
  insuranceDueDate: ymdOptional,
  note: z.string().trim().max(400).optional().nullable(),
});

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
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
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
      },
      { status: 403 },
    );
  }

  try {
    const rows = await prisma.homeVehicleProfile.findMany({
      where: { ownerUserId: ctx.billingUserId },
      orderBy: [{ isActive: "desc" }, { vehicleType: "asc" }, { id: "desc" }],
    });
    return NextResponse.json({
      items: rows,
      counts: {
        cars: rows.filter((r) => r.vehicleType === "CAR" && r.isActive).length,
        motorcycles: rows.filter((r) => r.vehicleType === "MOTORCYCLE" && r.isActive).length,
      },
    });
  } catch (e) {
    console.error("home-finance/vehicles GET", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      { error: msg ?? "โหลดรายการยานพาหนะจากฐานข้อมูลไม่สำเร็จ" },
      { status: 500 },
    );
  }
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
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
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
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.homeVehicleProfile.create({
      data: {
        ownerUserId: ctx.billingUserId,
        vehicleType: parsed.data.vehicleType,
        label: parsed.data.label,
        brand: parsed.data.brand?.trim() || null,
        model: parsed.data.model?.trim() || null,
        plateNumber: parsed.data.plateNumber?.trim() || null,
        vehicleYear: parsed.data.vehicleYear ?? null,
        taxDueDate: parseDateOnly(parsed.data.taxDueDate),
        serviceDueDate: parseDateOnly(parsed.data.serviceDueDate),
        insuranceDueDate: parseDateOnly(parsed.data.insuranceDueDate),
        note: parsed.data.note?.trim() || null,
        isActive: true,
      },
    });
    return NextResponse.json({ item: row });
  } catch (e) {
    console.error("home-finance/vehicles POST", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      {
        error:
          msg ?? "บันทึกรายการยานพาหนะไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ",
      },
      { status: 500 },
    );
  }
}
