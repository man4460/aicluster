/**
 * ตรวจสิทธิ์ก่อนเข้าโมดูล (แทน middleware ที่ต้องอ่าน DB)
 * สายรายวัน: กลุ่ม 1 = เช็คชื่อ · หอพัก · รายรับ-รายจ่าย (หอพักหักโทเคนใน dormitory layout)
 * อื่น ๆ → redirect /dashboard/plans?upgrade=1
 */
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";

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

  if (!canAccessAppModule(ctx.access, { slug: mod.slug, groupId: mod.groupId })) {
    redirect("/dashboard/plans?upgrade=1");
  }

  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    redirect("/dashboard");
  }

  return { module: mod, access: ctx.access };
}
