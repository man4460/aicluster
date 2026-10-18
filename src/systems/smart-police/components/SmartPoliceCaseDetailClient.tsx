"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppTime24Input,
  openPrintableHtml,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  buildSmartPoliceDay1Checklist,
  day1ChecklistSummary,
} from "@/lib/smart-police/day1-checklist";
import {
  SMART_POLICE_CASE_PRIORITY_LABEL,
  SMART_POLICE_CASE_RELATIONS,
  SMART_POLICE_CASE_STATUS_LABEL,
  SMART_POLICE_CASE_TYPES,
  SMART_POLICE_COURT_TYPES,
  SMART_POLICE_CUSTODY_MODE_LABEL,
  SMART_POLICE_DOCUMENT_KIND_LABEL,
  SMART_POLICE_INVESTIGATION_RESULT_LABEL,
  SMART_POLICE_PARTY_ROLE_LABEL,
  SMART_POLICE_PLEA_OPTIONS,
  SMART_POLICE_SAMPLE_BEHAVIORS,
  SMART_POLICE_WITNESS_SIDE_LABEL,
} from "@/lib/smart-police/types";
import type {
  SmartPoliceCaseDetail,
  SmartPoliceEvidenceDto,
  SmartPoliceOfficerDto,
  SmartPolicePartyDto,
} from "@/lib/smart-police/types";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { SmartPoliceChargePickerModal } from "@/systems/smart-police/components/SmartPoliceChargePickerModal";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardMetaClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceFormSectionTitleClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceLabelClass,
  SMART_POLICE_ENTRY_MODAL_SIZE,
  smartPoliceModalFieldGridClass,
  smartPoliceModalFormClass,
  smartPoliceSelectClass,
  smartPoliceListRowAccentClass,
  smartPoliceListRowClass,
  smartPoliceMobileSelectClass,
  smartPoliceMutedTextClass,
  smartPoliceFillPanelClass,
  smartPoliceFillScrollBodyClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelDividerClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryTabPillClass,
  smartPolicePrimaryTabShellClass,
  smartPoliceRowIconButtonClass,
  smartPoliceRowRemoveIconButtonClass,
  smartPoliceTextareaClass,
  smartPoliceToastSuccessClass,
  smartPoliceToolbarRowClass,
} from "@/systems/smart-police/lib/ui-tokens";
import type {
  SmartPoliceCasePriority,
  SmartPoliceCaseStatus,
  SmartPoliceCustodyMode,
  SmartPoliceDocumentKind,
  SmartPoliceInvestigationResult,
  SmartPolicePartyRole,
  SmartPoliceWitnessSide,
} from "@/generated/prisma/enums";
import { IconRowEdit, IconRowRemove } from "@/systems/asset/components/AssetRowActionIcons";

type CaseTab = "info" | "parties" | "evidence" | "behavior" | "memo" | "docs";

const CASE_TABS: { key: CaseTab; label: string }[] = [
  { key: "info", label: "ข้อมูลคดี" },
  { key: "parties", label: "บุคคล" },
  { key: "evidence", label: "ของกลาง" },
  { key: "behavior", label: "พฤติการณ์" },
  { key: "memo", label: "บันทึกพงส." },
  { key: "docs", label: "เอกสาร" },
];

function isCaseTab(value: string | null): value is CaseTab {
  return CASE_TABS.some((t) => t.key === value);
}

function documentPreviewHref(caseId: string, docId: string) {
  return `/dashboard/smart-police/cases/${caseId}/documents/${docId}`;
}

