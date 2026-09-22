"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
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

type CheckpointRow = {
  id: string;
  name: string;
  slug: string;
  zoneLabel: string | null;
  buildingLabel: string | null;
  floorLabel: string | null;
  lat: number | null;
  lng: number | null;
  geofenceRadiusM: number;
  isActive: boolean;
};

const emptyForm = () => ({
  name: "",
  zoneLabel: "",
  buildingLabel: "",
  floorLabel: "",
  lat: "",
  lng: "",
  geofenceRadiusM: 80,
  isActive: true,
});

export function SmartGuardTourCheckpointsPanel({
  onEmbeddedToolbar,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<CheckpointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/checkpoints", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setRows((data.checkpoints as CheckpointRow[]) ?? []);
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
    setForm(emptyForm());
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
          title="เพิ่มจุดตรวจ"
          aria-label="เพิ่มจุดตรวจ"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">เพิ่มจุดตรวจ</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar]);

  function openEdit(row: CheckpointRow) {
    setEditId(row.id);
    setForm({
      name: row.name,
      zoneLabel: row.zoneLabel ?? "",
      buildingLabel: row.buildingLabel ?? "",
      floorLabel: row.floorLabel ?? "",
      lat: row.lat != null ? String(row.lat) : "",
      lng: row.lng != null ? String(row.lng) : "",
      geofenceRadiusM: row.geofenceRadiusM,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      notice.error("กรอกชื่อจุดตรวจ");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        zoneLabel: form.zoneLabel.trim() || null,
        buildingLabel: form.buildingLabel.trim() || null,
        floorLabel: form.floorLabel.trim() || null,
        lat: form.lat.trim() === "" ? null : Number(form.lat),
        lng: form.lng.trim() === "" ? null : Number(form.lng),
        geofenceRadiusM: form.geofenceRadiusM,
        isActive: form.isActive,
      };
      const res = await fetch(
        editId
          ? `/api/smart-guard-tour/session/checkpoints/${editId}`
          : "/api/smart-guard-tour/session/checkpoints",
        {
          method: editId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editId ? "อัปเดตจุดตรวจแล้ว" : "เพิ่มจุดตรวจแล้ว");
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: CheckpointRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/checkpoints/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      notice.success("ปิดใช้งานจุดตรวจแล้ว");
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
            <p>ยังไม่มีจุดตรวจ</p>
            <button type="button" className={smartGuardTourInlineSubNavBtnClass(true)} onClick={openAdd}>
              + เพิ่มจุดตรวจแรก
            </button>
          </AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(row.isActive ? "sky" : "slate")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={smartGuardTourCardIconTileClass(row.isActive ? "sky" : "slate")}>
                  <MapPin className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.name}</p>
                  <p className="truncate text-xs font-medium text-[#66638c]">
                    {[row.zoneLabel, row.buildingLabel, row.floorLabel].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  <p className="text-[10px] font-bold text-[#66638c]">
                    รัศมี {row.geofenceRadiusM} ม. · {row.isActive ? "ใช้งาน" : "ปิด"}
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
        title={editId ? "แก้ไขจุดตรวจ" : "เพิ่มจุดตรวจ"}
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
            ชื่อจุดตรวจ *
            <input
              className={smartGuardTourFieldClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น ประตูหลัก A"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ชั้น
              <input
                className={smartGuardTourFieldClass}
                value={form.floorLabel}
                onChange={(e) => setForm((f) => ({ ...f, floorLabel: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ละติจูด
              <input
                className={smartGuardTourFieldClass}
                inputMode="decimal"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="13.7563"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ลองจิจูด
              <input
                className={smartGuardTourFieldClass}
                inputMode="decimal"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                placeholder="100.5018"
              />
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              รัศมี geofence (ม.)
              <input
                className={smartGuardTourFieldClass}
                type="number"
                min={10}
                max={2000}
                value={form.geofenceRadiusM}
                onChange={(e) =>
                  setForm((f) => ({ ...f, geofenceRadiusM: Number(e.target.value) || 80 }))
                }
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#4d47b6]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            เปิดใช้งาน
          </label>
        </div>
      </FormModal>
    </div>
  );
}
