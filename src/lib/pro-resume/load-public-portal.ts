import { prisma } from "@/lib/prisma";
import { PRO_RESUME_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  mapResumeCertificate,
  mapResumeEducation,
  mapResumeExperience,
  mapResumePortfolioCategory,
  mapResumePortfolioItem,
  mapResumeProfile,
  type ResumePublicDto,
} from "@/systems/pro-resume/lib/mappers";

export async function resolveProResumePublicTrialSessionId(
  slug: string,
  trialParam: string | null,
): Promise<string> {
  if (!trialParam) return TRIAL_PROD_SCOPE;
  const row = await prisma.resumeProfile.findFirst({
    where: { slug, trialSessionId: trialParam },
    select: { trialSessionId: true },
  });
  if (!row) return TRIAL_PROD_SCOPE;
  const trial = await prisma.trialSession.findFirst({
    where: { id: trialParam, status: "ACTIVE", expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return trial ? trialParam : TRIAL_PROD_SCOPE;
}

export async function findProResumePublicProfile(slug: string, trialParam: string | null = null) {
  const trialSessionId = await resolveProResumePublicTrialSessionId(slug, trialParam);
  const profile = await prisma.resumeProfile.findFirst({
    where: { slug, trialSessionId, publicEnabled: true },
  });
  if (!profile) return null;
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
    profile.ownerUserId,
    PRO_RESUME_MODULE_SLUG,
  );
  if (!charge.ok) return null;
  return profile;
}

export async function loadProResumePublicPortal(
  slug: string,
  trialParam: string | null = null,
): Promise<ResumePublicDto | null> {
  const profile = await findProResumePublicProfile(slug, trialParam);
  if (!profile) return null;

  const [educations, experiences, certificates, categories, portfolioItems] = await Promise.all([
    prisma.resumeEducation.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.resumeExperience.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.resumeCertificate.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.resumePortfolioCategory.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.resumePortfolioItem.findMany({
      where: { profileId: profile.id },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return {
    profile: mapResumeProfile(profile, trialParam ?? profile.trialSessionId),
    educations: educations.map(mapResumeEducation),
    experiences: experiences.map(mapResumeExperience),
    certificates: certificates.map(mapResumeCertificate),
    categories: categories.map(mapResumePortfolioCategory),
    portfolioItems: portfolioItems.map(mapResumePortfolioItem),
  };
}
