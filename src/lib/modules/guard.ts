/**
 * ตรวจสิทธิ์ก่อนเข้าโมดูล (แทน middleware ที่ต้องอ่าน DB)
 *
 * - สายรายวัน (DAILY) สามารถเข้าใช้ "หลายโมดูลในกลุ่ม 1 ได้" (ไม่จำกัดเฉพาะเช็คอิน)
 *   โดยหัก **1 โทเคน ต่อ 1 โมดูล ต่อ 1 วัน Bangkok** ผ่าน `applyModuleDailyTokenDeduction` (ยกเว้น slug ใน `DAILY_TOKEN_EXEMPT_MODULE_SLUGS` เช่น คิวหน้าร้าน)
 *   ถ้าโทเคนหมด → redirect /dashboard/refill
 * - แพ็กเหมา (BUFFET) / ADMIN / staff: ไม่หักโทเคน
 * - กลุ่มอื่น (ที่เกินสิทธิ์): redirect /dashboard/plans?upgrade=1
 */
import { notFound, redirect } from "next/navigation";
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
    redirect("/dashboard/plans?upgrade=1");
  }

  // หักโทเคนต่อโมดูล/วัน — ADMIN/BUFFET ผ่าน exempt; DAILY ที่หักแล้วก็ผ่าน (already_charged)
  const tokenResult = await applyModuleDailyTokenDeduction(ctx.billingUserId, mod.slug);
  if (!tokenResult.ok) {
    redirect("/dashboard/refill");
  }

  return { module: mod, access: ctx.access };
}
