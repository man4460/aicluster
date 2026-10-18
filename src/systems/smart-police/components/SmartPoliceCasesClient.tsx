"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  AppTime24Input,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_CASE_PRIORITY_LABEL,
  SMART_POLICE_CASE_RELATIONS,
  SMART_POLICE_CASE_STATUS_LABEL,
  SMART_POLICE_CASE_TYPES,
} from "@/lib/smart-police/types";
import type { SmartPoliceCaseListItem } from "@/lib/smart-police/types";
import { bangkokDateKey, formatBangkokTimeHm } from "@/lib/time/bangkok";
import { SmartPoliceChargePickerModal } from "@/systems/smart-police/components/SmartPoliceChargePickerModal";
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
} from "@/systems/smart-police/lib/ui-tokens";
import type { SmartPoliceCasePriority, SmartPoliceCaseStatus } from "@/generated/prisma/enums";

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

type WizardParty = {
  role: "COMPLAINANT" | "SUSPECT";
  fullName: string;
  caseRelation: string;
};

type WizardState = {
  step: number;
  caseType: string;
  title: string;
  incidentPlace: string;
  receivedDate: string;
  receivedTimeHm: string;
  priority: SmartPoliceCasePriority;
  chargeText: string;
  lawRefs: string;
  complainant: { role: "COMPLAINANT"; fullName: string; caseRelation: string };
  suspect: { role: "SUSPECT"; fullName: string; caseRelation: string };
};

const emptyWizard = (): WizardState => ({
  step: 0,
  caseType: SMART_POLICE_CASE_TYPES[0] as string,
  title: "",
  incidentPlace: "",
  receivedDate: bangkokDateKey(),
  receivedTimeHm: formatBangkokTimeHm(),
  priority: "NORMAL",
  chargeText: "",
  lawRefs: "",
  complainant: {
    role: "COMPLAINANT",
    fullName: "",
    caseRelation: SMART_POLICE_CASE_RELATIONS[0] as string,
  },
  suspect: {
    role: "SUSPECT",
    fullName: "",
    caseRelation: "ผู้รู้เห็นหรือเกี่ยวข้องกับคดี",
  },
});

const WIZARD_TITLES = [
  "ขั้น 1 · ข้อมูลคดี",
  "ขั้น 2 · ข้อหา",
  "ขั้น 3 · บุคคลหลัก",
  "ขั้น 4 · ยืนยัน",
];

function priorityBadgeClass(p: SmartPoliceCasePriority): string {
  if (p === "URGENT") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (p === "HIGH") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (p === "LOW") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-indigo-50 text-indigo-700 ring-indigo-200";
}

