import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { normalizePhone } from "@/lib/car-wash/http";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  customer_name: z.string().min(1).max(160),
  customer_phone: z.string().max(32),
  plate_number: z.string().min(1).max(64),
  package_id: z.number().int().positive().nullable(),
  package_name: z.string().min(1).max(160),
  listed_price: z.number().int().min(0).max(9_999_999),
  final_price: z.number().int().min(0).max(9_999_999),
  note: z.string().max(1000).optional().nullable(),
  recorded_by_name: z.string().max(160).optional().nullable(),
  visit_at: z.string().datetime().optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const rows = await prisma.carWashVisit.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { visitAt: "desc" },
  });
  return NextResponse.json({
    visits: rows.map((r) => ({
      id: r.id,
      visit_at: r.visitAt.toISOString(),
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
      plate_number: r.plateNumber,
      package_id: r.packageId,
      package_name: r.packageName,
      listed_price: r.listedPrice,
      final_price: r.finalPrice,
      note: r.note,
      recorded_by_name: r.recordedByName,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const phone = normalizePhone(parsed.data.customer_phone);

  const row = await prisma.carWashVisit.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      visitAt: parsed.data.visit_at ? new Date(parsed.data.visit_at) : new Date(),
      customerName: parsed.data.customer_name.trim(),
      customerPhone: phone,
      plateNumber: parsed.data.plate_number.trim(),
      packageId: parsed.data.package_id ?? null,
      packageName: parsed.data.package_name.trim(),
      listedPrice: parsed.data.listed_price,
      finalPrice: parsed.data.final_price,
      note: parsed.data.note?.trim() ?? "",
      recordedByName: parsed.data.recorded_by_name?.trim() ?? "",
    },
  });
  return NextResponse.json({
    visit: {
      id: row.id,
      visit_at: row.visitAt.toISOString(),
      customer_name: row.customerName,
      customer_phone: row.customerPhone,
      plate_number: row.plateNumber,
      package_id: row.packageId,
      package_name: row.packageName,
      listed_price: row.listedPrice,
      final_price: row.finalPrice,
      note: row.note,
      recorded_by_name: row.recordedByName,
    },
  });
}
