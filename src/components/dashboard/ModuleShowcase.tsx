import Link from "next/link";
import { cn } from "@/lib/cn";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import type { UserAccessFields } from "@/lib/modules/access";
import { canAccessAppModule } from "@/lib/modules/access";
import { MODULE_GROUP_TIER_NAME } from "@/lib/modules/config";

export type ModuleCardDTO = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  groupId: number;
};

type Props = {
  modules: ModuleCardDTO[];
  access: UserAccessFields;
};

const groupAccent: Record<number, string> = {
  1: "from-violet-600/90 to-indigo-900",
  2: "from-emerald-600/90 to-teal-900",
  3: "from-amber-600/90 to-orange-900",
  4: "from-sky-600/90 to-blue-900",
  5: "from-rose-600/90 to-red-900",
};

export function ModuleShowcase({ modules, access }: Props) {
  return (
    <section id="systems" className="scroll-mt-4 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">ระบบทั้งหมด</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {modules.map((m) => {
          const unlocked = canAccessAppModule(access, { slug: m.slug, groupId: m.groupId });
          return <ModuleNetflixCard key={m.id} module={m} unlocked={unlocked} />;
        })}
      </div>
    </section>
  );
}

function ModuleNetflixCard({
  module: m,
  unlocked,
}: {
  module: ModuleCardDTO;
  unlocked: boolean;
}) {
  const grad = groupAccent[m.groupId] ?? "from-slate-600 to-slate-900";
  const tierName = MODULE_GROUP_TIER_NAME[m.groupId];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-slate-900 shadow-md transition",
        unlocked
          ? "border-slate-200/80 ring-0 hover:ring-2 hover:ring-[#0000BF]/30"
          : "border-slate-300/80 opacity-95",
      )}
    >
      <div className={cn("relative aspect-[16/10] bg-gradient-to-br", grad)}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="absolute bottom-2 left-2 right-2">
          <span className="inline-block rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            กลุ่ม {m.groupId}
            {tierName ? ` · ${tierName}` : ""}
          </span>
        </div>
        {!unlocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
            <LockIcon className="h-10 w-10 text-white/95 drop-shadow-md" />
          </div>
        ) : null}
      </div>
      <div className="space-y-2 bg-white p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{m.title}</h3>
        {m.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{m.description}</p>
        ) : null}
        {unlocked ? (
          <Link
            href={dashboardModuleHref(m.slug)}
            className="flex w-full items-center justify-center rounded-lg bg-[#0000BF] py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0000a3]"
          >
            เข้าใช้งาน
          </Link>
        ) : (
          <Link
            href="/dashboard/plans?upgrade=1"
            className="flex w-full items-center justify-center rounded-lg border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100"
          >
            อัปเกรดแพ็กเกจ
          </Link>
        )}
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
