"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
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
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceFormSectionTitleClass,
  smartPoliceModalFormClass,
  smartPoliceSelectClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceLabelClass,
  smartPoliceMutedTextClass,
  smartPoliceFillBodyClass,
  smartPoliceFillPanelClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";
import { SmartPoliceCaseListCard } from "@/systems/smart-police/components/SmartPoliceCaseListCard";
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

type CaseStatusFilter = "" | SmartPoliceCaseStatus | "active";
type CasePriorityFilter = "" | SmartPoliceCasePriority | "elevated";

export function SmartPoliceCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<SmartPoliceCaseListItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CaseStatusFilter>("");
  const [priority, setPriority] = useState<CasePriorityFilter>("");
  const [prosecutor, setProsecutor] = useState<"" | "sent" | "pending">("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>(emptyWizard);
  const [chargePickerOpen, setChargePickerOpen] = useState(false);

  const filtersActive = Boolean(q.trim() || status || priority || prosecutor || overdueOnly);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (prosecutor) params.set("prosecutor", prosecutor);
    if (overdueOnly) params.set("overdue", "1");
    const res = await fetch(`/api/smart-police/cases?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { cases: SmartPoliceCaseListItem[] };
    setCases(data.cases);
  }, [q, status, priority, prosecutor, overdueOnly]);

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
    const st = searchParams.get("status");
    if (st === "active" || st === "OPEN" || st === "IN_PROGRESS" || st === "CLOSED") {
      setStatus(st);
    }
    const prio = searchParams.get("priority");
    if (prio === "elevated" || (prio && ["LOW", "NORMAL", "HIGH", "URGENT"].includes(prio))) {
      setPriority(prio as CasePriorityFilter);
    }
    const pros = searchParams.get("prosecutor");
    if (pros === "sent" || pros === "pending") setProsecutor(pros);
    if (searchParams.get("overdue") === "1") setOverdueOnly(true);

    if (
      searchParams.has("status") ||
      searchParams.has("priority") ||
      searchParams.has("prosecutor") ||
      searchParams.has("overdue")
    ) {
      setFilterOpen(true);
    }
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
    <div className={smartPolicePageStackClass}>
      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>รายการคดี</h2>
            {!loading ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">{cases.length}</span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="sp-cases-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              className={cn(
                smartPoliceOutlineButtonClass,
                "relative border-transparent bg-transparent shadow-none",
                filterOpen && "bg-white text-[#4d47b6] shadow-sm",
                filtersActive && !filterOpen && "bg-amber-50 text-amber-800",
              )}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500"
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
              <IconSpPlus className="h-3.5 w-3.5" aria-hidden />
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
              <IconSpPlus className="h-3 w-3" aria-hidden />
              สำนวนแรก
            </button>
          </div>
        </div>

        <div
          id="sp-cases-filter-panel"
          className={cn("mt-2 shrink-0 space-y-1.5", filterOpen ? "block" : "hidden")}
        >
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาเลขคดี / ชื่อเรื่อง / ข้อหา"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาคดี"
          />
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองคดี">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="presentation">
              {(
                [
                  { key: "" as const, label: "สถานะทั้งหมด" },
                  { key: "active" as const, label: "เปิด/สอบสวน" },
                  ...(Object.keys(SMART_POLICE_CASE_STATUS_LABEL) as SmartPoliceCaseStatus[]).map(
                    (k) => ({ key: k, label: SMART_POLICE_CASE_STATUS_LABEL[k] }),
                  ),
                ] as { key: CaseStatusFilter; label: string }[]
              ).map((chip) => (
                <button
                  key={`st-${chip.key || "all"}`}
                  type="button"
                  role="tab"
                  aria-selected={status === chip.key}
                  className={smartPoliceFilterTextClass(status === chip.key)}
                  onClick={() => setStatus(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="presentation">
              {(
                [
                  { key: "" as const, label: "ทุกความสำคัญ" },
                  { key: "elevated" as const, label: "ด่วน/สูง" },
                  ...(Object.keys(SMART_POLICE_CASE_PRIORITY_LABEL) as SmartPoliceCasePriority[]).map(
                    (k) => ({ key: k, label: SMART_POLICE_CASE_PRIORITY_LABEL[k] }),
                  ),
                ] as { key: CasePriorityFilter; label: string }[]
              ).map((chip) => (
                <button
                  key={`pr-${chip.key || "all"}`}
                  type="button"
                  role="tab"
                  aria-selected={priority === chip.key}
                  className={smartPoliceFilterTextClass(priority === chip.key)}
                  onClick={() => setPriority(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="presentation">
              {(
                [
                  { key: "" as const, label: "ส่งทั้งหมด" },
                  { key: "pending" as const, label: "ยังไม่ส่ง" },
                  { key: "sent" as const, label: "ส่งแล้ว" },
                ] as { key: "" | "sent" | "pending"; label: string }[]
              ).map((chip) => (
                <button
                  key={`ps-${chip.key || "all"}`}
                  type="button"
                  role="tab"
                  aria-selected={prosecutor === chip.key}
                  className={smartPoliceFilterTextClass(prosecutor === chip.key)}
                  onClick={() => setProsecutor(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
            <button
              type="button"
              role="tab"
              aria-selected={overdueOnly}
              className={smartPoliceFilterTextClass(overdueOnly)}
              onClick={() => setOverdueOnly((v) => !v)}
            >
              เกินกำหนด
            </button>
            {filtersActive ? (
              <>
                <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                <button
                  type="button"
                  className={cn(smartPoliceFilterTextClass(false), "text-rose-600 hover:text-rose-700")}
                  onClick={() => {
                    setQ("");
                    setStatus("");
                    setPriority("");
                    setProsecutor("");
                    setOverdueOnly(false);
                  }}
                >
                  ล้างกรอง
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className={smartPoliceFillBodyClass}>
        {loading ? (
          <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
        ) : cases.length === 0 ? (
          <AppEmptyState>
            {filtersActive
              ? "ไม่พบคดีตามเงื่อนไขกรอง"
              : "ไม่พบคดี — กด «สำนวนแรก» เพื่อเริ่มวิซาร์ด"}
          </AppEmptyState>
        ) : (
          <ul className={cn(smartPoliceScrollListClass, "space-y-1")}>
            {cases.map((c) => (
              <li key={c.id}>
                <SmartPoliceCaseListCard caseItem={c} />
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>

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
        <div className={smartPoliceModalFormClass}>
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
            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>ข้อมูลคดี</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={smartPoliceLabelClass}>
                  ประเภทคดี
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
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
                  ความสำคัญ
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
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
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  ชื่อเรื่องคดี *
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={wizard.title}
                    onChange={(e) => setWizard((w) => ({ ...w, title: e.target.value }))}
                    placeholder="เช่น คดียาเสพติด / ลักทรัพย์"
                  />
                </label>
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  สถานที่เกิดเหตุ
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={wizard.incidentPlace}
                    onChange={(e) => setWizard((w) => ({ ...w, incidentPlace: e.target.value }))}
                  />
                </label>
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
            </div>
          ) : null}

          {wizard.step === 1 ? (
            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>ข้อหา</p>
              <label className={smartPoliceLabelClass}>
                ข้อหา *
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className={cn(smartPoliceFieldClass, "min-w-0 flex-1")}
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
            </div>
          ) : null}

          {wizard.step === 2 ? (
            <div className="space-y-3">
              <p className={smartPoliceFormSectionTitleClass}>บุคคลหลัก</p>
              <p className={smartPoliceMutedTextClass}>อย่างน้อยผู้กล่าวหาและผู้ต้องหา</p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                    className={cn(smartPoliceSelectClass, "mt-1")}
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
                    className={cn(smartPoliceSelectClass, "mt-1")}
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
              </div>
            </div>
          ) : null}

          {wizard.step === 3 ? (
            <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 text-sm text-[#1e1b4b]">
              <p>
                <span className="font-bold text-[#4d47b6]">ประเภท:</span> {wizard.caseType}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">เรื่อง:</span> {wizard.title.trim() || "—"}
              </p>
              <p>
                <span className="font-bold text-[#4d47b6]">ข้อหา:</span> {wizard.chargeText || "—"}
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
    </div>
  );
}
