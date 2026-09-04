import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Db = Pick<PrismaClient, "resumeProfile" | "user">;

function defaultSlugFromUser(username: string, ownerUserId: string): string {
  const base = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (base.length >= 3) return base;
  return `resume-${ownerUserId.slice(0, 8)}`;
}

export async function ensureResumeProfile(
  db: Db,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
) {
  const existing = await db.resumeProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  const user = await db.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true },
  });
  const username = user?.username ?? "resume";
  let slug = defaultSlugFromUser(username, ownerUserId);
  let suffix = 0;
  while (
    await db.resumeProfile.findFirst({
      where: { slug, trialSessionId },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${defaultSlugFromUser(username, ownerUserId)}-${suffix}`;
  }

  return db.resumeProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      slug,
      fullName: username,
      positionTitle: "",
      bio: "",
      isPremium: false,
      publicEnabled: true,
    },
  });
}
