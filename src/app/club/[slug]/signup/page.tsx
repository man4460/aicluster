import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { ClubEventPublicSignupClient } from "@/systems/club-event/components/ClubEventPublicSignupClient";
import { clubEventDuesPeriodForDate, type ClubEventDuesPeriodKey } from "@/systems/club-event/lib/dues";
import { resolvePortalSignupCollectDues } from "@/systems/club-event/lib/portal-signup";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
};

function parseDuesPeriod(raw: string): ClubEventDuesPeriodKey {
  if (raw === "MONTHLY" || raw === "QUARTERLY" || raw === "SEMIANNUAL" || raw === "YEARLY") return raw;
  return "YEARLY";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `สมัครสมาชิก · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function ClubPublicSignupPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t } = await searchParams;
  const profile = await findClubEventPublicProfile(slug, t ?? null);
  if (!profile || !profile.portalSignupEnabled) notFound();

  const collectDues = resolvePortalSignupCollectDues({
    portalSignupCollectDues: profile.portalSignupCollectDues,
    duesEnabled: profile.duesEnabled,
    duesAmountBaht: profile.duesAmountBaht,
  });
  const period = parseDuesPeriod(profile.duesPeriod);
  const duesMeta =
    collectDues !== "OFF"
      ? {
          ...clubEventDuesPeriodForDate(period),
          amountBaht: Math.max(0, Math.round(Number(profile.duesAmountBaht) || 0)),
        }
      : null;

  return (
    <ClubEventPublicSignupClient
      slug={slug}
      trialParam={t}
      initialData={{
        ownerId: profile.ownerUserId,
        clubName: profile.displayName,
        logoUrl: profile.logoUrl ?? null,
        bannerUrl: profile.portalBannerUrl ?? null,
        slug: profile.slug,
        tagline: profile.tagline ?? null,
        paymentRulesNote: profile.paymentRulesNote ?? "",
        signupEnabled: true,
        collectDues,
        dues: duesMeta,
      }}
    />
  );
}
