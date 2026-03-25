import { prisma } from "@/lib/prisma";
import type { UserAccessFields } from "@/lib/modules/access";

/** หักโทเคน/เช็คแพ็กใช้ billingUserId — พนักงาน (employerUserId) ใช้สิทธิ์เจ้าของ */
export type ModuleBillingContext = {
  actorUserId: string;
  billingUserId: string;
  isStaff: boolean;
  access: UserAccessFields;
};

export async function getModuleBillingContext(actorUserId: string): Promise<ModuleBillingContext | null> {
  const u = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: {
      employerUserId: true,
      role: true,
      subscriptionType: true,
      subscriptionTier: true,
      tokens: true,
    },
  });
  if (!u) return null;
  if (u.employerUserId) {
    const boss = await prisma.user.findUnique({
      where: { id: u.employerUserId },
      select: { role: true, subscriptionType: true, subscriptionTier: true, tokens: true },
    });
    if (!boss) return null;
    return {
      actorUserId,
      billingUserId: u.employerUserId,
      isStaff: true,
      access: {
        role: boss.role,
        subscriptionType: boss.subscriptionType,
        subscriptionTier: boss.subscriptionTier,
        tokens: boss.tokens,
      },
    };
  }
  return {
    actorUserId,
    billingUserId: actorUserId,
    isStaff: false,
    access: {
      role: u.role,
      subscriptionType: u.subscriptionType,
      subscriptionTier: u.subscriptionTier,
      tokens: u.tokens,
    },
  };
}
