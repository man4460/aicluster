"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  DocRecordFormModal,
  type DocRecordFormValues,
} from "@/systems/doc-transmission/components/DocRecordFormModal";
import {
  DOC_AUDIT_ACTION_LABEL,
  DOC_CATEGORY_BY_SLUG,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
  DOC_TIMELINE_ACTION_LABEL,
  formatThaiDateLong,
  formatThaiDateTime,
} from "@/systems/doc-transmission/lib/doc-types";

type DocCategory = "ORDERS" | "MEMOS" | "INCOMING" | "OUTGOING" | "CIRCULARS";
type DocStatus = "NORMAL" | "IN_PROGRESS" | "DONE" | "CANCELED";
type DocPriority = "NORMAL" | "URGENT" | "IMMEDIATE";
type DocTimelineAction =
  | "CREATED"
  | "RECEIVED"
  | "REGISTERED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "SIGNED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "NOTE"
  | "FILE_REPLACED"
  | "STATUS_CHANGED";
type DocAuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "ASSIGN"
  | "FILE_REPLACE"
  | "SHARE_ENABLED"
  | "SHARE_DISABLED"
  | "TIMELINE_ADDED";

type Record = {
  id: string;
  category: DocCategory;
  academicYear: string;
  docNumber: string;
  runningSeq: number;
  subject: string;
  person: string | null;
  department: { id: number; name: string; code: string } | null;
  recordDate: string;
  dueDate: string | null;
  status: DocStatus;
  priority: DocPriority;
  assigneeName: string | null;
  assigneeDept: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  publicShareToken: string | null;
  publicShareEnabledAt: string | null;
  trackingCode: string;
  note: string | null;
  timelineEntries: Array<{
    id: string;
    action: DocTimelineAction;
    fromStatus: DocStatus | null;
    toStatus: DocStatus | null;
    note: string | null;
    actorName: string | null;
    occurredAt: string;
  }>;
  attachmentRevisions: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: number | null;
    versionNo: number;
    uploadedByName: string | null;
    createdAt: string;
    note: string | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: DocAuditAction;
    actorName: string | null;
    createdAt: string;
  }>;
};

