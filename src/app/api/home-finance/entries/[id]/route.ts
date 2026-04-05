import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { homeFinanceEntryPatchSchema, zodFirstIssueMessage } from "@/lib/home-finance/entry-schema";

type Ctx = { params: Promise<{ id: string }> };

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
            : "ไม่มีสิทธิ์เข้าใช้",
      },
      { status: 403 },
    );
  }

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = homeFinanceEntryPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `ข้อมูลไม่ถูกต้อง — ${zodFirstIssueMessage(parsed.error)}` },
      { status: 400 },
    );
  }

  const exists = await prisma.homeFinanceEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const dueDate = parseYmdToDbDate(parsed.data.dueDate ?? null);
  const entryDate = parseYmdToDbDate(parsed.data.entryDate ?? null);
  if (parsed.data.dueDate && !dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.entryDate && !entryDate) return NextResponse.json({ error: "วันที่รายการไม่ถูกต้อง" }, { status: 400 });

  let linkedUtilityId: number | null | undefined = undefined;
  let linkedVehicleId: number | null | undefined = undefined;
  if (parsed.data.linkedUtilityId !== undefined || parsed.data.linkedVehicleId !== undefined) {
    const uId = parsed.data.linkedUtilityId === undefined ? undefined : parsed.data.linkedUtilityId;
    const vId = parsed.data.linkedVehicleId === undefined ? undefined : parsed.data.linkedVehicleId;
    if (uId != null && vId != null) {
      return NextResponse.json({ error: "เลือกได้เพียงบิลหรือรถ อย่างใดอย่างหนึ่ง" }, { status: 400 });
    }
    if (uId !== undefined) {
      if (uId != null) {
        const u = await prisma.homeUtilityProfile.findFirst({
          where: { id: uId, ownerUserId: mod.billingUserId },
          select: { id: true },
        });
        if (!u) return NextResponse.json({ error: "ไม่พบรายการค่าไฟ/ค่าน้ำ" }, { status: 400 });
      }
      linkedUtilityId = uId;
    }
    if (vId !== undefined) {
      if (vId != null) {
        const v = await prisma.homeVehicleProfile.findFirst({
          where: { id: vId, ownerUserId: mod.billingUserId },
          select: { id: true },
        });
        if (!v) return NextResponse.json({ error: "ไม่พบรายการยานพาหนะ" }, { status: 400 });
      }
      linkedVehicleId = vId;
    }
  }

  const data: Prisma.HomeFinanceEntryUpdateInput = {};
  if (parsed.data.entryDate !== undefined && entryDate != null) data.entryDate = entryDate;
  if (parsed.data.type !== undefined) data.type = parsed.data.type;
  if (parsed.data.categoryKey !== undefined) data.categoryKey = parsed.data.categoryKey;
  if (parsed.data.categoryLabel !== undefined) {
    data.categoryLabel = parsed.data.categoryLabel.trim().slice(0, 100);
  }
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
  if (parsed.data.dueDate !== undefined) data.dueDate = dueDate;
  if (parsed.data.billNumber !== undefined) data.billNumber = parsed.data.billNumber?.trim() || null;
  if (parsed.data.vehicleType !== undefined) data.vehicleType = parsed.data.vehicleType?.trim() || null;
  if (parsed.data.serviceCenter !== undefined) {
    data.serviceCenter = parsed.data.serviceCenter?.trim() || null;
  }
  if (parsed.data.paymentMethod !== undefined) {
    data.paymentMethod = parsed.data.paymentMethod?.trim() || null;
  }
  if (parsed.data.note !== undefined) data.note = parsed.data.note?.trim() || null;
  if (parsed.data.slipImageUrl !== undefined) {
    const slip = parsed.data.slipImageUrl?.trim() ?? "";
    const slipOk =
      slip === "" ||
      (slip.startsWith("/uploads/home-finance/") && !slip.includes("..") && slip.length <= 512);
    data.slipImageUrl = slipOk ? (slip === "" ? null : slip) : null;
  }
  if (linkedUtilityId !== undefined) {
    if (linkedUtilityId === null) {
      data.linkedUtility = { disconnect: true };
    } else {
      data.linkedUtility = { connect: { id: linkedUtilityId } };
      data.linkedVehicle = { disconnect: true };
    }
  }
  if (linkedVehicleId !== undefined) {
    if (linkedVehicleId === null) {
      data.linkedVehicle = { disconnect: true };
    } else {
      data.linkedVehicle = { connect: { id: linkedVehicleId } };
      data.linkedUtility = { disconnect: true };
    }
  }

  try {
    await prisma.homeFinanceEntry.update({
      where: { id },
      data,
    });
  } catch (e) {
    console.error("homeFinanceEntry.update", e);
    return NextResponse.json(
      { error: "บันทึกการแก้ไขไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ" },
      { status: 500 },
    );
  }

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "HomeFinanceEntry",
    payload: { id, ownerUserId: mod.billingUserId, changes: parsed.data },
  });

  return NextResponse.json({ ok: true });
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
            : "ไม่มีสิทธิ์เข้าใช้",
      },
      { status: 403 },
    );
  }

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const exists = await prisma.homeFinanceEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.homeFinanceEntry.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "HomeFinanceEntry",
    payload: { id, ownerUserId: mod.billingUserId },
  });
  return NextResponse.json({ ok: true });
}
