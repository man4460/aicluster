"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
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

type ScheduleRow = {
  id: string;
  name: string;
  routeMode: string;
  intervalMinutes: number;
  checkpointIds: string[];
  checkpointCount: number;
  isActive: boolean;
};

type CpOpt = { id: string; name: string; isActive: boolean };

export function SmartGuardTourSchedulesPanel({
  onEmbeddedToolbar,
}: {
  onEmbeddedToolbar?: (api: SmartGuardTourListToolbarApi | null) => void;
}) {
  const notice = useAppNoticePopup();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [checkpoints, setCheckpoints] = useState<CpOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    routeMode: "FREE",
    intervalMinutes: 120,
    checkpointIds: [] as string[],
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/smart-guard-tour/session/schedules", { credentials: "include" }),
        fetch("/api/smart-guard-tour/session/checkpoints", { credentials: "include" }),
      ]);
      const sJson = await sRes.json();
      const cJson = await cRes.json();
      if (!sRes.ok) throw new Error(sJson.error || "โหลดตารางไม่สำเร็จ");
      if (!cRes.ok) throw new Error(cJson.error || "โหลดจุดตรวจไม่สำเร็จ");
      setRows((sJson.schedules as ScheduleRow[]) ?? []);
      setCheckpoints((cJson.checkpoints as CpOpt[]) ?? []);
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
    const active = checkpoints.filter((c) => c.isActive);
    if (active.length === 0) {
      notice.error("เพิ่มจุดตรวจก่อน แล้วค่อยสร้างตารางสายตรวจ");
      return;
    }
    setEditId(null);
    setForm({
      name: "",
      routeMode: "FREE",
      intervalMinutes: 120,
      checkpointIds: [],
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
          title="เพิ่มตารางตรวจ"
          aria-label="เพิ่มตารางตรวจ"
          onClick={openAdd}
        >
          <span aria-hidden>+</span>
          <span className="hidden sm:inline">เพิ่มตาราง</span>
        </button>
      ),
    });
    return () => onEmbeddedToolbar(null);
  }, [onEmbeddedToolbar, checkpoints]);

  function openEdit(row: ScheduleRow) {
    setEditId(row.id);
    setForm({
      name: row.name,
      routeMode: row.routeMode === "SEQUENTIAL" ? "SEQUENTIAL" : "FREE",
      intervalMinutes: row.intervalMinutes,
      checkpointIds: row.checkpointIds ?? [],
      isActive: row.isActive,
    });
    setOpen(true);
  }

  function toggleCp(id: string) {
    setForm((f) => ({
      ...f,
      checkpointIds: f.checkpointIds.includes(id)
        ? f.checkpointIds.filter((x) => x !== id)
        : [...f.checkpointIds, id],
    }));
  }

  async function save() {
    if (!form.name.trim()) {
      notice.error("กรอกชื่อตาราง");
      return;
    }
    if (form.checkpointIds.length === 0) {
      notice.error("เลือกจุดตรวจอย่างน้อย 1 จุด");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        routeMode: form.routeMode,
        intervalMinutes: form.intervalMinutes,
        checkpointIds: form.checkpointIds,
        isActive: form.isActive,
      };
      const res = await fetch(
        editId
          ? `/api/smart-guard-tour/session/schedules/${editId}`
          : "/api/smart-guard-tour/session/schedules",
        {
          method: editId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editId ? "อัปเดตตารางแล้ว" : "เพิ่มตารางแล้ว");
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: ScheduleRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/schedules/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      notice.success("ปิดใช้งานตารางแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const activeCp = checkpoints.filter((c) => c.isActive);

  return (
    <div className="min-w-0 space-y-3">
      {notice.popup}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <AppEmptyState>
            <p>ยังไม่มีตารางสายตรวจ</p>
            <p className="text-xs font-medium text-[#66638c]">
              {activeCp.length === 0
                ? "ขั้นตอนถัดไป: ไปแท็บ «จุดตรวจ» เพิ่มจุดก่อน"
                : "เลือกจุดตรวจแล้วตั้งรอบการเดินสาย"}
            </p>
            <button
              type="button"
              className={smartGuardTourInlineSubNavBtnClass(true)}
              onClick={openAdd}
              disabled={activeCp.length === 0}
            >
              + เพิ่มตาราง
            </button>
          </AppEmptyState>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={smartGuardTourTonedRowCardClass(row.isActive ? "amber" : "slate")}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={smartGuardTourCardIconTileClass(row.isActive ? "amber" : "slate")}>
                  <CalendarClock className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{row.name}</p>
                  <p className="text-xs font-medium text-[#66638c]">
                    {row.routeMode === "SEQUENTIAL" ? "ตามลำดับ" : "อิสระ"} · ทุก{" "}
                    {row.intervalMinutes} นาที · {row.checkpointCount} จุด
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไข ${row.name}`}
                  onClick={() => openEdit(row)}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ปิดใช้งาน ${row.name}`}
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
        title={editId ? "แก้ไขตารางตรวจ" : "เพิ่มตารางตรวจ"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setOpen(false)}
            onSubmit={() => void save()}
            submitLabel="บันทึก"
            submitDisabled={!form.name.trim() || form.checkpointIds.length === 0 || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อตาราง *
            <input
              className={smartGuardTourFieldClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น สายรอบอาคาร A"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              โหมดทาง
              <select
                className={smartGuardTourFieldClass}
                value={form.routeMode}
                onChange={(e) => setForm((f) => ({ ...f, routeMode: e.target.value }))}
              >
                <option value="FREE">อิสระ</option>
                <option value="SEQUENTIAL">ตามลำดับ</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ช่วงนาทีต่อรอบ
              <input
                className={smartGuardTourFieldClass}
                type="number"
                min={15}
                max={1440}
                value={form.intervalMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, intervalMinutes: Number(e.target.value) || 120 }))
                }
              />
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-[#4d47b6]">จุดตรวจในสาย *</legend>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200/90 p-2">
              {activeCp.length === 0 ? (
                <p className="text-xs text-[#66638c]">ยังไม่มีจุดตรวจที่เปิดใช้</p>
              ) : (
                activeCp.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs font-semibold text-[#1e1b4b]">
                    <input
                      type="checkbox"
                      checked={form.checkpointIds.includes(c.id)}
                      onChange={() => toggleCp(c.id)}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </fieldset>
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
