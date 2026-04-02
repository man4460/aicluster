import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { canStartTrialForModule } from "@/lib/modules/access";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { listTrialModuleIds, startTrial } from "@/lib/modules/trial-store";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";

const bodySchema = z.object({
  moduleId: z.string().min(1),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const moduleIds = await listTrialModuleIds(auth.session.sub);
  return NextResponse.json({ moduleIds });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "moduleId ไม่ถูกต้อง" }, { status: 400 });

  const mod = await prisma.appModule.findUnique({
    where: { id: parsed.data.moduleId },
    select: { id: true, slug: true, groupId: true, isActive: true },
  });
  if (!mod || !mod.isActive) return NextResponse.json({ error: "ไม่พบระบบ" }, { status: 404 });
  if (mod.slug === MQTT_SERVICE_MODULE_SLUG && !isMqttServiceModuleEnabled()) {
    return NextResponse.json({ error: "ระบบบริการ MQTT ปิดโหมดทดลองชั่วคราว" }, { status: 403 });
  }

  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    return NextResponse.json({ error: "สิทธิ์พนักงานไม่รองรับระบบนี้" }, { status: 403 });
  }
  if (!canStartTrialForModule(ctx.access, { slug: mod.slug, groupId: mod.groupId })) {
    return NextResponse.json(
      { error: "ไม่สามารถทดลองได้ — กรุณาเติมโทเคนหรืออัปเกรดแพ็กเกจ" },
      { status: 403 },
    );
  }
  if (ctx.access.role !== "ADMIN" && ctx.access.subscriptionType !== "BUFFET") {
    const subscribedIds = await listSubscribedModuleIds(auth.session.sub);
    const trialIds = await listTrialModuleIds(auth.session.sub);
    /** จำกัดแค่ Subscribe 1 ระบบ — ทดลองระบบอื่นได้เพื่อดูก่อนอัปเกรดแพ็กเกจ */
    if (subscribedIds.includes(mod.id)) {
      return NextResponse.json({ error: "Subscribe ระบบนี้อยู่แล้ว" }, { status: 400 });
    }
    if (trialIds.includes(mod.id)) {
      return NextResponse.json({ error: "กำลังทดลองระบบนี้อยู่แล้ว" }, { status: 400 });
    }
  }

  await startTrial(auth.session.sub, mod.id);
  return NextResponse.json({ ok: true });
}

