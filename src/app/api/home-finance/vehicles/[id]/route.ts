import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { zodFirstIssueMessage } from "@/lib/home-finance/entry-schema";
import { requireSession } from "@/lib/api-auth";
import {
  canonicalizeHomeFinanceAttachmentList,
  isAllowedHomeFinanceUploadPath,
  MAX_HOME_FINANCE_ATTACHMENTS,
  normalizeHomeFinanceStoredPath,
} from "@/lib/home-finance/attachments";
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

const attachmentUrlsPatchSchema = z
  .array(
    z
      .string()
      .max(512)
      .refine((s) => isAllowedHomeFinanceUploadPath(s), "เส้นทางไฟล์ไม่ถูกต้อง"),
  )
  .max(MAX_HOME_FINANCE_ATTACHMENTS)
  .optional();

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
  attachmentUrls: attachmentUrlsPatchSchema,
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: `ข้อมูลไม่ถูกต้อง — ${zodFirstIssueMessage(parsed.error)}` },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: Prisma.HomeVehicleProfileUpdateInput = {};

  if (d.vehicleType !== undefined) data.vehicleType = d.vehicleType;
  if (d.label !== undefined) data.label = d.label;
  if (d.brand !== undefined) data.brand = d.brand?.trim() || null;
  if (d.model !== undefined) data.model = d.model?.trim() || null;
  if (d.plateNumber !== undefined) data.plateNumber = d.plateNumber?.trim() || null;
  if (d.vehicleYear !== undefined) data.vehicleYear = d.vehicleYear;
  if (d.taxDueDate !== undefined) data.taxDueDate = parseDateOnly(d.taxDueDate);
  if (d.serviceDueDate !== undefined) data.serviceDueDate = parseDateOnly(d.serviceDueDate);
  if (d.insuranceDueDate !== undefined) data.insuranceDueDate = parseDateOnly(d.insuranceDueDate);
  if (d.note !== undefined) data.note = d.note?.trim() || null;
  if (d.isActive !== undefined) data.isActive = d.isActive;

  if (d.photoUrl !== undefined) {
    const p = d.photoUrl?.trim();
    if (!p) data.photoUrl = null;
    else {
      const canon = normalizeHomeFinanceStoredPath(p);
      if (canon) data.photoUrl = canon;
    }
  }

  if (d.attachmentUrls !== undefined) {
    data.attachmentUrls = canonicalizeHomeFinanceAttachmentList(d.attachmentUrls);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะบันทึก" }, { status: 400 });
  }

  try {
    const row = await prisma.homeVehicleProfile.update({
      where: { id },
      data,
    });
    return NextResponse.json({ item: row });
  } catch (e) {
    console.error("home-finance/vehicles PATCH", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      {
        error:
          msg ??
          "บันทึกการแก้ไขยานพาหนะไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ",
      },
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
