import { PRO_RESUME_MODULE_SLUG } from "@/lib/modules/config";
import { hasMonthly199ForModule, type UserAccessFields } from "@/lib/modules/access";
import type { PrismaClient } from "@/generated/prisma/client";

type Db = Pick<PrismaClient, "resumeProfile">;

export function proResumeHasMonthlyPlan(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): boolean {
  return hasMonthly199ForModule(access, PRO_RESUME_MODULE_SLUG);
}

export async function syncProResumeIsPremium(
  db: Db,
  profileId: string,
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): Promise<boolean> {
  const isPremium = proResumeHasMonthlyPlan(access);
  await db.resumeProfile.update({
    where: { id: profileId },
    data: { isPremium },
  });
  return isPremium;
}
