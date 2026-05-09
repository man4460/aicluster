import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppCompareBarList,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";

export const dynamic = "force-dynamic";

export default async function PromptLibraryHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureDefaultPromptCategories(session.sub);

  const ownerId = session.sub;

  const [total, favorites, usageAgg, topRows, recentRows, catRows] = await Promise.all([
    prisma.promptLibraryPrompt.count({ where: { ownerUserId: ownerId, status: "ACTIVE" } }),
    prisma.promptLibraryPrompt.count({ where: { ownerUserId: ownerId, status: "ACTIVE", isFavorite: true } }),
    prisma.promptLibraryPrompt.aggregate({
      where: { ownerUserId: ownerId, status: "ACTIVE" },
      _sum: { usageCount: true },
    }),
    prisma.promptLibraryPrompt.findMany({
      where: { ownerUserId: ownerId, status: "ACTIVE" },
      orderBy: { usageCount: "desc" },
      take: 5,
      select: { id: true, title: true, usageCount: true },
    }),
    prisma.promptLibraryPrompt.findMany({
      where: { ownerUserId: ownerId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.promptLibraryCategory.findMany({
      where: { ownerUserId: ownerId },
      select: {
        id: true,
        name: true,
        _count: { select: { prompts: { where: { status: "ACTIVE" } } } },
      },
    }),
  ]);

  const totalUsage = usageAgg._sum.usageCount ?? 0;
  const maxCat = Math.max(...catRows.map((c) => c._count.prompts), 1);
  const categoryBars = catRows
    .map((c) => ({
      key: c.id,
      label: `${c.name} · ${c._count.prompts}`,
      amount: c._count.prompts,
      pct: maxCat > 0 ? (c._count.prompts / maxCat) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ภาพรวมคลังคำสั่ง"
          description="สรุปจำนวนคำสั่ง การใช้งาน และหมวดหมู่"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard/prompt-library/prompts"
                aria-label="เปิดคลังคำสั่ง"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
              >
                <span className="hidden sm:inline">คลังคำสั่ง</span>
                <span className="sm:hidden" aria-hidden>
                  📚
                </span>
              </Link>
              <Link
                href="/dashboard/prompt-library/categories"
                aria-label="จัดการหมวดหมู่"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
                )}
              >
                <span className="hidden sm:inline">หมวดหมู่</span>
                <span className="sm:hidden" aria-hidden>
                  📁
                </span>
              </Link>
            </div>
          }
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">คำสั่งทั้งหมด</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">{total}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">รายการโปรด</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">{favorites}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold text-[#66638c]">การใช้งานสะสม (ครั้ง)</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">{totalUsage}</p>
          </div>
        </div>
      </AppDashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppDashboardSection tone="slate">
          <AppSectionHeader tone="slate" title="ใช้บ่อยที่สุด" description="เรียงตามจำนวนครั้งที่กด «ใช้งาน»" />
          {topRows.length === 0 ? (
            <AppEmptyState className="mt-3">
              ยังไม่มีข้อมูลการใช้งาน — เปิดคลังคำสั่งแล้วกด «ใช้งาน» เมื่อคัดลอกไปใช้กับ AI
            </AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {topRows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/55 bg-white/75 px-3 py-2 text-sm"
                >
                  <Link href="/dashboard/prompt-library/prompts" className="min-w-0 truncate font-semibold text-[#2e2a58]">
                    {r.title}
                  </Link>
                  <span className="shrink-0 text-xs font-bold text-[#4d47b6]">{r.usageCount} ครั้ง</span>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>

        <AppDashboardSection tone="slate">
          <AppSectionHeader tone="slate" title="เพิ่งแก้ไข" description="อัปเดตล่าสุด" />
          {recentRows.length === 0 ? (
            <AppEmptyState className="mt-3">ยังไม่มีคำสั่ง — สร้างคำสั่งแรกในหน้า «คลังคำสั่ง»</AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentRows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/55 bg-white/75 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold text-[#2e2a58]">{r.title}</span>
                  <span className="shrink-0 text-xs text-[#66638c]">
                    {new Date(r.updatedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      </div>

      <AppDashboardSection tone="violet">
        <AppCompareBarList
          title="จำนวนตามหมวด"
          subtitle="เทียบสัดส่วนคำสั่งในแต่ละหมวด"
          emptyText="ไม่มีหมวด — เพิ่มหมวดในหน้า «หมวดหมู่»"
          rows={categoryBars}
          variant="brand"
        />
      </AppDashboardSection>

      <p className="text-center text-xs text-[#66638c]">
        เคล็ดลับ: ใช้ «ส่งออก JSON» ในแถบเครื่องมือคลังเพื่อสำรอง — นำเข้ากลับได้ในหน้าเดียวกัน
      </p>
    </div>
  );
}
