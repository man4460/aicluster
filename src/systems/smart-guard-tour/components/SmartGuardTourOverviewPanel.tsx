"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  MapPin,
  Package,
  Route,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AppEmptyState } from "@/components/app-templates";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  smartGuardTourCardIconTileClass,
  smartGuardTourTonedRowCardClass,
  type SmartGuardTourCardTone,
} from "@/systems/smart-guard-tour/lib/card-tones";
import type { SmartGuardCatalog } from "@/systems/smart-guard-tour/lib/catalog-types";
import {
  smartGuardTourDashboardTabHref,
  smartGuardTourManageHref,
  type SmartGuardTourDashboardTabKey,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import {
  smartGuardTourFinanceStatsGridClass,
  smartGuardTourInlineSubNavBtnClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourPrimaryButtonClass,
  smartGuardTourSectionHeadingClass,
  smartGuardTourStatInlineClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

const TONE_BORDER: Record<SmartGuardTourCardTone, string> = {
  sky: "border-l-sky-500",
  emerald: "border-l-emerald-500",
  rose: "border-l-rose-500",
  orange: "border-l-orange-500",
  amber: "border-l-amber-500",
  slate: "border-l-slate-400",
  violet: "border-l-violet-500",
  indigo: "border-l-indigo-500",
};

type DutyPreview = {
  id: string;
  post: { name: string; code: string | null };
  staff: { displayName: string };
  template: { name: string; startHm: string; endHm: string };
};

type StatDef = {
  key: string;
  label: string;
  value: number;
  tone: SmartGuardTourCardTone;
  icon: ReactNode;
  href?: string;
  tab?: SmartGuardTourDashboardTabKey;
};

export function SmartGuardTourOverviewPanel({
  data,
  loading,
  onGoTab,
}: {
  data: SmartGuardCatalog;
  loading: boolean;
  onGoTab: (tab: SmartGuardTourDashboardTabKey) => void;
}) {
  const today = data.today || bangkokDateKey();
  const [duties, setDuties] = useState<DutyPreview[]>([]);
  const [dutyLoading, setDutyLoading] = useState(true);
  const [staffCount, setStaffCount] = useState(0);
  const [postCount, setPostCount] = useState(0);

  const loadOps = useCallback(async () => {
    setDutyLoading(true);
    try {
      const [dRes, sRes, pRes] = await Promise.all([
        fetch(
          `/api/smart-guard-tour/session/duties?dutyOn=${encodeURIComponent(today)}&week=${encodeURIComponent(today)}`,
          { credentials: "include" },
        ),
        fetch("/api/smart-guard-tour/session/staff", { credentials: "include" }),
        fetch("/api/smart-guard-tour/session/posts", { credentials: "include" }),
      ]);
      if (dRes.ok) {
        const j = await dRes.json();
        setDuties((j.duties as DutyPreview[]) ?? []);
        if (Array.isArray(j.posts)) setPostCount(j.posts.length);
      }
      if (sRes.ok) {
        const j = await sRes.json();
        const staff = (j.staff as Array<{ isActive?: boolean }>) ?? [];
        setStaffCount(staff.filter((s) => s.isActive !== false).length);
      }
      if (pRes.ok) {
        const j = await pRes.json();
        setPostCount(((j.posts as unknown[]) ?? []).length);
      }
    } catch {
      /* soft fail — overview still shows catalog stats */
    } finally {
      setDutyLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadOps();
  }, [loadOps]);

  const openIncidents = useMemo(
    () =>
      data.incidents.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS").slice(0, 5),
    [data.incidents],
  );
  const tourToday = useMemo(
    () => data.tourLogs.filter((t) => t.entryOn === today).slice(0, 5),
    [data.tourLogs, today],
  );
  const onDuty = useMemo(
    () => data.shifts.filter((s) => s.onDuty && s.shiftOn === today),
    [data.shifts, today],
  );

  const activeCp = data.checkpoints.filter((c) => c.isActive).length;
  const activeSched = data.schedules.filter((s) => s.isActive).length;

  const setupGaps = useMemo(() => {
    const gaps: { label: string; href: string }[] = [];
    if (staffCount === 0) gaps.push({ label: "เพิ่มพนักงาน", href: smartGuardTourManageHref("staff") });
    if (postCount === 0) gaps.push({ label: "เพิ่มจุดประจำ", href: smartGuardTourManageHref("posts") });
    if (activeCp === 0) gaps.push({ label: "เพิ่มจุดตรวจ", href: smartGuardTourManageHref("checkpoints") });
    if (activeSched === 0 && activeCp > 0) {
      gaps.push({ label: "สร้างตารางสายตรวจ", href: smartGuardTourManageHref("schedules") });
    }
    if (duties.length === 0 && staffCount > 0 && postCount > 0) {
      gaps.push({ label: "จัดเวรวันนี้", href: smartGuardTourManageHref("duties") });
    }
    return gaps;
  }, [staffCount, postCount, activeCp, activeSched, duties.length]);

  const stats: StatDef[] = [
    {
      key: "tour",
      label: "สายตรวจวันนี้",
      value: data.tourLogs.filter((t) => t.entryOn === today).length,
      tone: "emerald",
      icon: <Route className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      tab: "tour-logs",
    },
    {
      key: "incidents",
      label: "เหตุการณ์เปิด",
      value: data.incidents.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS")
        .length,
      tone: "rose",
      icon: <AlertTriangle className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      tab: "incidents",
    },
    {
      key: "onDuty",
      label: "รปภ. เข้ากะ",
      value: onDuty.length,
      tone: "orange",
      icon: <Shield className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      tab: "shifts",
    },
    {
      key: "duties",
      label: "เวรวันนี้",
      value: duties.length,
      tone: "amber",
      icon: <ShieldCheck className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      tab: "posts",
    },
    {
      key: "cp",
      label: "จุดตรวจใช้งาน",
      value: activeCp,
      tone: "sky",
      icon: <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      href: smartGuardTourManageHref("checkpoints"),
    },
    {
      key: "assets",
      label: "อุปกรณ์",
      value: data.assets.filter((a) => a.status !== "RETIRED").length,
      tone: "slate",
      icon: <Package className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
      href: smartGuardTourManageHref("assets"),
    },
  ];

  const oddTail = stats.length % 2 === 1;

  return (
    <div className="min-w-0 space-y-4">
      <div className={smartGuardTourFinanceStatsGridClass}>
        {stats.map((s, idx) => {
          const className = cn(
            smartGuardTourStatInlineClass,
            "border-l-[3px] text-left transition hover:ring-1 hover:ring-orange-200/80",
            TONE_BORDER[s.tone],
            oddTail && idx === stats.length - 1 ? "col-span-2 sm:col-span-1" : undefined,
          );
          const body = (
            <>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                <span className={smartGuardTourCardIconTileClass(s.tone)}>{s.icon}</span>
                {s.label}
              </span>
              <span className="text-xl font-black tabular-nums text-[#1e1b4b]">
                {loading ? "…" : s.value.toLocaleString("th-TH")}
              </span>
            </>
          );
          if (s.href) {
            return (
              <Link key={s.key} href={s.href} className={className} aria-label={`ไปที่ ${s.label}`}>
                {body}
              </Link>
            );
          }
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => s.tab && onGoTab(s.tab)}
              className={className}
              aria-label={`ไปที่ ${s.label}`}
            >
              {body}
            </button>
          );
        })}
      </div>

      {!loading && !dutyLoading && setupGaps.length > 0 ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 sm:p-4">
          <p className={cn(smartGuardTourSectionHeadingClass, "mb-2")}>
            <Users className="h-4 w-4" aria-hidden />
            เริ่มใช้งาน — ตั้งค่าที่การจัดการ
          </p>
          <div className="flex flex-wrap gap-2">
            {setupGaps.map((g) => (
              <Link key={g.href} href={g.href} className={smartGuardTourPrimaryButtonClass}>
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className={smartGuardTourSectionHeadingClass}>
            <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />
            เหตุการณ์ที่ต้องจัดการ
          </h3>
          <button
            type="button"
            className={smartGuardTourOutlineButtonClass}
            onClick={() => onGoTab("incidents")}
          >
            ทั้งหมด
          </button>
        </div>
        {openIncidents.length === 0 ? (
          <AppEmptyState>ไม่มีเหตุการณ์เปิดอยู่</AppEmptyState>
        ) : (
          <div className="space-y-2">
            {openIncidents.map((i) => (
              <button
                key={i.id}
                type="button"
                className={cn(smartGuardTourTonedRowCardClass("rose"), "w-full text-left")}
                onClick={() => onGoTab("incidents")}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={smartGuardTourCardIconTileClass("rose")}>
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1e1b4b]">{i.title}</p>
                    <p className="truncate text-xs font-medium text-[#66638c]">
                      {[i.checkpointName, i.staffName].filter(Boolean).join(" · ") || i.kind}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className={smartGuardTourSectionHeadingClass}>
            <ShieldCheck className="h-4 w-4 text-orange-600" aria-hidden />
            เวรประจำจุดวันนี้
          </h3>
          <div className="flex gap-1.5">
            <Link href={smartGuardTourManageHref("duties")} className={smartGuardTourOutlineButtonClass}>
              จัดเวร
            </Link>
            <button
              type="button"
              className={smartGuardTourInlineSubNavBtnClass(false)}
              onClick={() => onGoTab("posts")}
            >
              ดูทั้งหมด
            </button>
          </div>
        </div>
        {dutyLoading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลดเวร…</p>
        ) : duties.length === 0 ? (
          <AppEmptyState>
            <p>ยังไม่มีเวรวันนี้</p>
            <Link href={smartGuardTourManageHref("duties")} className={smartGuardTourPrimaryButtonClass}>
              ไปจัดเวร
            </Link>
          </AppEmptyState>
        ) : (
          <div className="space-y-2">
            {duties.slice(0, 6).map((d) => (
              <div key={d.id} className={smartGuardTourTonedRowCardClass("orange")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={smartGuardTourCardIconTileClass("orange")}>
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1e1b4b]">
                      {d.post.name}
                      {d.post.code ? ` · ${d.post.code}` : ""}
                    </p>
                    <p className="text-xs font-medium text-[#66638c]">
                      {d.staff.displayName} · {d.template.name} ({d.template.startHm}–{d.template.endHm})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className={smartGuardTourSectionHeadingClass}>
            <Route className="h-4 w-4 text-emerald-600" aria-hidden />
            สายตรวจล่าสุดวันนี้
          </h3>
          <button
            type="button"
            className={smartGuardTourOutlineButtonClass}
            onClick={() => onGoTab("tour-logs")}
          >
            ทั้งหมด
          </button>
        </div>
        {tourToday.length === 0 ? (
          <AppEmptyState>ยังไม่มีบันทึกสายตรวจวันนี้</AppEmptyState>
        ) : (
          <div className="space-y-2">
            {tourToday.map((t) => (
              <div key={t.id} className={smartGuardTourTonedRowCardClass("emerald")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={smartGuardTourCardIconTileClass("emerald")}>
                    <Route className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1e1b4b]">{t.checkpointName}</p>
                    <p className="truncate text-xs font-medium text-[#66638c]">
                      {[t.staffName, t.status].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={smartGuardTourDashboardTabHref("map-view")} className={smartGuardTourOutlineButtonClass}>
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          แผนที่จุดตรวจ
        </Link>
        <Link href={smartGuardTourDashboardTabHref("contacts")} className={smartGuardTourOutlineButtonClass}>
          ผู้ติดต่อฉุกเฉิน
        </Link>
        <Link href={smartGuardTourManageHref()} className={smartGuardTourOutlineButtonClass}>
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          ไปการจัดการ
        </Link>
      </div>
    </div>
  );
}
