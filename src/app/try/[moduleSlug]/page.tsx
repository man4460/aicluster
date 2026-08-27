import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemoAccountConfiguredForEntry } from "@/lib/auth/demo-account";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import { moduleTryDashboardHref } from "@/lib/modules/try-link";
import { prisma } from "@/lib/prisma";
import { ModuleTryPromoClient } from "@/systems/try-promo/ModuleTryPromoClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ moduleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleSlug } = await params;
  const slug = decodeURIComponent(moduleSlug).trim();
  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { title: true },
  });
  return {
    title: mod ? `ทดลอง ${mod.title} | MAWELL` : "ทดลองใช้งาน | MAWELL",
  };
}

/**
 * ลิงก์/QR สาธารณะต่อโมดูล — หน้าเว็บโฆษณา (แบนเนอร์ · ฟีเจอร์ · วิดีโอ YouTube · CTA)
 * คลิปตั้งจากแอดมินที่ /dashboard/admin/module-try-links
 */
export default async function ModuleTryPage({ params }: Props) {
  const { moduleSlug } = await params;
  const slug = decodeURIComponent(moduleSlug).trim();
  if (!slug) notFound();

  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { slug: true, title: true, cardImageUrl: true },
  });
  if (!mod) notFound();

  const dashboardHref = moduleTryDashboardHref(mod.slug);
  const loginHref = `/login?next=${encodeURIComponent(dashboardHref)}`;
  const registerHref = `/register?next=${encodeURIComponent(dashboardHref)}`;
  const demoConfigured = isDemoAccountConfiguredForEntry();
  const tryHref = demoConfigured
    ? `/api/auth/demo/enter?next=${encodeURIComponent(dashboardHref)}`
    : loginHref;

  const cover = resolveModuleCardDisplayImageUrl(mod.slug, mod.cardImageUrl);

  return (
    <ModuleTryPromoClient
      moduleTitle={mod.title}
      moduleSlug={mod.slug}
      tryHref={tryHref}
      registerHref={registerHref}
      initialBanner={cover}
    />
  );
}
