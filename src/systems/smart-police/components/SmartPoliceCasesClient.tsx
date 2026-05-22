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
import type { SmartPoliceCaseStatus } from "@/generated/prisma/enums";

export function SmartPoliceCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<SmartPoliceCaseListItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | SmartPoliceCaseStatus>("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    caseType: SMART_POLICE_CASE_TYPES[0] as string,
    incidentPlace: "",
    summary: "",
  });

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
            <button
              type="button"
              className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl sm:min-w-0 sm:px-4"
              aria-label="เปิดคดีใหม่"
              onClick={() => setModalOpen(true)}
            >
              <IconSpPlus className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">+ คดีใหม่</span>
            </button>
          }
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="app-input min-h-[44px] flex-1 rounded-xl"
            placeholder="ค้นหาเลขคดี / ชื่อเรื่อง"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาคดี"
          />
          <select
            className="app-input min-h-[44px] rounded-xl sm:w-44"
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | SmartPoliceCaseStatus)}
            aria-label="กรองสถานะ"
          >
            <option value="">ทุกสถานะ</option>
            {(Object.keys(SMART_POLICE_CASE_STATUS_LABEL) as SmartPoliceCaseStatus[]).map((k) => (
              <option key={k} value={k}>
                {SMART_POLICE_CASE_STATUS_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : cases.length === 0 ? (
          <AppEmptyState className="mt-4">ไม่พบคดี — สร้างคดีใหม่เพื่อเริ่มบันทึกสำนวน</AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/smart-police/cases/${c.id}`}
                  className="flex flex-col gap-1 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-left transition hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1e1b4b]">
                      <span className="text-[#4d47b6]">{c.caseNumber}</span> — {c.title}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {c.caseType} · {SMART_POLICE_CASE_STATUS_LABEL[c.status]} · {c.documentCount}{" "}
                      เอกสาร · {c.partyCount} บุคคล
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#5b61ff]">เปิดคดี →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="เปิดคดีใหม่">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#2e2a58]">
            ชื่อเรื่องคดี *
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium text-[#2e2a58]">
            ประเภทคดี
            <select
              className="app-input mt-1 w-full rounded-xl"
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
          <label className="block text-sm font-medium text-[#2e2a58]">
            สถานที่เกิดเหตุ
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={form.incidentPlace}
              onChange={(e) => setForm((f) => ({ ...f, incidentPlace: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium text-[#2e2a58]">
            สรุปเหตุ (ย่อ)
            <textarea
              className="app-input mt-1 min-h-[80px] w-full rounded-xl"
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
