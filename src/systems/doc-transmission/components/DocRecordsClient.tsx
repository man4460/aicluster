"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  DocRecordFormModal,
  emptyFormValues,
  type DocRecordFormValues,
} from "@/systems/doc-transmission/components/DocRecordFormModal";
import {
  DOC_CATEGORY_BY_SLUG,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
  DOC_STATUS_LIST,
  DOC_PRIORITY_LIST,
  defaultThaiAcademicYear,
  formatThaiDateLong,
} from "@/systems/doc-transmission/lib/doc-types";

type Department = { id: number; code: string; name: string };

type DocRecordRow = {
  id: string;
  category: "ORDERS" | "MEMOS" | "INCOMING" | "OUTGOING" | "CIRCULARS";
  academicYear: string;
  docNumber: string;
  subject: string;
  person: string | null;
  department: { id: number; name: string; code: string } | null;
  recordDate: string;
  dueDate: string | null;
  status: "NORMAL" | "IN_PROGRESS" | "DONE" | "CANCELED";
  priority: "NORMAL" | "URGENT" | "IMMEDIATE";
  attachmentName: string | null;
  attachmentUrl: string | null;
  publicShareToken: string | null;
  trackingCode: string;
  assigneeName: string | null;
  assigneeDept: string | null;
  note: string | null;
};

const inputClass =
  "min-h-[40px] w-full rounded-xl border border-[#dcd8f0] bg-white/85 px-3 py-2 text-sm text-[#2e2a58] outline-none transition focus:border-[#4d47b6] focus:ring-2 focus:ring-[#4d47b6]/20";

