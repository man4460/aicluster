import type { PrismaClient } from "@/generated/prisma/client";
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Db = Pick<PrismaClient, "clubEventProfile" | "user">;

function defaultSlugFromUser(username: string, ownerUserId: string): string {
  const base = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (base.length >= 3) return base;
  return `club-${ownerUserId.slice(0, 8)}`;
}

export async function ensureClubEventProfile(
  db: Db,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
) {
  const existing = await db.clubEventProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  const user = await db.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true },
  });
  const username = user?.username ?? "club";
  let slug = defaultSlugFromUser(username, ownerUserId);
  let suffix = 0;
  while (
    await db.clubEventProfile.findFirst({
      where: { slug, trialSessionId },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${defaultSlugFromUser(username, ownerUserId)}-${suffix}`;
  }

  try {
    return await db.clubEventProfile.create({
      data: {
        ownerUserId,
        trialSessionId,
        slug,
        displayName: "ชมรมของฉัน",
        rulesMarkdown: "",
        committeeJson: "[]",
      },
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      const raced = await db.clubEventProfile.findUnique({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      });
      if (raced) return raced;
    }
    throw e;
  }
}