export function SmartPoliceCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<SmartPoliceCaseListItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | SmartPoliceCaseStatus>("");
  const [priority, setPriority] = useState<"" | SmartPoliceCasePriority>("");
  const [prosecutor, setProsecutor] = useState<"" | "sent" | "pending">("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>(emptyWizard);
  const [chargePickerOpen, setChargePickerOpen] = useState(false);

  const filtersActive = Boolean(q.trim() || status || priority || prosecutor);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (prosecutor) params.set("prosecutor", prosecutor);
    const res = await fetch(`/api/smart-police/cases?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { cases: SmartPoliceCaseListItem[] };
    setCases(data.cases);
  }, [q, status, priority, prosecutor]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setWizard(emptyWizard());
      setError(null);
      setModalOpen(true);
    }
    const prio = searchParams.get("priority");
    if (prio && ["LOW", "NORMAL", "HIGH", "URGENT"].includes(prio)) {
      setPriority(prio as SmartPoliceCasePriority);
    }
    const pros = searchParams.get("prosecutor");
    if (pros === "sent" || pros === "pending") setProsecutor(pros);
  }, [searchParams]);

  const canNext = useMemo(() => {
    if (wizard.step === 0) return Boolean(wizard.title.trim() || wizard.chargeText.trim());
    if (wizard.step === 1) return Boolean(wizard.chargeText.trim());
    if (wizard.step === 2) {
      return Boolean(wizard.complainant.fullName.trim() && wizard.suspect.fullName.trim());
    }
    return true;
  }, [wizard]);

  function closeWizard() {
    setModalOpen(false);
    setWizard(emptyWizard());
    setError(null);
  }

  async function submitWizard() {
    const title = wizard.chargeText.trim() || wizard.title.trim();
    if (!title) {
      setError("กรุณาระบุชื่อเรื่องหรือข้อหา");
      return;
    }
    setSaving(true);
    setError(null);
    const parties: WizardParty[] = [
      {
        role: "COMPLAINANT",
        fullName: wizard.complainant.fullName.trim(),
        caseRelation: wizard.complainant.caseRelation,
      },
      {
        role: "SUSPECT",
        fullName: wizard.suspect.fullName.trim(),
        caseRelation: wizard.suspect.caseRelation,
      },
    ];
    const res = await fetch("/api/smart-police/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bootstrap: true,
        generateDay1: true,
        title,
        caseType: wizard.caseType,
        incidentPlace: wizard.incidentPlace,
        chargeText: wizard.chargeText.trim() || title,
        lawRefs: wizard.lawRefs.trim() || null,
        receivedAt: wizard.receivedDate,
        receivedTimeHm: wizard.receivedTimeHm,
        priority: wizard.priority,
        parties,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      setError(err.error ?? "สร้างสำนวนไม่สำเร็จ");
      return;
    }
    const data = (await res.json()) as { case: { id: string } };
    closeWizard();
    router.push(`/dashboard/smart-police/cases/${data.case.id}?tab=docs`);
  }

  return (
    <>
      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="รายการคดี"
          description="วิซาร์ดสร้างสำนวนแรก · กรองความสำคัญ / ส่งอัยการ"
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
                aria-label="สร้างสำนวนแรก"
                onClick={() => {
                  setWizard(emptyWizard());
                  setError(null);
                  setModalOpen(true);
                }}
              >
                <IconSpPlus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={cn(smartPolicePrimaryButtonClass, "hidden sm:inline-flex")}
                aria-label="สร้างสำนวนแรก"
                onClick={() => {
                  setWizard(emptyWizard());
                  setError(null);
                  setModalOpen(true);
                }}
              >
                <IconSpPlus className="h-3.5 w-3.5" aria-hidden />
                สำนวนแรก
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
          <div className={smartPoliceFilterChipShellClass} role="tablist" aria-label="กรองความสำคัญ">
            {(
              [
                { key: "" as const, label: "ทุกความสำคัญ" },
                ...(Object.keys(SMART_POLICE_CASE_PRIORITY_LABEL) as SmartPoliceCasePriority[]).map(
                  (k) => ({ key: k, label: SMART_POLICE_CASE_PRIORITY_LABEL[k] }),
                ),
              ] as { key: "" | SmartPoliceCasePriority; label: string }[]
            ).map((chip) => (
              <button
                key={chip.key || "prio-all"}
                type="button"
                role="tab"
                aria-selected={priority === chip.key}
                className={smartPoliceFilterChipClass(priority === chip.key)}
                onClick={() => setPriority(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className={smartPoliceFilterChipShellClass} role="tablist" aria-label="กรองส่งอัยการ">
            {(
              [
                { key: "" as const, label: "ทุกสถานะส่ง" },
                { key: "pending" as const, label: "ยังไม่ส่งอัยการ" },
                { key: "sent" as const, label: "ส่งอัยการแล้ว" },
              ] as { key: "" | "sent" | "pending"; label: string }[]
            ).map((chip) => (
              <button
                key={chip.key || "pros-all"}
                type="button"
                role="tab"
                aria-selected={prosecutor === chip.key}
                className={smartPoliceFilterChipClass(prosecutor === chip.key)}
                onClick={() => setProsecutor(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาเลขคดี / ชื่อเรื่อง / ข้อหา"
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
                setPriority("");
                setProsecutor("");
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
              : "ไม่พบคดี — กด «สำนวนแรก» เพื่อเริ่มวิซาร์ด"}
          </AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/smart-police/cases/${c.id}`}
                  className={cn(
                    smartPoliceListRowAccentClass(c.overdue ? "rose" : "indigo"),
                    "flex-col sm:flex-row sm:items-center",
                  )}
                >
                  <div className="min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1",
                          priorityBadgeClass(c.priority),
                        )}
                      >
                        {SMART_POLICE_CASE_PRIORITY_LABEL[c.priority]}
                      </span>
                      {c.daysSinceReceived != null ? (
                        <span
                          className={cn(
                            "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1",
                            c.overdue
                              ? "bg-rose-50 text-rose-700 ring-rose-200"
                              : "bg-white/80 text-[#5f5a8a] ring-slate-200",
                          )}
                        >
                          รับคดี {c.daysSinceReceived} วัน
                        </span>
                      ) : null}
                      {c.sentToProsecutorAt ? (
                        <span className="inline-flex rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          ส่งอัยการแล้ว
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-[#1e1b4b]">
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

      <FormModal
        open={modalOpen}
        onClose={closeWizard}
        title="สร้างสำนวนแรกง่ายๆ"
        description={WIZARD_TITLES[wizard.step]}
        mobileCentered
        size="lg"
        footer={
          wizard.step < 3 ? (
            <FormModalFooterActions
              onCancel={
                wizard.step === 0
                  ? closeWizard
                  : () => setWizard((w) => ({ ...w, step: Math.max(0, w.step - 1) }))
              }
              cancelLabel={wizard.step === 0 ? "ยกเลิก" : "ย้อนกลับ"}
              onSubmit={() => {
                if (wizard.step === 0 && !wizard.title.trim() && wizard.chargeText.trim()) {
                  setWizard((w) => ({ ...w, title: w.chargeText.trim(), step: 1 }));
                } else {
                  setWizard((w) => ({ ...w, step: w.step + 1 }));
                }
              }}
              submitLabel="ถัดไป"
              submitDisabled={!canNext}
            />
          ) : (
            <FormModalFooterActions
              onCancel={() => setWizard((w) => ({ ...w, step: 2 }))}
              cancelLabel="ย้อนกลับ"
              onSubmit={() => void submitWizard()}
              submitLabel={saving ? "กำลังสร้าง…" : "สร้างสำนวน + เอกสารวันแรก"}
              loading={saving}
              submitDisabled={!canNext}
            />
          )
        }
      >
        <div className="space-y-3 text-left">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= wizard.step ? "bg-[#5b61ff]" : "bg-slate-200",
                )}
              />
            ))}
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          {wizard.step === 0 ? (
            <>
              <label className={smartPoliceLabelClass}>
                ประเภทคดี
                <select
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.caseType}
                  onChange={(e) => setWizard((w) => ({ ...w, caseType: e.target.value }))}
                >
                  {SMART_POLICE_CASE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={smartPoliceLabelClass}>
                ชื่อเรื่องคดี *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.title}
                  onChange={(e) => setWizard((w) => ({ ...w, title: e.target.value }))}
                  placeholder="เช่น คดียาเสพติด / ลักทรัพย์"
                />
              </label>
              <label className={smartPoliceLabelClass}>
                สถานที่เกิดเหตุ
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.incidentPlace}
                  onChange={(e) => setWizard((w) => ({ ...w, incidentPlace: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={smartPoliceLabelClass}>
                  วันที่รับคดี (ไทย)
                  <input
                    type="date"
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={wizard.receivedDate}
                    onChange={(e) => setWizard((w) => ({ ...w, receivedDate: e.target.value }))}
                  />
                </label>
                <label className={smartPoliceLabelClass}>
                  เวลารับคดี
                  <div className="mt-1">
                    <AppTime24Input
                      value={wizard.receivedTimeHm}
                      onChange={(hm) => setWizard((w) => ({ ...w, receivedTimeHm: hm }))}
                    />
                  </div>
                </label>
              </div>
              <label className={smartPoliceLabelClass}>
                ความสำคัญ
                <select
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.priority}
                  onChange={(e) =>
                    setWizard((w) => ({
                      ...w,
                      priority: e.target.value as SmartPoliceCasePriority,
                    }))
                  }
                >
                  {(Object.keys(SMART_POLICE_CASE_PRIORITY_LABEL) as SmartPoliceCasePriority[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {SMART_POLICE_CASE_PRIORITY_LABEL[k]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </>
          ) : null}

          {wizard.step === 1 ? (
            <>
              <label className={smartPoliceLabelClass}>
                ข้อหา *
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <input
                    className={cn(smartPoliceFieldClass, "flex-1")}
                    value={wizard.chargeText}
                    onChange={(e) => setWizard((w) => ({ ...w, chargeText: e.target.value }))}
                    placeholder="เลือกจากคลังหรือพิมพ์เอง"
                  />
                  <button
                    type="button"
                    className={cn(smartPolicePrimaryButtonClass, "shrink-0")}
                    onClick={() => setChargePickerOpen(true)}
                  >
                    เลือกจากคลัง
                  </button>
                </div>
              </label>
              <label className={smartPoliceLabelClass}>
                กฎหมายที่อ้าง
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.lawRefs}
                  onChange={(e) => setWizard((w) => ({ ...w, lawRefs: e.target.value }))}
                />
              </label>
            </>
          ) : null}

          {wizard.step === 2 ? (
            <>
              <p className={smartPoliceMutedTextClass}>อย่างน้อยผู้กล่าวหาและผู้ต้องหา</p>
              <label className={smartPoliceLabelClass}>
                ชื่อผู้กล่าวหา *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.complainant.fullName}
                  onChange={(e) =>
                    setWizard((w) => ({
                      ...w,
                      complainant: { ...w.complainant, fullName: e.target.value },
                    }))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                เกี่ยวกับคดี (ผู้กล่าวหา)
                <select
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.complainant.caseRelation}
                  onChange={(e) =>
                    setWizard((w) => ({
                      ...w,
                      complainant: { ...w.complainant, caseRelation: e.target.value },
                    }))
                  }
                >
                  {SMART_POLICE_CASE_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className={smartPoliceLabelClass}>
                ชื่อผู้ต้องหา *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.suspect.fullName}
                  onChange={(e) =>
                    setWizard((w) => ({
                      ...w,
                      suspect: { ...w.suspect, fullName: e.target.value },
                    }))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                เกี่ยวกับคดี (ผู้ต้องหา)
                <select
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={wizard.suspect.caseRelation}
                  onChange={(e) =>
                    setWizard((w) => ({
                      ...w,
                      suspect: { ...w.suspect, caseRelation: e.target.value },
                    }))
                  }
                >
                  {SMART_POLICE_CASE_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {wizard.step === 3 ? (
            <div className="space-y-2 rounded-2xl border border-white/50 bg-white/60 p-3 text-sm text-[#1e1b4b]">
              <p>
                <span className="font-bold text-[#4d47b6]">ประเภท:</span> {wizard.caseType}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">เรื่อง:</span>{" "}
                {wizard.chargeText.trim() || wizard.title.trim()}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">ข้อหา:</span>{" "}
                {wizard.chargeText || "—"}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">รับคดี:</span> {wizard.receivedDate}{" "}
                {wizard.receivedTimeHm} น. · {SMART_POLICE_CASE_PRIORITY_LABEL[wizard.priority]}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">ผู้กล่าวหา:</span>{" "}
                {wizard.complainant.fullName}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">ผู้ต้องหา:</span> {wizard.suspect.fullName}
              </p>
              <p className={smartPoliceMutedTextClass}>
                ระบบจะสร้างคดี + คำให้การ/บันทึก/บัญชีของกลาง (วันแรก) แล้วเปิดแท็บเอกสาร
              </p>
            </div>
          ) : null}
        </div>
      </FormModal>

      <SmartPoliceChargePickerModal
        open={chargePickerOpen}
        onClose={() => setChargePickerOpen(false)}
        onSelect={(c) => {
          setWizard((w) => ({
            ...w,
            chargeText: c.chargeText,
            lawRefs: c.lawRefs ?? w.lawRefs,
            title: w.title.trim() || c.chargeText,
          }));
        }}
      />
    </>
  );
}