export function DocRecordsClient({
  categorySlug,
  departments,
}: {
  categorySlug: string;
  departments: ReadonlyArray<Department>;
}) {
  const category = DOC_CATEGORY_BY_SLUG[categorySlug];

  const [items, setItems] = useState<DocRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filterYear, setFilterYear] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterQ, setFilterQ] = useState<string>("");

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filterYear) n += 1;
    if (filterStatus) n += 1;
    if (filterPriority) n += 1;
    if (filterDept) n += 1;
    if (filterQ.trim()) n += 1;
    return n;
  }, [filterYear, filterStatus, filterPriority, filterDept, filterQ]);

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<DocRecordFormValues>(() =>
    emptyFormValues(category?.key ?? "ORDERS"),
  );
  const [submitBusy, setSubmitBusy] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("category", category.key);
      if (filterYear) params.set("academicYear", filterYear);
      if (filterStatus) params.set("status", filterStatus);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterDept) params.set("departmentId", filterDept);
      if (filterQ.trim()) params.set("q", filterQ.trim());
      params.set("pageSize", "100");
      const res = await fetch(`/api/doc-transmission/records?${params.toString()}`);
      const json = (await res.json().catch(() => null)) as { items?: DocRecordRow[]; error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "โหลดข้อมูลไม่สำเร็จ");
      setItems(json?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [category, filterYear, filterStatus, filterPriority, filterDept, filterQ]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleAdd = useCallback(() => {
    if (!category) return;
    const init = emptyFormValues(category.key);
    init.academicYear = filterYear || defaultThaiAcademicYear();
    setFormInitial(init);
    setFormOpen(true);
  }, [category, filterYear]);

  const handleEdit = useCallback(
    (row: DocRecordRow) => {
      if (!category) return;
      setFormInitial({
        id: row.id,
        category: row.category,
        academicYear: row.academicYear,
        docNumber: row.docNumber,
        subject: row.subject,
        person: row.person ?? "",
        departmentId: row.department?.id ?? null,
        recordDate: row.recordDate.slice(0, 10),
        dueDate: row.dueDate ? row.dueDate.slice(0, 10) : null,
        status: row.status,
        priority: row.priority,
        assigneeName: row.assigneeName ?? "",
        assigneeDept: row.assigneeDept ?? "",
        attachmentUrl: row.attachmentUrl,
        attachmentName: row.attachmentName,
        attachmentSize: null,
        note: row.note ?? "",
      });
      setFormOpen(true);
    },
    [category],
  );

  const handleSubmit = useCallback(
    async (values: DocRecordFormValues) => {
      setSubmitBusy(true);
      try {
        const isEdit = Boolean(values.id);
        const url = isEdit
          ? `/api/doc-transmission/records/${values.id}`
          : "/api/doc-transmission/records";
        const method = isEdit ? "PATCH" : "POST";
        const body: Record<string, unknown> = {
          subject: values.subject,
          person: values.person.trim() || null,
          departmentId: values.departmentId,
          recordDate: values.recordDate,
          dueDate: values.dueDate,
          status: values.status,
          priority: values.priority,
          assigneeName: values.assigneeName.trim() || null,
          assigneeDept: values.assigneeDept.trim() || null,
          note: values.note.trim() || null,
        };
        if (!isEdit) {
          body.category = values.category;
          body.academicYear = values.academicYear;
          body.attachmentUrl = values.attachmentUrl;
          body.attachmentName = values.attachmentName;
          body.attachmentSize = values.attachmentSize ?? undefined;
        }
        if (values.docNumber !== undefined && values.docNumber !== null) {
          body.docNumber = values.docNumber;
        }
        if (isEdit && values.academicYear) body.academicYear = values.academicYear;

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => null)) as { error?: string; record?: DocRecordRow } | null;
        if (!res.ok) throw new Error(json?.error ?? "บันทึกไม่สำเร็จ");

        // ถ้าแก้ไข + เปลี่ยนไฟล์แนบ — บันทึก revision เพิ่ม
        if (isEdit && values.attachmentUrl && values.attachmentName) {
          const oldUrl = items.find((r) => r.id === values.id)?.attachmentUrl ?? null;
          if (values.attachmentUrl !== oldUrl) {
            await fetch(`/api/doc-transmission/records/${values.id}/attachment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileUrl: values.attachmentUrl,
                fileName: values.attachmentName,
                fileSize: values.attachmentSize ?? undefined,
              }),
            });
          }
        }

        setFormOpen(false);
        await fetchItems();
      } catch (e) {
        alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      } finally {
        setSubmitBusy(false);
      }
    },
    [fetchItems, items],
  );

  const handleDelete = useCallback(
    async (row: DocRecordRow) => {
      if (!confirm(`ลบเอกสาร "${row.subject}"?`)) return;
      try {
        const res = await fetch(`/api/doc-transmission/records/${row.id}`, { method: "DELETE" });
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) throw new Error(json?.error ?? "ลบไม่สำเร็จ");
        await fetchItems();
      } catch (e) {
        alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      }
    },
    [fetchItems],
  );

  if (!category) return null;

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title={category.title}
          description={category.description}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                aria-label="เปิดตัวกรอง"
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#dcd8f0] bg-white/80 px-2.5 text-[#4d47b6] transition hover:bg-[#f4f3ff] sm:hidden",
                )}
              >
                <IconFilter />
                {activeFilterCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4d47b6] px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label={`เพิ่ม ${category.title}`}
                onClick={handleAdd}
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
              >
                <IconPlus className="h-5 w-5 sm:hidden" />
                <span className="hidden sm:inline">+ เพิ่ม{category.shortTitle}</span>
              </button>
            </div>
          }
        />

        <div
          className={cn(
            "mt-3 grid gap-2 transition-all sm:grid sm:grid-cols-5 sm:gap-3",
            filterOpen ? "grid grid-cols-2" : "hidden sm:grid",
          )}
        >
          <input
            type="text"
            placeholder="ค้นหา…"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            className={cn(inputClass, "col-span-2 sm:col-span-2")}
          />
          <input
            type="text"
            placeholder="ปี (เช่น 2567)"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={inputClass}
            maxLength={4}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputClass}
          >
            <option value="">สถานะทั้งหมด</option>
            {DOC_STATUS_LIST.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={inputClass}
          >
            <option value="">ความเร่งด่วน</option>
            {DOC_PRIORITY_LIST.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className={cn(inputClass, "col-span-2 sm:col-span-1")}
          >
            <option value="">หน่วยงานทั้งหมด</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFilterYear("");
                setFilterStatus("");
                setFilterPriority("");
                setFilterDept("");
                setFilterQ("");
              }}
              className="col-span-2 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 sm:col-span-1"
            >
              ล้างตัวกรอง
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] p-6 text-center text-sm text-[#66638c]">
              กำลังโหลด…
            </div>
          ) : items.length === 0 ? (
            <AppEmptyState>
              ไม่พบเอกสารในหมวดนี้ — กดปุ่ม &quot;+ เพิ่ม{category.shortTitle}&quot; เพื่อเริ่มต้น
            </AppEmptyState>
          ) : (
            items.map((r) => {
              const status = DOC_STATUS_BY_KEY[r.status];
              const priority = DOC_PRIORITY_BY_KEY[r.priority];
              return (
                <article
                  key={r.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/80 p-3 ring-1 ring-white/55 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <Link
                        href={`/dashboard/doc-transmission/records/${category.slug}/${r.id}`}
                        className="truncate text-sm font-semibold text-[#2e2a58] hover:text-[#4d47b6] sm:text-base"
                      >
                        {r.subject}
                      </Link>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
                          status.badge,
                        )}
                      >
                        {status.label}
                      </span>
                      {r.priority !== "NORMAL" ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1",
                            priority.tone,
                          )}
                        >
                          {priority.label}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[#5f5a8a]">
                      {r.docNumber} · ปี {r.academicYear} · {formatThaiDateLong(new Date(r.recordDate))}
                      {r.person ? ` · ${r.person}` : ""}
                      {r.department ? ` · ${r.department.name}` : ""}
                    </p>
                    {r.attachmentUrl ? (
                      <a
                        href={r.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-semibold text-[#4d47b6] underline decoration-[#c7c3ea] underline-offset-2 hover:text-[#3730a3]"
                        aria-label={`เปิดไฟล์แนบ ${r.attachmentName ?? "PDF"} ในแท็บใหม่`}
                      >
                        <IconPaperclip /> {r.attachmentName ?? "เปิดไฟล์แนบ (PDF)"}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {r.attachmentUrl ? (
                      <a
                        href={r.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="เปิดไฟล์แนบ"
                        title="เปิดไฟล์แนบ"
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                        )}
                      >
                        <IconPdf />
                      </a>
                    ) : null}
                    <Link
                      href={`/dashboard/doc-transmission/records/${category.slug}/${r.id}`}
                      aria-label="เปิดรายละเอียด"
                      title="เปิดรายละเอียด"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#4d47b6] ring-1 ring-white/55 hover:bg-white"
                    >
                      <IconArrowRight />
                    </Link>
                    <button
                      type="button"
                      aria-label={`แก้ไข ${r.subject}`}
                      title="แก้ไข"
                      onClick={() => handleEdit(r)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#4d47b6] ring-1 ring-white/55 hover:bg-white"
                    >
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      aria-label={`ลบ ${r.subject}`}
                      title="ลบ"
                      onClick={() => void handleDelete(r)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </AppDashboardSection>

      <DocRecordFormModal
        open={formOpen}
        category={category}
        initial={formInitial}
        departments={departments}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        busy={submitBusy}
      />
    </div>
  );
}

function IconFilter() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="m21 12-9 9a5 5 0 1 1-7-7l9-9a3.5 3.5 0 1 1 5 5l-9 9a2 2 0 1 1-3-3l8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="m12 20 9-9-3-3-9 9zM3 21h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
