import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";
import { applyDormitoryModuleTokenDeduction } from "./dormitory-module-deduction";

/**
 * Layout ใต้ /dashboard/dormitory — ตรวจสิทธิ์โมดูล + หักโทเคนสายรายวัน
 */
export async function requireDormitorySection() {
  const session = await getSession();
  if (!session) redirect("/login");

  const mod = await prisma.appModule.findFirst({
    where: { slug: DORMITORY_MODULE_SLUG, isActive: true },
  });
  if (!mod) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      employerUserId: true,
      role: true,
      subscriptionType: true,
      subscriptionTier: true,
      tokens: true,
    },
  });
  if (!user) redirect("/login");
  if (user.employerUserId) redirect("/dashboard");

  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };

  if (!canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId })) {
    redirect("/dashboard/plans?upgrade=1");
  }

  const tokenResult = await applyDormitoryModuleTokenDeduction(session.sub);
  if (!tokenResult.ok) {
    redirect("/dashboard/refill");
  }
}
