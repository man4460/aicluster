import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { applyBarberModuleTokenDeduction } from "./barber-module-deduction";

/** Layout ใต้ /dashboard/barber — สิทธิ์ตามเจ้าของ + หักโทเคนรายวันที่บัญชีเจ้าของ */
export async function requireBarberSection() {
  const session = await getSession();
  if (!session) redirect("/login");

  const mod = await prisma.appModule.findFirst({
    where: { slug: BARBER_MODULE_SLUG, isActive: true },
  });
  if (!mod) notFound();

  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx) redirect("/login");

  if (!canAccessAppModule(ctx.access, { slug: mod.slug, groupId: mod.groupId })) {
    redirect("/dashboard/plans?upgrade=1");
  }

  const tokenResult = await applyBarberModuleTokenDeduction(ctx.billingUserId);
  if (!tokenResult.ok) {
    redirect("/dashboard/refill");
  }
}
