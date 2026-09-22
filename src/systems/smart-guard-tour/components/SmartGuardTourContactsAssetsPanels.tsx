"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Phone } from "lucide-react";
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
} from "@/systems/smart-guard-tour/lib/ui-tokens";
import type { SmartGuardTourListToolbarApi } from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";

type ContactRow = {
  id: string;
  displayName: string;
  phone: string | null;
  lineId: string | null;
  isActive: boolean;
  note: string | null;
};

type AssetRow = {
  id: string;
  name: string;
  kind: string;
  assetCode: string | null;
  status: string;
  note: string | null;
};

const ASSET_KIND_TH: Record<string, string> = {
  RADIO: "วิทยุ",
  FLASHLIGHT: "ไฟฉาย",
  VEHICLE: "ยานพาหนะ",
  OTHER: "อื่นๆ",
};

const ASSET_STATUS_TH: Record<string, string> = {
  AVAILABLE: "ว่าง",
  IN_USE: "ใช้งาน",
  MAINTENANCE: "ซ่อม",
  RETIRED: "เลิกใช้",
};

export function SmartGuardTourContactsPanel({
  onEmbeddedToolbar,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    lineId: "",
    note: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/contacts", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setRows((data.contacts as ContactRow[]) ?? []);
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
    setForm({ displayName: "", phone: "", lineId: "", note: "", isActive: true });
    setOpen(true);
  }

  useEffect(() => {
    if (!onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      showFilter: false,
      extra: (
        <button
          type="button"
          className={smartGuardTourInlineSubNavBtnClass(false)}
          title="เพิ่มผู้ติดต่อ"
          aria-label="เพิ่มผู้ติดต่อ"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">เพิ่มติดต่อ</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar]);

  async function save() {
    if (!form.displayName.trim()) {
      notice.error("กรอกชื่อผู้ติดต่อ");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        lineId: form.lineId.trim() || null,
        note: form.note.trim() || null,
        isActive: form.isActive,
      };
      const res = await fetch(
        editId
          ? `/api/smart-guard-tour/session/contacts/${editId}`
          : "/api/smart-guard-tour/session/contacts",
        {
          method: editId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editId ? "อัปเดตแล้ว" : "เพิ่มผู้ติดต่อแล้ว");
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: ContactRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/contacts/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      notice.success("ปิดใช้งานแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
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
            <p>ยังไม่มีผู้ติดต่อฉุกเฉิน</p>
            <button type="button" className={smartGuardTourInlineSubNavBtnClass(true)} onClick={openAdd}>
              + เพิ่มผู้ติดต่อ
            </button>
          </AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(row.isActive ? "violet" : "slate")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={smartGuardTourCardIconTileClass(row.isActive ? "violet" : "slate")}>
                  <Phone className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.displayName}</p>
                  <p className="truncate text-xs font-medium text-[#66638c]">
                    {[row.phone, row.lineId ? `LINE ${row.lineId}` : null].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไข ${row.displayName}`}
                  onClick={() => {
                    setEditId(row.id);
                    setForm({
                      displayName: row.displayName,
                      phone: row.phone ?? "",
                      lineId: row.lineId ?? "",
                      note: row.note ?? "",
                      isActive: row.isActive,
                    });
                    setOpen(true);
                  }}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ปิดใช้งาน ${row.displayName}`}
                  disabled={busy || !row.isActive}
                  onClick={() => void removeRow(row)}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "แก้ไขผู้ติดต่อ" : "เพิ่มผู้ติดต่อ"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setOpen(false)}
            onSubmit={() => void save()}
            submitLabel="บันทึก"
            submitDisabled={!form.displayName.trim() || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อ *
            <input
              className={smartGuardTourFieldClass}
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              โทร
              <input
                className={smartGuardTourFieldClass}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              LINE ID
              <input
                className={smartGuardTourFieldClass}
                value={form.lineId}
                onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            หมายเหตุ
            <input
              className={smartGuardTourFieldClass}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}

export function SmartGuardTourAssetsPanel({
  onEmbeddedToolbar,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    kind: "OTHER",
    assetCode: "",
    status: "AVAILABLE",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/assets", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setRows((data.assets as AssetRow[]) ?? []);
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
    setForm({ name: "", kind: "OTHER", assetCode: "", status: "AVAILABLE", note: "" });
    setOpen(true);
  }

  useEffect(() => {
    if (!onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      showFilter: false,
      extra: (
        <button
          type="button"
          className={smartGuardTourInlineSubNavBtnClass(false)}
          title="เพิ่มอุปกรณ์"
          aria-label="เพิ่มอุปกรณ์"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">เพิ่มอุปกรณ์</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar]);

  async function save() {
    if (!form.name.trim()) {
      notice.error("กรอกชื่ออุปกรณ์");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: form.kind,
        assetCode: form.assetCode.trim() || null,
        status: form.status,
        note: form.note.trim() || null,
      };
      const res = await fetch(
        editId
          ? `/api/smart-guard-tour/session/assets/${editId}`
          : "/api/smart-guard-tour/session/assets",
        {
          method: editId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editId ? "อัปเดตแล้ว" : "เพิ่มอุปกรณ์แล้ว");
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: AssetRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/assets/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      notice.success("เลิกใช้อุปกรณ์แล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
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
            <p>ยังไม่มีอุปกรณ์</p>
            <button type="button" className={smartGuardTourInlineSubNavBtnClass(true)} onClick={openAdd}>
              + เพิ่มอุปกรณ์
            </button>
          </AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(
                row.status === "RETIRED" ? "slate" : "orange",
              )}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={smartGuardTourCardIconTileClass(
                    row.status === "RETIRED" ? "slate" : "orange",
                  )}
                >
                  <Package className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.name}</p>
                  <p className="text-xs font-medium text-[#66638c]">
                    {ASSET_KIND_TH[row.kind] ?? row.kind} · {ASSET_STATUS_TH[row.status] ?? row.status}
                    {row.assetCode ? ` · ${row.assetCode}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไข ${row.name}`}
                  onClick={() => {
                    setEditId(row.id);
                    setForm({
                      name: row.name,
                      kind: row.kind,
                      assetCode: row.assetCode ?? "",
                      status: row.status,
                      note: row.note ?? "",
                    });
                    setOpen(true);
                  }}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`เลิกใช้ ${row.name}`}
                  disabled={busy || row.status === "RETIRED"}
                  onClick={() => void removeRow(row)}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setOpen(false)}
            onSubmit={() => void save()}
            submitLabel="บันทึก"
            submitDisabled={!form.name.trim() || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อ *
            <input
              className={smartGuardTourFieldClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
                {Object.entries(ASSET_KIND_TH).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะ
              <select
                className={smartGuardTourFieldClass}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {Object.entries(ASSET_STATUS_TH).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            รหัสอุปกรณ์
            <input
              className={smartGuardTourFieldClass}
              value={form.assetCode}
              onChange={(e) => setForm((f) => ({ ...f, assetCode: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}
