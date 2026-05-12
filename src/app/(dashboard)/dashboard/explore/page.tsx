import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/ui/page-container";
import { DashboardSystemShortcutGrid } from "@/components/dashboard/DashboardSystemShortcutGrid";
import {
  DASHBOARD_LIVE_SYSTEMS,
  DASHBOARD_ROADMAP_SYSTEMS,
  type DashboardSystemCard,
} from "@/lib/dashboard-system-catalog";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";

export const metadata: Metadata = {
  title: "แผนผังระบบ | MAWELL Buffet",
};

export default async function SystemsExplorePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const rows = await prisma.appModule.findMany({
    where: { isActive: true },
    select: { slug: true, cardImageUrl: true, groupId: true },
  });

  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.cardImageUrl]));
  const liveItems: DashboardSystemCard[] = DASHBOARD_LIVE_SYSTEMS.map(({ moduleSlug, ...card }) => ({
    ...card,
    imageUrl: moduleSlug
      ? resolveModuleCardDisplayImageUrl(moduleSlug, bySlug[moduleSlug] ?? null)
      : card.imageUrl,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="แผนผังระบบ"
        description="ลิงก์โมดูลที่เปิดใช้งานและเส้นทางในแผนพัฒนา"
      />
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#0000BF]">
          เปิดใช้งาน / มีหน้าหลัก
        </h2>
        <DashboardSystemShortcutGrid items={liveItems} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          วางโครง route แล้ว (รอพัฒนา)
        </h2>
        <DashboardSystemShortcutGrid
          items={DASHBOARD_ROADMAP_SYSTEMS.map((card) => ({
            ...card,
            imageUrl:
              card.moduleSlug != null
                ? resolveModuleCardDisplayImageUrl(card.moduleSlug, bySlug[card.moduleSlug] ?? null)
                : card.imageUrl,
          }))}
        />
      </section>
    </PageContainer>
  );
}
