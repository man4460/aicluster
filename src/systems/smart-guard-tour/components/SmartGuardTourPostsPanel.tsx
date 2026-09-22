"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
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
  smartGuardTourOutlineButtonClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";
import type { SmartGuardTourListToolbarApi } from "@/systems/smart-guard-tour/components/SmartGuardTourFilterToolbar";

type PostRow = {
  id: string;
  name: string;
  code: string | null;
  zoneLabel: string | null;
  buildingLabel: string | null;
  requiredStaffPerShift: number;
  isActive: boolean;
};

export function SmartGuardTourPostsPanel({
  onEmbeddedToolbar,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    zoneLabel: "",
    buildingLabel: "",
    requiredStaffPerShift: 1,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/posts", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setRows((data.posts as PostRow[]) ?? []);
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
      name: "",
      code: "",
      zoneLabel: "",
      buildingLabel: "",
      requiredStaffPerShift: 1,
      isActive: true,
    });
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
          title="เพิ่มจุดรักษาการณ์"
          aria-label="เพิ่มจุดรักษาการณ์"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">เพิ่มจุด</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar]);

  function openEdit(row: PostRow) {
    setEditId(row.id);
    setForm({
      name: row.name,
      code: row.code ?? "",
      zoneLabel: row.zoneLabel ?? "",
      buildingLabel: row.buildingLabel ?? "",
      requiredStaffPerShift: row.requiredStaffPerShift,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      notice.error("กรอกชื่อจุด");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        zoneLabel: form.zoneLabel.trim() || null,
        buildingLabel: form.buildingLabel.trim() || null,
        requiredStaffPerShift: form.requiredStaffPerShift,
        isActive: form.isActive,
      };
      const res = await fetch(
        editId
          ? `/api/smart-guard-tour/session/posts/${editId}`
          : "/api/smart-guard-tour/session/posts",
        {
          method: editId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editId ? "อัปเดตแล้ว" : "เพิ่มแล้ว");
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: PostRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/posts/${row.id}`, {
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
          <AppEmptyState>ยังไม่มีจุดรักษาการณ์</AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(row.isActive ? "orange" : "slate")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={smartGuardTourCardIconTileClass(row.isActive ? "orange" : "slate")}>
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.name}</p>
                  <p className="truncate text-xs font-medium text-[#66638c]">
                    {[row.code, row.zoneLabel, row.buildingLabel].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#66638c]">
                    คน/กะ {row.requiredStaffPerShift} · {row.isActive ? "ใช้งาน" : "ปิด"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไข ${row.name}`}
                  title="แก้ไข"
                  onClick={() => openEdit(row)}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ปิดใช้งาน ${row.name}`}
                  title="ปิดใช้งาน"
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
        title={editId ? "แก้ไขจุดรักษาการณ์" : "เพิ่มจุดรักษาการณ์"}
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
            ชื่อ
            <input
              className={smartGuardTourFieldClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            รหัส
            <input
              className={smartGuardTourFieldClass}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              โซน
              <input
                className={smartGuardTourFieldClass}
                value={form.zoneLabel}
                onChange={(e) => setForm((f) => ({ ...f, zoneLabel: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              อาคาร
              <input
                className={smartGuardTourFieldClass}
                value={form.buildingLabel}
                onChange={(e) => setForm((f) => ({ ...f, buildingLabel: e.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            คนต่อกะ
            <input
              type="number"
              min={1}
              max={8}
              className={smartGuardTourFieldClass}
              value={form.requiredStaffPerShift}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  requiredStaffPerShift: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-[#1e1b4b]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            ใช้งาน
          </label>
        </div>
      </FormModal>
    </div>
  );
}
