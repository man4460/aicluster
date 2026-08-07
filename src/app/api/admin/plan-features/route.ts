import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { getPlanFeaturePolicy, updatePlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";

const patchSchema = z.object({
  dataRowLimitEnabled: z.boolean().optional(),
  dailyMaxDataRows: z.number().int().min(1).max(10_000_000).optional(),
  monthlyDataRowsThreshold: z.number().int().min(1).max(10_000_000).optional(),
  slipPrintGateEnabled: z.boolean().optional(),
  slipUploadGateEnabled: z.boolean().optional(),
  documentUploadGateEnabled: z.boolean().optional(),
  multiKitchenGateEnabled: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  const policy = await getPlanFeaturePolicy();
  return NextResponse.json({ policy });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
  }

  try {
    const policy = await updatePlanFeaturePolicy(parsed.data, auth.session.sub);
    return NextResponse.json({ ok: true, policy });
  } catch (e) {
    console.error("[admin/plan-features PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
