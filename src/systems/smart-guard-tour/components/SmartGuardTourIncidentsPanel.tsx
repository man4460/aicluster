"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  smartGuardTourCardIconTileClass,
  smartGuardTourTonedRowCardClass,
} from "@/systems/smart-guard-tour/lib/card-tones";
import {
  smartGuardTourFieldClass,
  smartGuardTourInlineSubNavBtnClass,
  smartGuardTourTextareaClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";
import type { SmartGuardTourListToolbarApi } from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";

type IncidentRow = {
  id: string;
  title: string;
  kind: string;
  status: string;
  severity: string;
  detail: string | null;
  checkpointName: string | null;
  staffName: string | null;
  contactName: string | null;
  createdAt: string;
};

const KIND_TH: Record<string, string> = {
  ISSUE: "ปัญหา",
  SOS_URGENT: "SOS",
  OTHER: "อื่นๆ",
};

const STATUS_TH: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังจัดการ",
  RESOLVED: "แก้แล้ว",
  CLOSED: "ปิด",
};

const SEV_TH: Record<string, string> = {
  LOW: "ต่ำ",
  MEDIUM: "กลาง",
  HIGH: "สูง",
  CRITICAL: "วิกฤต",
};

export function SmartGuardTourIncidentsPanel({
  onEmbeddedToolbar,
  readOnly = false,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
  readOnly?: boolean;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; name: string }>>([]);
  const [staff, setStaff] = useState<Array<{ id: string; displayName: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; displayName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    kind: "ISSUE",
    severity: "MEDIUM",
    status: "PENDING",
    detail: "",
    checkpointId: "",
    staffId: "",
    contactId: "",
    resolvedNote: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, cRes, sRes, ctRes] = await Promise.all([
        fetch("/api/smart-guard-tour/session/incidents", { credentials: "include" }),
        fetch("/api/smart-guard-tour/session/checkpoints", { credentials: "include" }),
        fetch("/api/smart-guard-tour/session/staff", { credentials: "include" }),
        fetch("/api/smart-guard-tour/session/contacts", { credentials: "include" }),
      ]);
      const iJson = await iRes.json();
      if (!iRes.ok) throw new Error(iJson.error || "โหลดไม่สำเร็จ");
      setRows((iJson.incidents as IncidentRow[]) ?? []);
      if (cRes.ok) {
        const j = await cRes.json();
        setCheckpoints(
          ((j.checkpoints as Array<{ id: string; name: string; isActive?: boolean }>) ?? [])
            .filter((x) => x.isActive !== false)
            .map((x) => ({ id: x.id, name: x.name })),
        );
      }
      if (sRes.ok) {
        const j = await sRes.json();
        setStaff(
          ((j.staff as Array<{ id: string; displayName: string; isActive?: boolean }>) ?? [])
            .filter((x) => x.isActive !== false)
            .map((x) => ({ id: x.id, displayName: x.displayName })),
        );
      }
      if (ctRes.ok) {
        const j = await ctRes.json();
        setContacts(
          ((j.contacts as Array<{ id: string; displayName: string; isActive?: boolean }>) ?? [])
            .filter((x) => x.isActive !== false)
            .map((x) => ({ id: x.id, displayName: x.displayName })),
        );
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({
      title: "",
      kind: "ISSUE",
      severity: "MEDIUM",
      status: "PENDING",
      detail: "",
      checkpointId: "",
      staffId: "",
      contactId: "",
      resolvedNote: "",
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!onEmbeddedToolbar || readOnly) return;
    onEmbeddedToolbar({
      showFilter: false,
      extra: (
        <button
          type="button"
          className={smartGuardTourInlineSubNavBtnClass(false)}
          title="แจ้งเหตุการณ์"
          aria-label="แจ้งเหตุการณ์"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">แจ้งเหตุ</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar, readOnly]);

  async function save() {
    if (!form.title.trim()) {
      notice.error("กรอกหัวข้อเหตุการณ์");
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        const res = await fetch(`/api/smart-guard-tour/session/incidents/${editId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            kind: form.kind,
            severity: form.severity,
            status: form.status,
            detail: form.detail.trim() || null,
            resolvedNote: form.resolvedNote.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
        notice.success("อัปเดตเหตุการณ์แล้ว");
      } else {
        const res = await fetch("/api/smart-guard-tour/session/incidents", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            kind: form.kind,
            severity: form.severity,
            detail: form.detail.trim() || null,
            checkpointId: form.checkpointId || null,
            staffId: form.staffId || null,
            contactId: form.contactId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
        notice.success("บันทึกเหตุการณ์แล้ว");
      }
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function closeRow(row: IncidentRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/incidents/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ปิดไม่สำเร็จ");
      notice.success("ปิดเหตุการณ์แล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ปิดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3">
      {notice.popup}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <AppEmptyState>
            <p>ยังไม่มีเหตุการณ์</p>
            {!readOnly ? (
              <button type="button" className={smartGuardTourInlineSubNavBtnClass(true)} onClick={openAdd}>
                + แจ้งเหตุการณ์
              </button>
            ) : null}
          </AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(
                row.status === "PENDING" || row.status === "IN_PROGRESS" ? "rose" : "slate",
              )}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={smartGuardTourCardIconTileClass(
                    row.status === "PENDING" || row.status === "IN_PROGRESS" ? "rose" : "slate",
                  )}
                >
                  <AlertTriangle className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.title}</p>
                  <p className="text-xs font-medium text-[#66638c]">
                    {KIND_TH[row.kind] ?? row.kind} · {SEV_TH[row.severity] ?? row.severity} ·{" "}
                    {STATUS_TH[row.status] ?? row.status}
                  </p>
                  <p className="truncate text-[10px] font-bold text-[#66638c]">
                    {[row.checkpointName, row.staffName, row.contactName].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
              </div>
              {!readOnly ? (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${row.title}`}
                    onClick={() => {
                      setEditId(row.id);
                      setForm({
                        title: row.title,
                        kind: row.kind,
                        severity: row.severity,
                        status: row.status,
                        detail: row.detail ?? "",
                        checkpointId: "",
                        staffId: "",
                        contactId: "",
                        resolvedNote: "",
                      });
                      setOpen(true);
                    }}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ปิด ${row.title}`}
                    disabled={busy || row.status === "CLOSED"}
                    onClick={() => void closeRow(row)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {!readOnly ? (
        <FormModal
          open={open}
          onClose={() => setOpen(false)}
          title={editId ? "แก้ไขเหตุการณ์" : "แจ้งเหตุการณ์"}
          size="md"
          footer={
            <FormModalFooterActions
              onCancel={() => setOpen(false)}
              onSubmit={() => void save()}
              submitLabel="บันทึก"
              submitDisabled={!form.title.trim() || busy}
              loading={busy}
            />
          }
        >
          <div className="space-y-3">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              หัวข้อ *
              <input
                className={smartGuardTourFieldClass}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ประเภท
                <select
                  className={smartGuardTourFieldClass}
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                >
                  {Object.entries(KIND_TH).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ความรุนแรง
                <select
                  className={smartGuardTourFieldClass}
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  {Object.entries(SEV_TH).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {editId ? (
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สถานะ
                <select
                  className={smartGuardTourFieldClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {Object.entries(STATUS_TH).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  จุดตรวจ (ถ้ามี)
                  <select
                    className={smartGuardTourFieldClass}
                    value={form.checkpointId}
                    onChange={(e) => setForm((f) => ({ ...f, checkpointId: e.target.value }))}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {checkpoints.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  พนักงานที่เกี่ยวข้อง
                  <select
                    className={smartGuardTourFieldClass}
                    value={form.staffId}
                    onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                  ผู้ติดต่อแจ้ง
                  <select
                    className={smartGuardTourFieldClass}
                    value={form.contactId}
                    onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              รายละเอียด
              <textarea
                className={smartGuardTourTextareaClass}
                value={form.detail}
                onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                rows={3}
              />
            </label>
            {editId && (form.status === "RESOLVED" || form.status === "CLOSED") ? (
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                บันทึกการแก้
                <input
                  className={smartGuardTourFieldClass}
                  value={form.resolvedNote}
                  onChange={(e) => setForm((f) => ({ ...f, resolvedNote: e.target.value }))}
                />
              </label>
            ) : null}
          </div>
        </FormModal>
      ) : null}
    </div>
  );
}
