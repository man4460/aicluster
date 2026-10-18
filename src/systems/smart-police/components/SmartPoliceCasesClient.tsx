"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { SMART_POLICE_CASE_STATUS_LABEL, SMART_POLICE_CASE_TYPES } from "@/lib/smart-police/types";
import type { SmartPoliceCaseListItem } from "@/lib/smart-police/types";
import { IconSpPlus } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceFieldClass,
  smartPoliceFilterChipClass,
  smartPoliceFilterChipShellClass,
  smartPoliceLabelClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";
import type { SmartPoliceCaseStatus } from "@/generated/prisma/enums";

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

export function SmartPoliceCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<SmartPoliceCaseListItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | SmartPoliceCaseStatus>("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    caseType: SMART_POLICE_CASE_TYPES[0] as string,
    incidentPlace: "",
    summary: "",
  });

  const filtersActive = Boolean(q.trim() || status);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const res = await fetch(`/api/smart-police/cases?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { cases: SmartPoliceCaseListItem[] };
    setCases(data.cases);
  }, [q, status]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setModalOpen(true);
  }, [searchParams]);

  async function createCase() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/smart-police/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return;
    const data = (await res.json()) as { case: SmartPoliceCaseListItem };
    setModalOpen(false);
    setForm({ title: "", caseType: SMART_POLICE_CASE_TYPES[0], incidentPlace: "", summary: "" });
    router.push(`/dashboard/smart-police/cases/${data.case.id}`);
  }

  return (
    <>
      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="รายการคดี"
          description="ค้นหาเลขคดีหรือชื่อเรื่อง · กรองสถานะ"
          action={
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-expanded={filterOpen}
                aria-controls="sp-cases-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  smartPoliceOutlineButtonClass,
                  "relative",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
                onClick={() => setFilterOpen((o) => !o)}
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive && !filterOpen ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                className={cn(smartPolicePrimaryIconButtonClass, "sm:hidden")}
                aria-label="เปิดคดีใหม่"
                onClick={() => setModalOpen(true)}
              >
                <IconSpPlus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={cn(smartPolicePrimaryButtonClass, "hidden sm:inline-flex")}
                aria-label="เปิดคดีใหม่"
                onClick={() => setModalOpen(true)}
              >
                <IconSpPlus className="h-3.5 w-3.5" aria-hidden />
                คดีใหม่
              </button>
            </div>
          }
        />

        <div
          id="sp-cases-filter-panel"
          className={cn("mt-3 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className={smartPoliceFilterChipShellClass} role="tablist" aria-label="กรองสถานะ">
            {(
              [
                { key: "" as const, label: "ทั้งหมด" },
                ...(Object.keys(SMART_POLICE_CASE_STATUS_LABEL) as SmartPoliceCaseStatus[]).map(
                  (k) => ({ key: k, label: SMART_POLICE_CASE_STATUS_LABEL[k] }),
                ),
              ] as { key: "" | SmartPoliceCaseStatus; label: string }[]
            ).map((chip) => (
              <button
                key={chip.key || "all"}
                type="button"
                role="tab"
                aria-selected={status === chip.key}
                className={smartPoliceFilterChipClass(status === chip.key)}
                onClick={() => setStatus(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาเลขคดี / ชื่อเรื่อง"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาคดี"
          />
          {filtersActive ? (
            <button
              type="button"
              className="text-xs font-bold text-[#5b61ff] underline"
              onClick={() => {
                setQ("");
                setStatus("");
              }}
            >
              ล้างกรอง
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className={cn("mt-4", smartPoliceMutedTextClass)}>กำลังโหลด…</p>
        ) : cases.length === 0 ? (
          <AppEmptyState className="mt-4">
            {filtersActive
              ? "ไม่พบคดีตามเงื่อนไขกรอง"
              : "ไม่พบคดี — สร้างคดีใหม่เพื่อเริ่มบันทึกสำนวน"}
          </AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/smart-police/cases/${c.id}`}
                  className={cn(smartPoliceListRowAccentClass("indigo"), "flex-col sm:flex-row sm:items-center")}
                >
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-[#1e1b4b]">
                      <span className="text-[#4d47b6]">{c.caseNumber}</span>
                      <span className="mx-1.5 text-slate-300" aria-hidden>
                        —
                      </span>
                      {c.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#66638c]">
                      {c.caseType} · {SMART_POLICE_CASE_STATUS_LABEL[c.status]} · {c.documentCount}{" "}
                      เอกสาร · {c.partyCount} บุคคล
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-[#5b61ff]">เปิดคดี →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="เปิดคดีใหม่" mobileCentered>
        <div className="space-y-3 text-left">
          <label className={smartPoliceLabelClass}>
            ชื่อเรื่องคดี *
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            ประเภทคดี
            <select
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.caseType}
              onChange={(e) => setForm((f) => ({ ...f, caseType: e.target.value }))}
            >
              {SMART_POLICE_CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={smartPoliceLabelClass}>
            สถานที่เกิดเหตุ
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.incidentPlace}
              onChange={(e) => setForm((f) => ({ ...f, incidentPlace: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            สรุปเหตุ (ย่อ)
            <textarea
              className={cn(smartPoliceTextareaClass, "mt-1")}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
          </label>
        </div>
        <FormModalFooterActions
          onCancel={() => setModalOpen(false)}
          onSubmit={() => void createCase()}
          submitLabel="สร้างคดี"
          loading={saving}
        />
      </FormModal>
    </>
  );
}