const QUICK_ACTIONS: Array<{
  action: "RECEIVED" | "REGISTERED" | "ASSIGNED" | "IN_TRANSIT" | "SIGNED" | "DELIVERED" | "COMPLETED" | "CANCELED";
  label: string;
  tone: string;
}> = [
  { action: "RECEIVED", label: "ลงรับ", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { action: "REGISTERED", label: "ลงทะเบียน", tone: "bg-blue-100 text-blue-700 border-blue-200" },
  { action: "ASSIGNED", label: "มอบหมาย", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  { action: "IN_TRANSIT", label: "เดินทาง", tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { action: "SIGNED", label: "ลงนาม", tone: "bg-violet-100 text-violet-700 border-violet-200" },
  { action: "DELIVERED", label: "นำส่งแล้ว", tone: "bg-teal-100 text-teal-700 border-teal-200" },
  { action: "COMPLETED", label: "เสร็จสิ้น", tone: "bg-emerald-200 text-emerald-800 border-emerald-300" },
  { action: "CANCELED", label: "ยกเลิก", tone: "bg-rose-100 text-rose-700 border-rose-200" },
];

export function DocRecordDetailClient({
  categorySlug,
  initialRecord,
  departments,
}: {
  categorySlug: string;
  initialRecord: Record;
  departments: ReadonlyArray<{ id: number; code: string; name: string }>;
}) {
  const category = DOC_CATEGORY_BY_SLUG[categorySlug];
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/doc-transmission/records/${record.id}`);
      const json = (await res.json().catch(() => null)) as { record?: Record; error?: string } | null;
      if (res.ok && json?.record) setRecord(json.record);
    } catch {
      /* noop */
    }
  }, [record.id]);

  const handleQuickTimeline = useCallback(
    async (action: (typeof QUICK_ACTIONS)[number]["action"], note?: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/doc-transmission/records/${record.id}/timeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note: note ?? undefined }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
        }
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [record.id, refresh],
  );

  const handleAddNote = useCallback(async () => {
    const text = noteText.trim();
    if (!text) return;
    await handleQuickTimeline("NOTE" as never, text);
    setNoteText("");
  }, [noteText, handleQuickTimeline]);

  const handleEnableShare = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/doc-transmission/records/${record.id}/share`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as { token?: string; error?: string } | null;
      if (!res.ok) throw new Error(j?.error ?? "เปิดลิงก์ไม่สำเร็จ");
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "เปิดลิงก์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [record.id, refresh]);

  const handleDisableShare = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/doc-transmission/records/${record.id}/share`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "ปิดลิงก์ไม่สำเร็จ");
      }
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ปิดลิงก์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [record.id, refresh]);

  const handleEditSubmit = useCallback(
    async (values: DocRecordFormValues) => {
      try {
        const body: globalThis.Record<string, unknown> = {
          subject: values.subject,
          docNumber: values.docNumber || undefined,
          academicYear: values.academicYear,
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
        const res = await fetch(`/api/doc-transmission/records/${record.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
        }
        if (values.attachmentUrl && values.attachmentName && values.attachmentUrl !== record.attachmentUrl) {
          await fetch(`/api/doc-transmission/records/${record.id}/attachment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileUrl: values.attachmentUrl,
              fileName: values.attachmentName,
              fileSize: values.attachmentSize ?? undefined,
            }),
          });
        }
        setEditOpen(false);
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      }
    },
    [record.id, record.attachmentUrl, refresh],
  );

  const handleDelete = useCallback(async () => {
    if (!confirm(`ลบเอกสาร "${record.subject}"?`)) return;
    try {
      const res = await fetch(`/api/doc-transmission/records/${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      router.replace(`/dashboard/doc-transmission/records/${categorySlug}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }, [record.id, record.subject, router, categorySlug]);

  const status = DOC_STATUS_BY_KEY[record.status];
  const priority = DOC_PRIORITY_BY_KEY[record.priority];
  const publicUrl = record.publicShareToken
    ? `/share/doc-transmission/${record.publicShareToken}`
    : null;

  const formInitial: DocRecordFormValues = {
    id: record.id,
    category: record.category,
    academicYear: record.academicYear,
    docNumber: record.docNumber,
    subject: record.subject,
    person: record.person ?? "",
    departmentId: record.department?.id ?? null,
    recordDate: record.recordDate.slice(0, 10),
    dueDate: record.dueDate ? record.dueDate.slice(0, 10) : null,
    status: record.status,
    priority: record.priority,
    assigneeName: record.assigneeName ?? "",
    assigneeDept: record.assigneeDept ?? "",
    attachmentUrl: record.attachmentUrl,
    attachmentName: record.attachmentName,
    attachmentSize: null,
    note: record.note ?? "",
  };

  if (!category) return null;

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/doc-transmission/records/${categorySlug}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d47b6] hover:underline"
      >
        ← กลับ {category.title}
      </Link>

      <AppDashboardSection tone="violet">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
                {category.title} · ปี {record.academicYear}
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-[#2e2a58] sm:text-xl">
                {record.subject}
              </h2>
              <p className="mt-1 text-sm text-[#4d47b6]">{record.docNumber}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-2 py-1 text-xs font-bold ring-1", status.badge)}>
                {status.label}
              </span>
              {record.priority !== "NORMAL" ? (
                <span className={cn("rounded-full px-2 py-1 text-xs font-bold ring-1", priority.tone)}>
                  {priority.label}
                </span>
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-3 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                {category.dateLabel}
              </dt>
              <dd className="font-semibold text-[#2e2a58]">
                {formatThaiDateLong(new Date(record.recordDate))}
              </dd>
            </div>
            {record.dueDate ? (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                  กำหนดเสร็จ
                </dt>
                <dd className="font-semibold text-[#2e2a58]">
                  {formatThaiDateLong(new Date(record.dueDate))}
                </dd>
              </div>
            ) : null}
            {record.person ? (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                  {category.personLabel}
                </dt>
                <dd className="font-semibold text-[#2e2a58]">{record.person}</dd>
              </div>
            ) : null}
            {record.department ? (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                  หน่วยงานที่เกี่ยวข้อง
                </dt>
                <dd className="font-semibold text-[#2e2a58]">
                  {record.department.code} · {record.department.name}
                </dd>
              </div>
            ) : null}
            {record.assigneeName ? (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                  ผู้รับมอบ
                </dt>
                <dd className="font-semibold text-[#2e2a58]">
                  {record.assigneeName}
                  {record.assigneeDept ? ` · ${record.assigneeDept}` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                Tracking Code
              </dt>
              <dd className="font-mono text-[#4d47b6]">{record.trackingCode}</dd>
            </div>
          </dl>

          {record.note ? (
            <div className="rounded-xl border border-white/60 bg-white/60 p-3 text-sm text-[#2e2a58]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">หมายเหตุ</p>
              <p className="mt-1 whitespace-pre-wrap">{record.note}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="app-btn-soft inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-[#dcd8f0] px-3 text-sm font-semibold text-[#4d47b6] hover:bg-[#f4f3ff]"
            >
              แก้ไขเอกสาร
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              ลบเอกสาร
            </button>
            {record.attachmentUrl ? (
              <a
                href={record.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3",
                )}
              >
                เปิดไฟล์ {record.attachmentName ?? "PDF"}
              </a>
            ) : null}
          </div>
        </div>
      </AppDashboardSection>

      {/* Workflow / timeline */}
      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="Workflow Timeline"
          description="บันทึกเหตุการณ์ตามลำดับ — ใช้ปุ่มด้านล่างเพื่อเพิ่มเหตุการณ์ใหม่"
        />

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q.action}
              type="button"
              disabled={busy}
              onClick={() => void handleQuickTimeline(q.action)}
              className={cn(
                "inline-flex min-h-[36px] items-center rounded-full border px-3 text-xs font-semibold transition disabled:opacity-50",
                q.tone,
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="บันทึกเพิ่มเติม… (เช่น ส่งไปยังผู้บริหาร)"
            className="min-h-[40px] flex-1 rounded-xl border border-[#dcd8f0] bg-white/85 px-3 text-sm"
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={busy || !noteText.trim()}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
          >
            + บันทึก
          </button>
        </div>

        <ol className="mt-4 space-y-2 border-l-2 border-[#e6e2f5] pl-4">
          {record.timelineEntries.length === 0 ? (
            <li>
              <AppEmptyState>ยังไม่มีเหตุการณ์</AppEmptyState>
            </li>
          ) : (
            record.timelineEntries.map((t) => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-[#5b61ff] ring-4 ring-white" />
                <div className="rounded-xl border border-white/60 bg-white/70 p-2.5 ring-1 ring-white/55">
                  <p className="text-sm font-semibold text-[#2e2a58]">
                    {DOC_TIMELINE_ACTION_LABEL[t.action]}
                    {t.action === "STATUS_CHANGED" && t.fromStatus && t.toStatus
                      ? ` · ${DOC_STATUS_BY_KEY[t.fromStatus].label} → ${DOC_STATUS_BY_KEY[t.toStatus].label}`
                      : ""}
                  </p>
                  {t.note ? <p className="mt-0.5 text-xs text-[#5f5a8a]">{t.note}</p> : null}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[#9591b8]">
                    {formatThaiDateTime(new Date(t.occurredAt))}
                    {t.actorName ? ` · โดย ${t.actorName}` : ""}
                  </p>
                </div>
              </li>
            ))
          )}
        </ol>
      </AppDashboardSection>

      {/* Attachment revisions */}
      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="ประวัติไฟล์แนบ (Revisions)"
          description="ทุกครั้งที่อัปไฟล์ใหม่จะเก็บเป็นเวอร์ชันใหม่ — เปิดเทียบย้อนหลังได้"
        />
        {record.attachmentRevisions.length === 0 ? (
          <AppEmptyState>ยังไม่มีไฟล์แนบ</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {record.attachmentRevisions.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/70 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2e2a58]">
                    v{r.versionNo} · {r.fileName}
                  </p>
                  <p className="text-[10px] text-[#9591b8]">
                    {formatThaiDateTime(new Date(r.createdAt))}
                    {r.uploadedByName ? ` · โดย ${r.uploadedByName}` : ""}
                    {r.fileSize ? ` · ${(r.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}
                  </p>
                </div>
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[36px] items-center gap-1 rounded-xl px-3 text-xs",
                  )}
                >
                  เปิด PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      {/* Public share */}
      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="Public Share Link"
          description="ลิงก์อ่านอย่างเดียวสำหรับผู้นอกระบบ — ปิดได้ตลอดเวลา"
        />
        {publicUrl ? (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center">
            <code className="break-all text-xs font-mono text-emerald-800">{publicUrl}</code>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.origin + publicUrl);
                }}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700"
              >
                คัดลอก
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700"
              >
                เปิดดู
              </a>
              <button
                type="button"
                onClick={handleDisableShare}
                disabled={busy}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700"
              >
                ปิดลิงก์
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnableShare}
            disabled={busy}
            className="app-btn-primary inline-flex min-h-[40px] items-center gap-1 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
          >
            สร้างลิงก์สาธารณะ
          </button>
        )}
      </AppDashboardSection>

      {/* Audit logs */}
      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="Audit Log"
          description="บันทึกการแก้ไข/ลบ/เปลี่ยนสถานะ — ตรวจสอบย้อนหลังได้"
        />
        {record.auditLogs.length === 0 ? (
          <AppEmptyState>ยังไม่มีบันทึกการเปลี่ยนแปลง</AppEmptyState>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {record.auditLogs.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-white/55 bg-white/65 px-3 py-1.5"
              >
                <span className="font-semibold text-[#2e2a58]">{DOC_AUDIT_ACTION_LABEL[a.action]}</span>
                <span className="shrink-0 text-[11px] text-[#9591b8]">
                  {formatThaiDateTime(new Date(a.createdAt))}
                  {a.actorName ? ` · ${a.actorName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <DocRecordFormModal
        open={editOpen}
        category={category}
        initial={formInitial}
        departments={departments}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
