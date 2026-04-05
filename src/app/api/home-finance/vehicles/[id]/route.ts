import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

const ymdOptional = z.preprocess(
  (v: unknown) => (v === "" ? null : v),
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional().nullable(),
);

const vehicleYearOpt = z.preprocess((v: unknown) => {
  if (v === "" || v === null) return null;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return v;
}, z.number().int().min(1900).max(2100).optional().nullable());

const patchSchema = z.object({
  vehicleType: z.enum(["CAR", "MOTORCYCLE"]).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  brand: z.string().trim().max(80).optional().nullable(),
  model: z.string().trim().max(80).optional().nullable(),
  plateNumber: z.string().trim().max(40).optional().nullable(),
  vehicleYear: vehicleYearOpt,
  taxDueDate: ymdOptional,
  serviceDueDate: ymdOptional,
  insuranceDueDate: ymdOptional,
  note: z.string().trim().max(400).optional().nullable(),
  isActive: z.boolean().optional(),
  photoUrl: z.string().max(512).optional().nullable(),
});

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) {
    return NextResponse.json(
      {
        error:
          mod?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
      },
      { status: 403 },
    );
  }
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.homeVehicleProfile.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.homeVehicleProfile.update({
      where: { id },
      data: {
        ...(parsed.data.vehicleType !== undefined ? { vehicleType: parsed.data.vehicleType } : {}),
        ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
        ...(parsed.data.brand !== undefined ? { brand: parsed.data.brand?.trim() || null } : {}),
        ...(parsed.data.model !== undefined ? { model: parsed.data.model?.trim() || null } : {}),
        ...(parsed.data.plateNumber !== undefined
          ? { plateNumber: parsed.data.plateNumber?.trim() || null }
          : {}),
        ...(parsed.data.vehicleYear !== undefined ? { vehicleYear: parsed.data.vehicleYear } : {}),
        ...(parsed.data.taxDueDate !== undefined ? { taxDueDate: parseDateOnly(parsed.data.taxDueDate) } : {}),
        ...(parsed.data.serviceDueDate !== undefined
          ? { serviceDueDate: parseDateOnly(parsed.data.serviceDueDate) }
          : {}),
        ...(parsed.data.insuranceDueDate !== undefined
          ? { insuranceDueDate: parseDateOnly(parsed.data.insuranceDueDate) }
          : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.photoUrl !== undefined
          ? (() => {
              const p = parsed.data.photoUrl?.trim();
              if (!p) return { photoUrl: null };
              if (p.startsWith("/uploads/home-finance/") && !p.includes("..") && p.length <= 512)
                return { photoUrl: p };
              return {};
            })()
          : {}),
      },
    });
    return NextResponse.json({ item: row });
  } catch (e) {
    console.error("home-finance/vehicles PATCH", e);
    return NextResponse.json(
      { error: "บันทึกการแก้ไขยานพาหนะไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) {
    return NextResponse.json(
      {
        error:
          mod?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
      },
      { status: 403 },
    );
  }
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeVehicleProfile.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  try {
    await prisma.homeVehicleProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("home-finance/vehicles DELETE", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      { error: msg ?? "ลบรายการยานพาหนะไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ" },
      { status: 500 },
    );
  }
}
