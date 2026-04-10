"use client";

import { useMemo, useState } from "react";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";
import { villageField } from "@/systems/village/village-ui";
import { cn } from "@/lib/cn";

function IconTable({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
      <path d="M16 10v8M12 14h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M9 2h6l1 3h4v16l-3-2-3 2-3-2-3 2-3-2-3 2V5h4l1-3z" strokeLinejoin="round" />
      <path d="M9 10h6M9 14h4" strokeLinecap="round" />
    </svg>
  );
}

function IconHomes({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 19V5M8 19V11M12 19V8M16 19v-5M20 19V9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M12 3v12M8 11l4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ExportRowProps = {
  icon: React.ReactNode;
  tone: string;
  title: string;
  hint: string;
  href: string;
  cta: string;
  primary?: boolean;
};

function ExportRow({ icon, tone, title, hint, href, cta, primary }: ExportRowProps) {
  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 p-3 shadow-sm ring-1 ring-slate-100/80 transition",
        "hover:border-[#4d47b6]/20 hover:shadow-md",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-400/80 via-violet-300/70 to-emerald-400/75 opacity-90"
        aria-hidden
      />
      <div className="flex gap-3 pt-0.5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-inner", tone)} aria-hidden>
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <h3 className="text-sm font-bold leading-tight text-slate-900">{title}</h3>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">{hint}</p>
          </div>
          <a
            href={href}
            className={cn(
              "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.99] sm:min-h-0 sm:w-auto sm:self-start",
              primary
                ? "app-btn-primary text-white"
                : "app-btn-soft text-[#66638c] hover:bg-slate-50",
            )}
          >
            <IconDownload className="h-4 w-4 shrink-0 opacity-90" />
            {cta}
          </a>
        </div>
      </div>
    </li>
  );
}

export function VillageReportsClient({ initialYear }: { initialYear: number }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [year, setYear] = useState(initialYear);

  return (
    <VillagePageStack>
      <VillagePanelCard
        title="ส่งออก CSV"
        description="ดาวน์โหลดจากลิงก์ด้านล่าง — ต้องล็อกอินในแท็บเดียวกับที่ใช้งานระบบ"
      >
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
            ปีปฏิทิน ค.ศ.
          </span>
          <span className="inline-flex items-center rounded-lg bg-indigo-50/90 px-2.5 py-1 text-[10px] font-semibold text-indigo-900/90 ring-1 ring-indigo-200/60">
            เวลาไทย (กรุงเทพ)
          </span>
          <span className="inline-flex items-center rounded-lg bg-amber-50/90 px-2.5 py-1 text-[10px] font-semibold text-amber-900/80 ring-1 ring-amber-200/70">
            ลูกบ้านไม่ผูกปี
          </span>
        </div>

        <div className="mt-3.5">
          <label className="block max-w-[9rem]">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6366f1]" aria-hidden />
              ปีสำหรับส่งออก
            </span>
            <input
              type="number"
              min={2000}
              max={2100}
              className={cn("block w-full text-center text-sm font-bold tabular-nums", villageField)}
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value, 10) || year)}
              aria-label="ปีสำหรับส่งออก"
            />
          </label>
        </div>

        <p className="mt-3 border-t border-slate-200/70 pt-3 text-[10px] leading-relaxed text-slate-400">
          รายการที่อ้างปี (บิล / สลิป / สรุป) ใช้ค่าปีด้านบน · ส่งออกลูกบ้านไม่กรองตามปี
        </p>

        <ul className="mt-4 grid list-none gap-2.5 sm:grid-cols-2">
          <ExportRow
            icon={<IconTable className="h-5 w-5 text-[#3730a3]" />}
            tone="bg-[#4d47b6]/12"
            title="ค่าส่วนกลาง"
            hint="บิลรายเดือนทุกแถวในปีที่เลือก"
            href={api.exportUrl("fees", year)}
            cta={`ดาวน์โหลด · ${year}`}
            primary
          />
          <ExportRow
            icon={<IconReceipt className="h-5 w-5 text-emerald-700" />}
            tone="bg-emerald-100/90"
            title="สลิปโอน"
            hint="ประวัติส่งสลิปในปีนั้น (สูงสุด 5,000 แถว/ไฟล์)"
            href={api.exportUrl("slips", year)}
            cta={`ดาวน์โหลด · ${year}`}
          />
          <ExportRow
            icon={<IconHomes className="h-5 w-5 text-sky-700" />}
            tone="bg-sky-100/90"
            title="ลูกบ้าน"
            hint="แปลง บ้าน และผู้พักอาศัยที่ใช้งาน"
            href={api.exportUrl("residents")}
            cta="ดาวน์โหลด"
          />
          <ExportRow
            icon={<IconChart className="h-5 w-5 text-amber-800" />}
            tone="bg-amber-100/90"
            title="สรุป 12 เดือน"
            hint="ยอดรวมรายเดือน จำนวนบิล และอัตราเก็บได้"
            href={api.exportUrl("annual_summary", year)}
            cta={`ดาวน์โหลด · ${year}`}
          />
        </ul>
      </VillagePanelCard>
    </VillagePageStack>
  );
}
