"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository } from "@/systems/village/village-service";

function IconTable({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
      <path d="M16 10v8M12 14h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 2h6l1 3h4v16l-3-2-3 2-3-2-3 2-3-2-3 2V5h4l1-3z" strokeLinejoin="round" />
      <path d="M9 10h6M9 14h4" strokeLinecap="round" />
    </svg>
  );
}

function IconHomes({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19V5M8 19V11M12 19V8M16 19v-5M20 19V9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M8 11l4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

type ExportCardProps = {
  icon: React.ReactNode;
  tone: string;
  title: string;
  hint: string;
  href: string;
  cta: string;
  primary?: boolean;
};

function ExportCard({ icon, tone, title, hint, href, cta, primary }: ExportCardProps) {
  return (
    <li className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-sm transition hover:border-[#0000BF]/25 hover:shadow-md">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{hint}</p>
      <a
        href={href}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          primary
            ? "bg-[#0000BF] text-white hover:bg-[#0000a3]"
            : "border border-slate-200 bg-white text-slate-800 hover:border-[#0000BF]/30 hover:bg-[#0000BF]/[0.04]"
        }`}
      >
        <IconDownload />
        {cta}
      </a>
    </li>
  );
}

export function VillageReportsClient({ initialYear }: { initialYear: number }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [year, setYear] = useState(initialYear);

  return (
    <div className="space-y-8">
      <PageHeader title="ส่งออกรายงาน" description="ไฟล์ CSV เปิดใน Microsoft Excel ได้ทันที" />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <IconCalendar className="shrink-0 text-[#0000BF]" />
          ปีปฏิทิน (กรุงเทพ)
        </span>
        <input
          type="number"
          min={2000}
          max={2100}
          className="w-28 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none transition focus:border-[#0000BF]/40 focus:ring-2 focus:ring-[#0000BF]/15"
          value={year}
          onChange={(e) => setYear(Number.parseInt(e.target.value, 10) || year)}
          aria-label="ปีสำหรับส่งออก"
        />
        <span className="text-xs text-slate-500">ใช้กับรายการที่อ้างปี — ลูกบ้านไม่ผูกปี</span>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2">
        <ExportCard
          icon={<IconTable className="text-[#0000BF]" />}
          tone="bg-[#0000BF]/10"
          title="ค่าส่วนกลาง"
          hint="บิลรายเดือนทุกแถวในปีที่เลือก"
          href={api.exportUrl("fees", year)}
          cta={`ดาวน์โหลด · ${year}`}
          primary
        />
        <ExportCard
          icon={<IconReceipt className="text-emerald-700" />}
          tone="bg-emerald-100/80"
          title="สลิปโอน"
          hint="ประวัติส่งสลิปในปีนั้น (สูงสุด 5,000 แถว/ไฟล์)"
          href={api.exportUrl("slips", year)}
          cta={`ดาวน์โหลด · ${year}`}
        />
        <ExportCard
          icon={<IconHomes className="text-sky-700" />}
          tone="bg-sky-100/80"
          title="ลูกบ้าน"
          hint="แปลง บ้าน และผู้พักอาศัยที่ใช้งาน"
          href={api.exportUrl("residents")}
          cta="ดาวน์โหลด"
        />
        <ExportCard
          icon={<IconChart className="text-amber-800" />}
          tone="bg-amber-100/80"
          title="สรุป 12 เดือน"
          hint="ยอดรวมรายเดือน จำนวนบิล และอัตราเก็บได้"
          href={api.exportUrl("annual_summary", year)}
          cta={`ดาวน์โหลด · ${year}`}
        />
      </ul>

      <p className="text-center text-[11px] text-slate-400">
        ต้องล็อกอินแล้ว — เปิดลิงก์ในแท็บเดียวกับที่ใช้งานระบบ
      </p>
    </div>
  );
}