function documentEditHref(caseId: string, docId: string) {
  return `/dashboard/smart-police/cases/${caseId}/documents/${docId}/edit`;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

const emptyParty = {
  role: "COMPLAINANT" as SmartPolicePartyRole,
  fullName: "",
  age: "",
  idCard: "",
  address: "",
  caseRelation: "",
  witnessSide: "" as "" | SmartPoliceWitnessSide,
  pleaStatus: "",
  occupation: "",
  workplace: "",
};

const emptyEvidence = {
  name: "",
  quantityLabel: "",
  seizureNo: "",
  seizedFrom: "",
  ownerName: "",
  ownerNote: "",
};

export function SmartPoliceCaseDetailClient({ caseId }: { caseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<CaseTab>(isCaseTab(initialTab) ? initialTab : "info");
  const [data, setData] = useState<SmartPoliceCaseDetail | null>(null);
  const [officers, setOfficers] = useState<SmartPoliceOfficerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [partyModal, setPartyModal] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyForm, setPartyForm] = useState(emptyParty);

  const [evidenceModal, setEvidenceModal] = useState(false);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [evidenceForm, setEvidenceForm] = useState(emptyEvidence);

  const [docModal, setDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    kind: "NARRATIVE" as SmartPoliceDocumentKind,
    title: "",
    content: "",
  });
  const [chargePickerOpen, setChargePickerOpen] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<
    { id: string; name: string; kind: SmartPoliceDocumentKind; content: string }[]
  >([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/smart-police/cases/${caseId}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { case: SmartPoliceCaseDetail };
    setData(json.case);
  }, [caseId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const [offRes, tplRes] = await Promise.all([
        fetch("/api/smart-police/officers", { cache: "no-store" }),
        fetch("/api/smart-police/templates", { cache: "no-store" }),
      ]);
      if (offRes.ok) {
        const j = (await offRes.json()) as { officers: SmartPoliceOfficerDto[] };
        setOfficers(j.officers);
      }
      if (tplRes.ok) {
        const j = (await tplRes.json()) as {
          templates: { id: string; name: string; kind: SmartPoliceDocumentKind; content: string; isActive: boolean }[];
        };
        setTemplateOptions(j.templates.filter((t) => t.isActive));
      }
    })();
  }, []);

  const day1Items = useMemo(
    () => (data ? buildSmartPoliceDay1Checklist(data) : []),
    [data],
  );
  const day1Summary = useMemo(() => day1ChecklistSummary(day1Items), [day1Items]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function patchCase(patch: Record<string, unknown>) {
    const res = await fetch(`/api/smart-police/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const json = (await res.json()) as { case: SmartPoliceCaseDetail };
      setData(json.case);
    }
  }

  async function generateDocs(
    kinds: ("STATEMENT_ALL" | "MEMO" | "INVESTIGATION_REPORT" | "PROPERTY_LIST")[],
    options?: { preferTab?: CaseTab },
  ) {
    setGenBusy(true);
    const res = await fetch(`/api/smart-police/cases/${caseId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kinds, generateWord: true, syncNarrative: true }),
    });
    setGenBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      showToast(err.error ?? "สร้างเอกสารไม่สำเร็จ");
      return;
    }
    const json = (await res.json()) as { case?: SmartPoliceCaseDetail };
    if (json.case) setData(json.case);
    else await load();
    showToast("สร้างเอกสารแล้ว");
    setTab(options?.preferTab ?? "docs");
  }

  async function saveMemoContent(docId: string, content: string) {
    setSaving(true);
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (!res.ok) {
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    await load();
    showToast("บันทึกเนื้อหาแล้ว");
  }

  async function saveParty() {
    if (!partyForm.fullName.trim()) return;
    setSaving(true);
    const payload = {
      ...partyForm,
      age: partyForm.age ? Number(partyForm.age) : null,
      witnessSide: partyForm.witnessSide || null,
    };
    const url = editingPartyId
      ? `/api/smart-police/cases/${caseId}/parties/${editingPartyId}`
      : `/api/smart-police/cases/${caseId}/parties`;
    await fetch(url, {
      method: editingPartyId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setPartyModal(false);
    setEditingPartyId(null);
    setPartyForm(emptyParty);
    await load();
  }

  async function deleteParty(p: SmartPolicePartyDto) {
    if (!window.confirm(`ลบ ${p.fullName}?`)) return;
    await fetch(`/api/smart-police/cases/${caseId}/parties/${p.id}`, { method: "DELETE" });
    await load();
  }

  function openEditParty(p: SmartPolicePartyDto) {
    setEditingPartyId(p.id);
    setPartyForm({
      role: p.role,
      fullName: p.fullName,
      age: p.age != null ? String(p.age) : "",
      idCard: p.idCard ?? "",
      address: p.address ?? "",
      caseRelation: p.caseRelation ?? "",
      witnessSide: p.witnessSide ?? "",
      pleaStatus: p.pleaStatus ?? "",
      occupation: p.occupation ?? "",
      workplace: p.workplace ?? "",
    });
    setPartyModal(true);
  }

  async function saveEvidence() {
    if (!evidenceForm.name.trim()) return;
    setSaving(true);
    const url = editingEvidenceId
      ? `/api/smart-police/cases/${caseId}/evidence/${editingEvidenceId}`
      : `/api/smart-police/cases/${caseId}/evidence`;
    await fetch(url, {
      method: editingEvidenceId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evidenceForm),
    });
    setSaving(false);
    setEvidenceModal(false);
    setEditingEvidenceId(null);
    setEvidenceForm(emptyEvidence);
    await load();
  }

  async function deleteEvidence(e: SmartPoliceEvidenceDto) {
    if (!window.confirm(`ลบ ${e.name}?`)) return;
    await fetch(`/api/smart-police/cases/${caseId}/evidence/${e.id}`, { method: "DELETE" });
    await load();
  }

  function openEditEvidence(e: SmartPoliceEvidenceDto) {
    setEditingEvidenceId(e.id);
    setEvidenceForm({
      name: e.name,
      quantityLabel: e.quantityLabel ?? "",
      seizureNo: e.seizureNo ?? "",
      seizedFrom: e.seizedFrom ?? "",
      ownerName: e.ownerName ?? "",
      ownerNote: e.ownerNote ?? "",
    });
    setEvidenceModal(true);
  }

  async function saveDoc() {
    if (!docForm.title.trim()) return;
    setSaving(true);
    const url = editingDocId
      ? `/api/smart-police/cases/${caseId}/documents/${editingDocId}`
      : `/api/smart-police/cases/${caseId}/documents`;
    await fetch(url, {
      method: editingDocId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    setSaving(false);
    setDocModal(false);
    setEditingDocId(null);
    await load();
  }

  async function printDoc(docId: string) {
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${docId}/print`, {
      method: "POST",
    });
    if (!res.ok) return;
    const { html } = (await res.json()) as { html: string };
    openPrintableHtml(html);
    await load();
  }

  async function createStatementForParty(partyId: string) {
    setGenBusy(true);
    const res = await fetch(`/api/smart-police/cases/${caseId}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId, generateWord: true, syncNarrative: true }),
    });
    setGenBusy(false);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      showToast(err.error ?? "สร้างคำให้การไม่สำเร็จ");
      return;
    }
    const json = (await res.json()) as { document?: { id: string } };
    if (json.document?.id) {
      router.push(documentEditHref(caseId, json.document.id));
      return;
    }
    await load();
    showToast("สร้างคำให้การแล้ว");
  }

  if (loading) return <p className={smartPoliceMutedTextClass}>กำลังโหลดคดี…</p>;
  if (!data) {
    return (
      <p className="text-sm text-rose-600">
        ไม่พบคดี — <Link href="/dashboard/smart-police/cases">กลับรายการ</Link>
      </p>
    );
  }

  const memoDoc = data.documents.find((d) => d.kind === "MEMO") ?? null;

  return (
    <div className={smartPolicePageStackClass}>
      {toast ? <p className={cn(smartPoliceToastSuccessClass, "shrink-0")}>{toast}</p> : null}

      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
          <div className="min-w-0 text-left">
            <div className={smartPoliceCardTitleRowClass}>
              <span className="text-[11px] font-bold text-[#4d47b6]">{data.caseNumber}</span>
              <h2 className={smartPoliceCardTitleClass}>{data.title}</h2>
            </div>
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <Link
              href="/dashboard/smart-police/cases"
              className={cn(
                smartPoliceOutlineButtonClass,
                "border-transparent bg-transparent shadow-none hover:bg-white",
              )}
            >
              ← รายการ
            </Link>
          </div>
        </div>

        <div className="mt-1.5 shrink-0 sm:hidden">
          <select
            className={smartPoliceMobileSelectClass}
            value={tab}
            aria-label="ส่วนสำนวน"
            onChange={(e) => setTab(e.target.value as CaseTab)}
          >
            {CASE_TABS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label === "บันทึกพงส." ? "บันทึกพนักงานสอบสวน" : t.label}
              </option>
            ))}
          </select>
        </div>
        <nav
          role="tablist"
          className={cn(smartPolicePrimaryTabShellClass, "mt-2.5 hidden shrink-0 sm:inline-flex")}
          aria-label="ส่วนสำนวน"
        >
          {CASE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              aria-label={t.key === "memo" ? "บันทึกพนักงานสอบสวน" : t.label}
              className={smartPolicePrimaryTabPillClass(tab === t.key)}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className={cn(smartPolicePanelDividerClass, smartPoliceFillScrollBodyClass, "mt-2.5 pt-2.5")}>
        {tab === "info" ? (
          <div role="tabpanel" className="space-y-4 text-left">
            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>เรื่องคดี</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  ชื่อเรื่อง
                  <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                    ชื่อย่อคดีสำหรับรายการ/หัวสำนวน — ไม่ใช่ข้อความข้อหาเต็ม
                  </span>
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    defaultValue={data.title}
                    key={`title-${data.updatedAt}`}
                    placeholder="เช่น ลักทรัพย์ / ยาเสพติด"
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== data.title) void patchCase({ title: next });
                    }}
                  />
                  {data.chargeText?.trim() &&
                  data.title.trim() === data.chargeText.trim() ? (
                    <span className="mt-1 block text-[11px] font-semibold text-amber-700">
                      ชื่อเรื่องซ้ำกับข้อหา — แก้เป็นชื่อย่อคดีให้ต่างจากช่องข้อหาด้านล่าง
                    </span>
                  ) : null}
                </label>
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  ข้อหา
                  <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
                    ข้อความข้อหาตามกฎหมาย (เลือกจากคลังหรือพิมพ์เอง)
                  </span>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      className={cn(smartPoliceFieldClass, "min-w-0 flex-1")}
                      defaultValue={data.chargeText ?? ""}
                      key={`charge-${data.updatedAt}`}
                      onBlur={(e) => {
                        if (e.target.value !== (data.chargeText ?? "")) {
                          void patchCase({ chargeText: e.target.value });
                        }
                      }}
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
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  กฎหมายที่อ้าง
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    defaultValue={data.lawRefs ?? ""}
                    key={`law-${data.updatedAt}`}
                    onBlur={(e) => {
                      if (e.target.value !== (data.lawRefs ?? "")) {
                        void patchCase({ lawRefs: e.target.value });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>สถานะ · ประเภท</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className={smartPoliceLabelClass}>
                  สถานะ
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.status}
                    onChange={(e) => void patchCase({ status: e.target.value })}
                  >
                    {(Object.keys(SMART_POLICE_CASE_STATUS_LABEL) as SmartPoliceCaseStatus[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {SMART_POLICE_CASE_STATUS_LABEL[k]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className={smartPoliceLabelClass}>
                  ความสำคัญ
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.priority ?? "NORMAL"}
                    onChange={(e) => void patchCase({ priority: e.target.value })}
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
                <label className={smartPoliceLabelClass}>
                  ประเภทคดี
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.caseType}
                    onChange={(e) => void patchCase({ caseType: e.target.value })}
                  >
                    {SMART_POLICE_CASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={smartPoliceLabelClass}>
                  อำนาจศาล
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.courtType ?? "จังหวัด"}
                    onChange={(e) => void patchCase({ courtType: e.target.value })}
                  >
                    {SMART_POLICE_COURT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={smartPoliceLabelClass}>
                  การควบคุมผู้ต้องหา
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.custodyMode ?? ""}
                    onChange={(e) => void patchCase({ custodyMode: e.target.value || null })}
                  >
                    <option value="">— เลือก —</option>
                    {(Object.keys(SMART_POLICE_CUSTODY_MODE_LABEL) as SmartPoliceCustodyMode[]).map(
                      (k) => (
                        <option key={k} value={k}>
                          {SMART_POLICE_CUSTODY_MODE_LABEL[k]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className={smartPoliceLabelClass}>
                  พนักงานสอบสวนเจ้าของคดี
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.investigatorOfficerId ?? ""}
                    onChange={(e) =>
                      void patchCase({ investigatorOfficerId: e.target.value || null })
                    }
                  >
                    <option value="">— ใช้ค่าเริ่มจากตั้งค่า —</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {[o.rankTitle, o.fullName].filter(Boolean).join(" ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>วันเวลา · สถานที่</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className={smartPoliceLabelClass}>
                  วันรับคดี
                  <input
                    type="date"
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={toDateInput(data.receivedAt)}
                    onChange={(e) =>
                      void patchCase({
                        receivedAt: e.target.value ? `${e.target.value}T12:00:00+07:00` : null,
                      })
                    }
                  />
                </label>
                <label className={smartPoliceLabelClass}>
                  เวลารับคดี (ไทย)
                  <div className="mt-1">
                    <AppTime24Input
                      value={data.receivedTimeHm ?? ""}
                      onChange={(hm) => void patchCase({ receivedTimeHm: hm || null })}
                    />
                  </div>
                </label>
                <label className={smartPoliceLabelClass}>
                  ปจว. ข้อรับคดี
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    defaultValue={data.dailyLogNo ?? ""}
                    key={`log-${data.updatedAt}`}
                    onBlur={(e) => {
                      if (e.target.value !== (data.dailyLogNo ?? "")) {
                        void patchCase({ dailyLogNo: e.target.value });
                      }
                    }}
                  />
                </label>
                <label className={smartPoliceLabelClass}>
                  วันเกิดเหตุ
                  <input
                    type="date"
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={toDateInput(data.incidentAt)}
                    onChange={(e) =>
                      void patchCase({
                        incidentAt: e.target.value ? `${e.target.value}T12:00:00+07:00` : null,
                      })
                    }
                  />
                </label>
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                  ที่เกิดเหตุ
                  <input
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    defaultValue={data.incidentPlace ?? ""}
                    key={`place-${data.updatedAt}`}
                    onBlur={(e) => {
                      if (e.target.value !== (data.incidentPlace ?? "")) {
                        void patchCase({ incidentPlace: e.target.value });
                      }
                    }}
                  />
                </label>
                <label className={cn(smartPoliceLabelClass, "sm:col-span-2 xl:col-span-3")}>
                  สรุปสั้น
                  <textarea
                    className={cn(smartPoliceTextareaClass, "mt-1 min-h-[4rem]")}
                    defaultValue={data.summary ?? ""}
                    key={`sum-${data.updatedAt}`}
                    onBlur={(e) => {
                      if (e.target.value !== (data.summary ?? "")) {
                        void patchCase({ summary: e.target.value });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <p className={smartPoliceFormSectionTitleClass}>ผลสอบสวน · ส่งอัยการ</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={smartPoliceLabelClass}>
                  ผลชั้นสอบสวน
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={data.investigationResult}
                    onChange={(e) => void patchCase({ investigationResult: e.target.value })}
                  >
                    {(
                      Object.keys(
                        SMART_POLICE_INVESTIGATION_RESULT_LABEL,
                      ) as SmartPoliceInvestigationResult[]
                    ).map((k) => (
                      <option key={k} value={k}>
                        {SMART_POLICE_INVESTIGATION_RESULT_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={smartPoliceLabelClass}>
                  วันส่งอัยการ
                  <input
                    type="date"
                    className={cn(smartPoliceFieldClass, "mt-1")}
                    value={toDateInput(data.sentToProsecutorAt)}
                    onChange={(e) =>
                      void patchCase({
                        sentToProsecutorAt: e.target.value
                          ? `${e.target.value}T12:00:00+07:00`
                          : null,
                      })
                    }
                  />
                  {data.investigationResult === "PROSECUTE" && !data.sentToProsecutorAt ? (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      ผลสั่งฟ้อง — แนะนำกรอกวันส่งอัยการ{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          void patchCase({
                            sentToProsecutorAt: `${bangkokDateKey()}T12:00:00+07:00`,
                          })
                        }
                      >
                        ใช้วันนี้
                      </button>
                    </p>
                  ) : null}
                </label>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "parties" ? (
          <div role="tabpanel" className="space-y-2">
            <div className={smartPoliceCardHeaderRowClass}>
              <div className={smartPoliceCardTitleRowClass}>
                <h3 className={smartPoliceCardTitleClass}>บุคคล</h3>
                <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                  {data.parties.length}
                </span>
              </div>
              <div className={smartPoliceHeaderActionShellClass}>
                <button
                  type="button"
                  className={smartPolicePrimaryButtonClass}
                  onClick={() => {
                    setEditingPartyId(null);
                    setPartyForm(emptyParty);
                    setPartyModal(true);
                  }}
                >
                  + เพิ่ม
                </button>
              </div>
            </div>
            <ul className="space-y-1">
              {data.parties.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    smartPoliceListRowAccentClass("violet"),
                    "flex-col sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div className="min-w-0 text-left text-sm">
                    <p className="font-semibold text-[#1e1b4b]">
                      <span className="text-[#4d47b6]">{SMART_POLICE_PARTY_ROLE_LABEL[p.role]}</span>
                      {" — "}
                      {p.fullName}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {p.caseRelation || "ยังไม่ระบุเกี่ยวกับคดี"}
                      {p.witnessSide
                        ? ` · ${SMART_POLICE_WITNESS_SIDE_LABEL[p.witnessSide]}`
                        : ""}
                      {p.pleaStatus ? ` · ${p.pleaStatus}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <button
                      type="button"
                      className={smartPolicePrimaryButtonClass}
                      disabled={genBusy}
                      onClick={() => void createStatementForParty(p.id)}
                    >
                      คำให้การ
                    </button>
                    <button
                      type="button"
                      className={smartPoliceRowIconButtonClass}
                      aria-label={`แก้ไข ${p.fullName}`}
                      onClick={() => openEditParty(p)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={smartPoliceRowRemoveIconButtonClass}
                      aria-label={`ลบ ${p.fullName}`}
                      onClick={() => void deleteParty(p)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {data.parties.length === 0 ? (
                <p className={smartPoliceMutedTextClass}>ยังไม่มีรายชื่อ</p>
              ) : null}
            </ul>
          </div>
        ) : null}

        {tab === "evidence" ? (
          <div role="tabpanel" className="space-y-2">
            <div className={smartPoliceCardHeaderRowClass}>
              <h3 className={smartPoliceCardTitleClass}>ของกลาง</h3>
              <div className={smartPoliceHeaderActionShellClass}>
                <button
                  type="button"
                  className={smartPolicePrimaryButtonClass}
                  onClick={() => {
                    setEditingEvidenceId(null);
                    setEvidenceForm(emptyEvidence);
                    setEvidenceModal(true);
                  }}
                >
                  + เพิ่ม
                </button>
              </div>
            </div>
            <ul className="space-y-1.5">
              {data.evidence.map((e) => (
                <li
                  key={e.id}
                  className={smartPoliceListRowAccentClass("amber")}
                >
                  <div className="min-w-0 text-left text-sm">
                    <p className="font-semibold text-[#1e1b4b]">
                      {e.name}
                      {e.quantityLabel ? ` · ${e.quantityLabel}` : ""}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {[e.seizedFrom && `ยึดจาก ${e.seizedFrom}`, e.ownerName && `เจ้าของ ${e.ownerName}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className={smartPoliceRowIconButtonClass}
                      aria-label={`แก้ไข ${e.name}`}
                      onClick={() => openEditEvidence(e)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={smartPoliceRowRemoveIconButtonClass}
                      aria-label={`ลบ ${e.name}`}
                      onClick={() => void deleteEvidence(e)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {data.evidence.length === 0 ? (
                <p className={smartPoliceMutedTextClass}>ยังไม่มีของกลาง</p>
              ) : null}
            </ul>
          </div>
        ) : null}

        {tab === "behavior" ? (
          <div role="tabpanel" className="space-y-3 text-left">
            <label className={smartPoliceLabelClass}>
              พฤติการณ์
              <div className="mt-1 flex flex-wrap gap-2">
                {SMART_POLICE_SAMPLE_BEHAVIORS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={smartPoliceOutlineButtonClass}
                    onClick={() => void patchCase({ behaviorText: b })}
                  >
                    ใส่ตัวอย่างยาบ้า
                  </button>
                ))}
              </div>
              <textarea
                className={cn(smartPoliceTextareaClass, "mt-2 min-h-[7.5rem]")}
                defaultValue={data.behaviorText ?? ""}
                key={`beh-${data.updatedAt}`}
                onBlur={(e) => {
                  if (e.target.value !== (data.behaviorText ?? "")) {
                    void patchCase({ behaviorText: e.target.value });
                  }
                }}
              />
            </label>
            <label className={smartPoliceLabelClass}>
              ความเสียหาย (ถ้ามี)
              <textarea
                className={cn(smartPoliceTextareaClass, "mt-1 min-h-[4rem]")}
                defaultValue={data.damageNote ?? ""}
                key={`dmg-${data.updatedAt}`}
                onBlur={(e) => {
                  if (e.target.value !== (data.damageNote ?? "")) {
                    void patchCase({ damageNote: e.target.value });
                  }
                }}
              />
            </label>
            <div className={cn(smartPoliceToolbarRowClass, "pt-1")}>
              <button
                type="button"
                className={smartPolicePrimaryButtonClass}
                disabled={genBusy}
                onClick={() => void generateDocs(["MEMO"], { preferTab: "memo" })}
              >
                {genBusy ? "…" : "สร้าง/อัปเดตบันทึกพงส."}
              </button>
              <button
                type="button"
                className={smartPoliceOutlineButtonClass}
                onClick={() => setTab("memo")}
              >
                ไปแท็บบันทึกพงส.
              </button>
              <button
                type="button"
                className={smartPoliceOutlineButtonClass}
                disabled={genBusy}
                onClick={() =>
                  void generateDocs(["STATEMENT_ALL", "MEMO", "INVESTIGATION_REPORT", "PROPERTY_LIST"])
                }
              >
                สร้างทั้งหมด
              </button>
            </div>
          </div>
        ) : null}

        {tab === "memo" ? (
          <div role="tabpanel" aria-label="บันทึกพนักงานสอบสวน" className="space-y-3 text-left">
            <div className="space-y-1">
              <p className={smartPoliceFormSectionTitleClass}>บันทึกพนักงานสอบสวน</p>
              <p className={smartPoliceMutedTextClass}>
                สร้างจากข้อมูลคดี · พฤติการณ์ · บุคคล · ของกลาง แล้วแก้เนื้อหาก่อนพิมพ์ได้
              </p>
            </div>

            {!memoDoc ? (
              <div className="space-y-3 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/60 p-4">
                <p className={smartPoliceMutedTextClass}>ยังไม่มีบันทึกพนักงานสอบสวนในคดีนี้</p>
                <button
                  type="button"
                  className={smartPolicePrimaryButtonClass}
                  disabled={genBusy}
                  onClick={() => void generateDocs(["MEMO"], { preferTab: "memo" })}
                >
                  {genBusy ? "กำลังสร้าง…" : "+ สร้างบันทึกพงส."}
                </button>
              </div>
            ) : (
              <>
                <div className={smartPoliceToolbarRowClass}>
                  <button
                    type="button"
                    className={smartPolicePrimaryButtonClass}
                    disabled={genBusy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "อัปเดตจากข้อมูลคดีจะแทนที่เนื้อหาปัจจุบัน — ดำเนินการต่อ?",
                        )
                      ) {
                        return;
                      }
                      void generateDocs(["MEMO"], { preferTab: "memo" });
                    }}
                  >
                    {genBusy ? "…" : "อัปเดตจากข้อมูลคดี"}
                  </button>
                  <Link
                    href={documentPreviewHref(caseId, memoDoc.id)}
                    className={cn(smartPoliceOutlineButtonClass, "inline-flex")}
                  >
                    ดู A4
                  </Link>
                  <button
                    type="button"
                    className={smartPoliceOutlineButtonClass}
                    onClick={() => void printDoc(memoDoc.id)}
                  >
                    พิมพ์
                  </button>
                </div>
                <label className={smartPoliceLabelClass}>
                  เนื้อหาบันทึก
                  <textarea
                    className={cn(smartPoliceTextareaClass, "mt-1 min-h-[18rem] font-mono text-[13px] leading-relaxed")}
                    defaultValue={memoDoc.content}
                    key={`memo-${memoDoc.id}-${data.updatedAt}`}
                    disabled={saving || genBusy}
                    onBlur={(e) => {
                      if (e.target.value !== memoDoc.content) {
                        void saveMemoContent(memoDoc.id, e.target.value);
                      }
                    }}
                  />
                </label>
              </>
            )}
          </div>
        ) : null}

        {tab === "docs" ? (
          <div role="tabpanel" className="space-y-2">
            <div className="space-y-1 rounded-md border border-slate-200/80 bg-slate-50/50 p-2">
              <div className={smartPoliceCardHeaderRowClass}>
                <div className={smartPoliceCardTitleRowClass}>
                  <h3 className={smartPoliceCardTitleClass}>วันแรก</h3>
                  <span className={smartPoliceCardMetaClass}>
                    {day1Summary.done}/{day1Summary.total}
                    {day1Summary.pending > 0 ? ` · ค้าง ${day1Summary.pending}` : ""}
                  </span>
                </div>
                {day1Summary.pending > 0 ? (
                  <button
                    type="button"
                    className={smartPolicePrimaryButtonClass}
                    disabled={genBusy}
                    onClick={() =>
                      void generateDocs(["MEMO", "STATEMENT_ALL", "PROPERTY_LIST"])
                    }
                  >
                    {genBusy ? "…" : "สร้างที่ขาด"}
                  </button>
                ) : null}
              </div>
              <ul className="space-y-1">
                {day1Items.map((item) => (
                  <li
                    key={item.key}
                    className={cn(
                      smartPoliceListRowAccentClass(item.done ? "emerald" : "amber"),
                      "flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
                    )}
                  >
                    <div className="min-w-0 text-left">
                      <p className="text-[13px] font-semibold text-[#1e1b4b]">{item.label}</p>
                    </div>
                    <div className={cn(smartPoliceToolbarRowClass, "shrink-0")}>
                      {!item.done && item.generateKind ? (
                        <button
                          type="button"
                          className={smartPoliceOutlineButtonClass}
                          disabled={genBusy}
                          onClick={() => void generateDocs([item.generateKind!])}
                        >
                          สร้าง
                        </button>
                      ) : null}
                      {item.documentId ? (
                        <>
                          <Link
                            href={documentPreviewHref(caseId, item.documentId)}
                            className={cn(smartPolicePrimaryButtonClass, "inline-flex")}
                          >
                            A4
                          </Link>
                          <button
                            type="button"
                            className={smartPoliceOutlineButtonClass}
                            onClick={() => void printDoc(item.documentId!)}
                          >
                            พิมพ์
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={smartPoliceCardHeaderRowClass}>
              <div className={smartPoliceCardTitleRowClass}>
                <h3 className={smartPoliceCardTitleClass}>เอกสาร</h3>
                <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                  {data.documents.length}
                </span>
              </div>
              <div className={smartPoliceHeaderActionShellClass}>
                <button
                  type="button"
                  className={cn(smartPoliceOutlineButtonClass, "border-transparent bg-transparent shadow-none")}
                  disabled={genBusy}
                  onClick={() => void generateDocs(["MEMO"], { preferTab: "memo" })}
                >
                  บันทึกพงส.
                </button>
                <button
                  type="button"
                  className={cn(smartPoliceOutlineButtonClass, "border-transparent bg-transparent shadow-none")}
                  disabled={genBusy}
                  onClick={() => void generateDocs(["STATEMENT_ALL"])}
                >
                  คำให้การ
                </button>
                <button
                  type="button"
                  className={cn(smartPoliceOutlineButtonClass, "border-transparent bg-transparent shadow-none")}
                  disabled={genBusy}
                  onClick={() => void generateDocs(["PROPERTY_LIST"])}
                >
                  ของกลาง
                </button>
                <button
                  type="button"
                  className={cn(smartPoliceOutlineButtonClass, "border-transparent bg-transparent shadow-none")}
                  disabled={genBusy}
                  onClick={() => void generateDocs(["INVESTIGATION_REPORT"])}
                >
                  รายงาน
                </button>
                <button
                  type="button"
                  className={smartPolicePrimaryButtonClass}
                  onClick={() => {
                    setEditingDocId(null);
                    setDocForm({ kind: "NARRATIVE", title: "", content: "" });
                    setDocModal(true);
                  }}
                >
                  + เอกสาร
                </button>
              </div>
            </div>
            {templateOptions.length > 0 ? (
              <div className={smartPoliceToolbarRowClass}>
                <span className="text-[10px] font-semibold text-[#66638c]">แม่แบบ</span>
                {templateOptions.slice(0, 8).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={smartPoliceOutlineButtonClass}
                    onClick={() => {
                      setDocForm({ kind: t.kind, title: t.name, content: t.content });
                      setEditingDocId(null);
                      setDocModal(true);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : null}
            <ul className="space-y-1.5">
              {data.documents.map((d) => (
                <li key={d.id} className={smartPoliceListRowClass}>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold text-[#4d47b6]">
                      {SMART_POLICE_DOCUMENT_KIND_LABEL[d.kind]}
                    </p>
                    <Link
                      href={documentPreviewHref(caseId, d.id)}
                      className="text-sm font-semibold text-[#1e1b4b] underline decoration-[#5b61ff]/40 underline-offset-2"
                    >
                      {d.title}
                    </Link>
                  </div>
                  <div className={cn(smartPoliceToolbarRowClass, "shrink-0")}>
                    {d.kind === "STATEMENT" ? (
                      <Link
                        href={documentEditHref(caseId, d.id)}
                        className={cn(smartPolicePrimaryButtonClass, "inline-flex")}
                      >
                        แก้ไข
                      </Link>
                    ) : null}
                    <Link
                      href={documentPreviewHref(caseId, d.id)}
                      className={cn(
                        d.kind === "STATEMENT" ? smartPoliceOutlineButtonClass : smartPolicePrimaryButtonClass,
                        "inline-flex",
                      )}
                    >
                      A4
                    </Link>
                    <button
                      type="button"
                      className={smartPoliceOutlineButtonClass}
                      onClick={() => void printDoc(d.id)}
                    >
                      พิมพ์
                    </button>
                    <button
                      type="button"
                      className={smartPoliceOutlineButtonClass}
                      onClick={() => {
                        setEditingDocId(d.id);
                        setDocForm({ kind: d.kind, title: d.title, content: d.content });
                        setDocModal(true);
                      }}
                    >
                      แก้ไข
                    </button>
                  </div>
                </li>
              ))}
              {data.documents.length === 0 ? (
                <p className={smartPoliceMutedTextClass}>
                  ยังไม่มีเอกสาร — ใช้ checklist หรือปุ่มสร้างด้านบน
                </p>
              ) : null}
            </ul>
          </div>
        ) : null}
        </div>
      </section>

      <FormModal
        open={partyModal}
        onClose={() => setPartyModal(false)}
        title={editingPartyId ? "แก้ไขบุคคล" : "เพิ่มบุคคล"}
        size={SMART_POLICE_ENTRY_MODAL_SIZE}
        footer={
          <FormModalFooterActions
            onCancel={() => setPartyModal(false)}
            onSubmit={() => void saveParty()}
            submitLabel="บันทึก"
            submitDisabled={!partyForm.fullName.trim()}
            loading={saving}
          />
        }
      >
        <div className={smartPoliceModalFormClass}>
          <div className="space-y-2">
            <p className={smartPoliceFormSectionTitleClass}>บทบาทในคดี</p>
            <div className={smartPoliceModalFieldGridClass}>
              <label className={smartPoliceLabelClass}>
                บทบาท
                <select
                  className={cn(smartPoliceSelectClass, "mt-1")}
                  value={partyForm.role}
                  onChange={(e) =>
                    setPartyForm((f) => ({ ...f, role: e.target.value as SmartPolicePartyRole }))
                  }
                >
                  {(Object.keys(SMART_POLICE_PARTY_ROLE_LABEL) as SmartPolicePartyRole[]).map((k) => (
                    <option key={k} value={k}>
                      {SMART_POLICE_PARTY_ROLE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={smartPoliceLabelClass}>
                เกี่ยวกับคดี *
                <select
                  className={cn(smartPoliceSelectClass, "mt-1")}
                  value={partyForm.caseRelation}
                  onChange={(e) => setPartyForm((f) => ({ ...f, caseRelation: e.target.value }))}
                >
                  <option value="">— เลือก —</option>
                  {SMART_POLICE_CASE_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              {partyForm.role === "WITNESS" ? (
                <label className={smartPoliceLabelClass}>
                  พยานฝ่าย
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={partyForm.witnessSide}
                    onChange={(e) =>
                      setPartyForm((f) => ({
                        ...f,
                        witnessSide: e.target.value as "" | SmartPoliceWitnessSide,
                      }))
                    }
                  >
                    <option value="">— เลือก —</option>
                    <option value="COMPLAINANT">{SMART_POLICE_WITNESS_SIDE_LABEL.COMPLAINANT}</option>
                    <option value="SUSPECT">{SMART_POLICE_WITNESS_SIDE_LABEL.SUSPECT}</option>
                  </select>
                </label>
              ) : null}
              {partyForm.role === "SUSPECT" ? (
                <label className={smartPoliceLabelClass}>
                  ผู้ต้องหาให้การ
                  <select
                    className={cn(smartPoliceSelectClass, "mt-1")}
                    value={partyForm.pleaStatus}
                    onChange={(e) => setPartyForm((f) => ({ ...f, pleaStatus: e.target.value }))}
                  >
                    <option value="">— เลือก —</option>
                    {SMART_POLICE_PLEA_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className={smartPoliceFormSectionTitleClass}>ข้อมูลบุคคล</p>
            <div className={smartPoliceModalFieldGridClass}>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                ชื่อ *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={partyForm.fullName}
                  onChange={(e) => setPartyForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                อายุ
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={partyForm.age}
                  onChange={(e) => setPartyForm((f) => ({ ...f, age: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                เลขบัตร
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={partyForm.idCard}
                  onChange={(e) => setPartyForm((f) => ({ ...f, idCard: e.target.value }))}
                />
              </label>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                ที่อยู่
                <textarea
                  className={cn(smartPoliceTextareaClass, "mt-1 min-h-[4.5rem]")}
                  value={partyForm.address}
                  onChange={(e) => setPartyForm((f) => ({ ...f, address: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                อาชีพ
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={partyForm.occupation}
                  onChange={(e) => setPartyForm((f) => ({ ...f, occupation: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ที่ทำงาน/ตำแหน่ง
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={partyForm.workplace}
                  onChange={(e) => setPartyForm((f) => ({ ...f, workplace: e.target.value }))}
                />
              </label>
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={evidenceModal}
        onClose={() => setEvidenceModal(false)}
        title={editingEvidenceId ? "แก้ไขของกลาง" : "เพิ่มของกลาง"}
        size={SMART_POLICE_ENTRY_MODAL_SIZE}
        footer={
          <FormModalFooterActions
            onCancel={() => setEvidenceModal(false)}
            onSubmit={() => void saveEvidence()}
            submitLabel="บันทึก"
            submitDisabled={!evidenceForm.name.trim()}
            loading={saving}
          />
        }
      >
        <div className={smartPoliceModalFormClass}>
          <div className="space-y-2">
            <p className={smartPoliceFormSectionTitleClass}>รายการของกลาง</p>
            <div className={smartPoliceModalFieldGridClass}>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                รายการ *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={evidenceForm.name}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                จำนวน (เช่น 10 เม็ด)
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={evidenceForm.quantityLabel}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, quantityLabel: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                เลขยึด
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={evidenceForm.seizureNo}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, seizureNo: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className={smartPoliceFormSectionTitleClass}>รายละเอียด</p>
            <div className={smartPoliceModalFieldGridClass}>
              <label className={smartPoliceLabelClass}>
                ยึด/ได้จาก
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={evidenceForm.seizedFrom}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, seizedFrom: e.target.value }))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ผู้ถือกรรมสิทธิ์
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={evidenceForm.ownerName}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, ownerName: e.target.value }))}
                />
              </label>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
                เหตุที่ไปอยู่ที่ผู้ต้องหา
                <textarea
                  className={cn(smartPoliceTextareaClass, "mt-1 min-h-[4.5rem]")}
                  value={evidenceForm.ownerNote}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, ownerNote: e.target.value }))}
                />
              </label>
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={docModal}
        onClose={() => setDocModal(false)}
        title={editingDocId ? "แก้ไขเอกสาร" : "เพิ่มเอกสาร"}
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => setDocModal(false)}
            onSubmit={() => void saveDoc()}
            submitLabel="บันทึก"
            submitDisabled={!docForm.title.trim()}
            loading={saving}
          />
        }
      >
        <div className={smartPoliceModalFormClass}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={smartPoliceLabelClass}>
              ประเภท
              <select
                className={cn(smartPoliceSelectClass, "mt-1")}
                value={docForm.kind}
                onChange={(e) =>
                  setDocForm((f) => ({ ...f, kind: e.target.value as SmartPoliceDocumentKind }))
                }
              >
                {(Object.keys(SMART_POLICE_DOCUMENT_KIND_LABEL) as SmartPoliceDocumentKind[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {SMART_POLICE_DOCUMENT_KIND_LABEL[k]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className={smartPoliceLabelClass}>
              ชื่อเอกสาร
              <input
                className={cn(smartPoliceFieldClass, "mt-1")}
                value={docForm.title}
                onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
              เนื้อหา
              <textarea
                className={cn(smartPoliceTextareaClass, "mt-1 min-h-[12.5rem] font-mono text-sm")}
                value={docForm.content}
                onChange={(e) => setDocForm((f) => ({ ...f, content: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </FormModal>

      <SmartPoliceChargePickerModal
        open={chargePickerOpen}
        onClose={() => setChargePickerOpen(false)}
        onSelect={(c) => {
          void patchCase({
            chargeText: c.chargeText,
            lawRefs: c.lawRefs ?? "",
          });
          showToast("ใส่ข้อหาจากคลังแล้ว");
        }}
      />
    </div>
  );
}
