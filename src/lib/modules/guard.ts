/**
 * ตรวจสิทธิ์ก่อนเข้าโมดูล (แทน middleware ที่ต้องอ่าน DB)
 *
 * - สายรายวัน: หัก **1 โทเคน ต่อ 1 โมดูล ต่อ 1 วัน Bangkok** (โทเคนไม่พอให้ติดลบ)
 * - แพ็ก 199 ของโมดูลนั้น: ไม่หักรายวัน
 * - ล็อคหนี้ (ติดลบถึงเกณฑ์) → redirect /dashboard/refill
 * - กลุ่มอื่น (ที่เกินสิทธิ์): redirect /dashboard/plans?upgrade=1
 */
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";
import {
  applyModuleDailyTokenDeduction,
  listModuleSlugsChargedToday,
} from "@/lib/tokens/module-daily-deduction";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";

/**
 * ตรวจสิทธิ์โมดูลสำหรับ API route — ห้ามใช้ requireModulePage ใน API
 * เพราะ redirect() จะทำให้ route handler โยน error แล้วกลายเป็น HTTP 500
 * คืน NextResponse แทนเมื่อไม่มีสิทธิ์ (เรียกใช้: const guard = await requireModuleApi(slug); if (guard) return guard;)
 */
export async function requireModuleApi(slug: string): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mod = await prisma.appModule.findFirst({ where: { slug, isActive: true } });
  if (!mod) {
    return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });
  }

  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ใช้โมดูลนี้" }, { status: 403 });
  }

  return null;
}

export async function requireModulePage(slug: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (slug === MQTT_SERVICE_MODULE_SLUG && !isMqttServiceModuleEnabled()) {
    redirect("/dashboard");
  }

  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
  });
  if (!mod) notFound();

  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx) redirect("/login");

  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    redirect("/dashboard");
  }

  // โหลด slug ที่ "หักไปแล้ววันนี้" — เพื่ออนุโลม DAILY user ที่ tokens=0 + หักแล้ว
  const chargedTodaySlugs = await listModuleSlugsChargedToday(ctx.billingUserId);

  if (
    !canAccessAppModule(
      ctx.access,
      { slug: mod.slug, groupId: mod.groupId },
      { chargedTodaySlugs },
    )
  ) {
    if (isTokenDebtLocked(ctx.access.tokens)) {
      redirect("/dashboard/refill");
    }
    redirect("/dashboard/plans?upgrade=1");
  }

  // หักโทเคนต่อโมดูล/วัน — แพ็ก 199 / โมดูลฟรี / แอดมินไม่หัก; ล็อคหนี้ → refill
  const tokenResult = await applyModuleDailyTokenDeduction(ctx.billingUserId, mod.slug);
  if (!tokenResult.ok) {
    redirect("/dashboard/refill");
  }

  return { module: mod, access: ctx.access };
}
