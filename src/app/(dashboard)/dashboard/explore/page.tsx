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
import { UI_VISIBLE_MAX_MODULE_GROUP } from "@/lib/module-permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "แผนผังระบบ | MAWELL Buffet",
};

export default async function SystemsExplorePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true },
  });
  if (!user) redirect("/login");

  const rows = await prisma.appModule.findMany({
    where: { isActive: true },
    select: { slug: true, cardImageUrl: true, groupId: true },
  });

  const allowedSlugs = new Set(
    rows.filter((r) => r.groupId <= UI_VISIBLE_MAX_MODULE_GROUP).map((r) => r.slug),
  );
  const liveCatalog =
    user.role === "ADMIN"
      ? DASHBOARD_LIVE_SYSTEMS
      : DASHBOARD_LIVE_SYSTEMS.filter((e) => !e.moduleSlug || allowedSlugs.has(e.moduleSlug));

  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.cardImageUrl]));
  const liveItems: DashboardSystemCard[] = liveCatalog.map(({ moduleSlug, ...card }) => ({
    ...card,
    imageUrl: moduleSlug ? (bySlug[moduleSlug] ?? null) : card.imageUrl,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="แผนผังระบบ"
        description={
          user.role === "ADMIN"
            ? "ลิงก์โมดูลที่เปิดใช้งานและเส้นทางในแผนพัฒนา"
            : "เฉพาะระบบกลุ่ม 1 ที่เปิดให้บริการ — กลุ่มอื่นซ่อนชั่วคราว"
        }
      />
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#0000BF]">
          เปิดใช้งาน / มีหน้าหลัก
        </h2>
        <DashboardSystemShortcutGrid items={liveItems} />
      </section>
      {user.role === "ADMIN" ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            วางโครง route แล้ว (รอพัฒนา)
          </h2>
          <DashboardSystemShortcutGrid items={DASHBOARD_ROADMAP_SYSTEMS} />
        </section>
      ) : null}
    </PageContainer>
  );
}
