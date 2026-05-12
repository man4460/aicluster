import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";

export const dynamic = "force-dynamic";

const statCardClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/60 via-indigo-50/25 to-violet-100/15 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-5";

const categoryTileClass =
  "flex flex-col justify-between gap-3 rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-100/10 p-4 shadow-sm ring-1 ring-inset ring-white/45 backdrop-blur-md sm:rounded-[2rem] sm:p-5";

const listRowClass =
  "flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-indigo-50/10 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm transition hover:border-[#5b61ff]/25 hover:shadow-md sm:px-4";

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
  const categoryTiles = [...catRows]
    .map((c) => {
      const count = c._count.prompts;
      const sharePct = total > 0 ? (count / total) * 100 : 0;
      return { id: c.id, name: c.name, count, sharePct };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-6",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
              aria-hidden
            >
              <IconSparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                  ภาพรวมคลังคำสั่ง
                </span>
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
                สรุปจำนวนคำสั่ง การใช้งาน และหมวดหมู่ — กดทางลัดด้านขวาเพื่อจัดการคำสั่งหรือหมวดได้ทันที
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard/prompt-library/prompts"
              aria-label="เปิดคลังคำสั่ง"
              className={cn(
                appDashboardBrandCtaPillButtonClass,
                "min-h-[40px] min-w-[40px] rounded-xl px-0 sm:min-w-0 sm:rounded-full sm:px-5",
              )}
            >
              <IconLibrary className="h-5 w-5 shrink-0 sm:mr-1.5" />
              <span className="hidden sm:inline">คลังคำสั่ง</span>
            </Link>
            <Link
              href="/dashboard/prompt-library/categories"
              aria-label="จัดการหมวดหมู่"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 rounded-xl px-0 sm:min-w-0 sm:gap-2 sm:rounded-xl sm:px-4",
              )}
            >
              <IconFolder className="h-5 w-5 shrink-0 sm:mr-0" />
              <span className="hidden sm:inline">หมวดหมู่</span>
            </Link>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-white/40 pt-5 sm:grid-cols-3">
          <li>
            <div className={statCardClass}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">คำสั่งทั้งหมด</p>
              <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-3xl">{total}</p>
            </div>
          </li>
          <li>
            <div className={statCardClass}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายการโปรด</p>
              <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-violet-700 sm:text-3xl">{favorites}</p>
            </div>
          </li>
          <li className="col-span-2 sm:col-span-1">
            <div className={statCardClass}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">การใช้งานสะสม</p>
              <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-3xl">{totalUsage}</p>
              <p className="mt-1 text-[10px] font-bold text-[#66638c]">ครั้งที่กด «ใช้งาน»</p>
            </div>
          </li>
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            title="ใช้บ่อยที่สุด"
            description="เรียงตามจำนวนครั้งที่กด «ใช้งาน»"
            action={
              <Link
                href="/dashboard/prompt-library/prompts"
                aria-label="ไปหน้าคลังคำสั่ง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-0 sm:min-w-0 sm:px-3",
                )}
              >
                <IconChevronRight className="h-5 w-5" />
              </Link>
            }
          />
          {topRows.length === 0 ? (
            <AppEmptyState tone="violet" className="mt-3">
              ยังไม่มีข้อมูลการใช้งาน — เปิดคลังคำสั่งแล้วกด «ใช้งาน» เมื่อคัดลอกไปใช้กับ AI
            </AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {topRows.map((r) => (
                <li key={r.id}>
                  <div className={listRowClass}>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-[#5b61ff] shadow-sm">
                        <IconTrending className="h-5 w-5" />
                      </div>
                      <Link
                        href="/dashboard/prompt-library/prompts"
                        className="min-w-0 truncate font-bold text-[#2e2a58] transition hover:text-[#5b61ff]"
                      >
                        {r.title}
                      </Link>
                    </div>
                    <span className="shrink-0 text-xs font-black tabular-nums text-[#4d47b6]">{r.usageCount} ครั้ง</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>

        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            title="เพิ่งแก้ไข"
            description="อัปเดตล่าสุดจากคลังของคุณ"
            action={
              <Link
                href="/dashboard/prompt-library/prompts"
                aria-label="ไปหน้าคลังคำสั่ง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-0 sm:min-w-0 sm:px-3",
                )}
              >
                <IconChevronRight className="h-5 w-5" />
              </Link>
            }
          />
          {recentRows.length === 0 ? (
            <AppEmptyState tone="violet" className="mt-3">
              ยังไม่มีคำสั่ง — สร้างคำสั่งแรกในหน้า «คลังคำสั่ง»
            </AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentRows.map((r) => (
                <li key={r.id}>
                  <div className={listRowClass}>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-[#5b61ff] shadow-sm">
                        <IconClock className="h-5 w-5" />
                      </div>
                      <span className="min-w-0 truncate font-bold text-[#2e2a58]">{r.title}</span>
                    </div>
                    <span className="shrink-0 text-right text-[11px] font-semibold tabular-nums text-[#66638c]">
                      {new Date(r.updatedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      </div>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="จำนวนตามหมวด"
          description={
            total > 0
              ? `แต่ละช่องแสดงจำนวนในหมวดและสัดส่วนจากคำสั่งทั้งหมด ${total.toLocaleString("th-TH")} รายการ`
              : "ยังไม่มีคำสั่งที่นับในหมวด — เพิ่มคำสั่งแล้วจัดหมวดให้ครบ"
          }
        />
        {categoryTiles.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-3">
            ไม่มีหมวด — เพิ่มหมวดในหน้า «หมวดหมู่»
          </AppEmptyState>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {categoryTiles.map((c, index) => (
              <li
                key={c.id}
                className={cn(
                  index === categoryTiles.length - 1 && categoryTiles.length % 2 === 1 && "col-span-2 lg:col-span-1",
                )}
              >
                <div className={categoryTileClass}>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">หมวด</p>
                    <p className="mt-1 truncate text-sm font-black text-[#1e1b4b]" title={c.name}>
                      {c.name}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2 border-t border-white/50 pt-3">
                    <div>
                      <p className="text-2xl font-black tabular-nums leading-none text-[#4d47b6] sm:text-3xl">
                        {c.count.toLocaleString("th-TH")}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#66638c]">คำสั่งในหมวด</p>
                    </div>
                    {total > 0 ? (
                      <p className="shrink-0 text-right text-xs font-black tabular-nums text-emerald-700">
                        {new Intl.NumberFormat("th-TH", {
                          maximumFractionDigits: 1,
                          minimumFractionDigits: 0,
                        }).format(c.sharePct)}
                        %
                      </p>
                    ) : (
                      <p className="shrink-0 text-right text-xs font-bold tabular-nums text-[#66638c]">0%</p>
                    )}
                  </div>
                  {total > 0 ? (
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#ecebff]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5b61ff] to-[#a855f7] transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, c.sharePct))}%` }}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 rounded-full bg-[#ecebff]/80" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <div
        className={cn(
          "rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-indigo-50/50 via-white/40 to-violet-50/30 p-4 text-center text-sm leading-relaxed text-[#5f5a8a] shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur-md sm:rounded-[2rem] sm:p-5",
        )}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <IconLightbulb className="h-4 w-4 shrink-0 text-[#5b61ff]" aria-hidden />
          <span>
            <span className="font-bold text-[#1e1b4b]">เคล็ดลับ:</span> ใช้ «ส่งออก JSON» ในแถบเครื่องมือคลังเพื่อสำรอง — นำเข้ากลับได้ในหน้าเดียวกัน
          </span>
        </span>
      </div>
    </div>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M9.5 2 8 8l-6 1.5L8 11l1.5 6L11 11l6-1.5L11 8 9.5 2Z" strokeLinejoin="round" />
      <path d="M18 14.5 17 17l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconLibrary({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7h8M8 11h6" strokeLinecap="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrending({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 7l-8.5 8.5-4-4L2 17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M9 18h6M10 22h4" strokeLinecap="round" />
      <path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2z" strokeLinejoin="round" />
    </svg>
  );
}
