"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  mrFilterChipClass,
  mrListRowCardCompactClass,
  mrSegmentShellClass,
} from "@/systems/media-registry/components/media-registry-ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type MasterRow = {
  id: string;
  masterType: string;
  masterName: string;
  status: string;
  sortOrder: number;
};

type LocRow = {
  id: string;
  building: string | null;
  room: string;
  cabinet: string | null;
  shelf: string | null;
  locationDetail: string;
  status: string;
  sortOrder: number;
};

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

export function MediaRegistryMasterClient() {
  const [tab, setTab] = useState<"master" | "loc">("master");
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [locs, setLocs] = useState<LocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mOpen, setMOpen] = useState(false);
  const [lOpen, setLOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mForm, setMForm] = useState({
    id: null as string | null,
    masterType: "ประเภทสื่อ",
    masterName: "",
    status: "ใช้งาน",
    sortOrder: "0",
  });

  const [lForm, setLForm] = useState({
    id: null as string | null,
    building: "",
    room: "",
    cabinet: "",
    shelf: "",
    locationDetail: "",
    status: "ใช้งาน",
    sortOrder: "0",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, lr] = await Promise.all([
        fetch("/api/media-registry/masters", { cache: "no-store" }),
        fetch("/api/media-registry/locations", { cache: "no-store" }),
      ]);
      const mj = await mr.json();
      const lj = await lr.json();
      if (mr.ok) setMasters(mj.items as MasterRow[]);
      if (lr.ok) setLocs(lj.items as LocRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitMaster = async () => {
    if (!mForm.masterName.trim()) return;
    setSubmitting(true);
    try {
      if (mForm.id) {
        const r = await fetch(`/api/media-registry/masters/${mForm.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            masterType: mForm.masterType.trim(),
            masterName: mForm.masterName.trim(),
            status: mForm.status.trim(),
            sortOrder: Number(mForm.sortOrder) || 0,
          }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        const r = await fetch("/api/media-registry/masters", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            masterType: mForm.masterType.trim(),
            masterName: mForm.masterName.trim(),
            status: mForm.status.trim(),
            sortOrder: Number(mForm.sortOrder) || 0,
          }),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "สร้างไม่สำเร็จ");
          return;
        }
      }
      setMOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const removeMaster = async (it: MasterRow) => {
    if (!confirm(`ลบ ${it.masterName}?`)) return;
    const r = await fetch(`/api/media-registry/masters/${it.id}`, { method: "DELETE" });
    if (!r.ok) alert("ลบไม่สำเร็จ");
    await refresh();
  };

  const submitLoc = async () => {
    if (!lForm.room.trim()) {
      alert("ระบุห้อง/โซน");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        building: lForm.building.trim() || null,
        room: lForm.room.trim(),
        cabinet: lForm.cabinet.trim() || null,
        shelf: lForm.shelf.trim() || null,
        locationDetail: lForm.locationDetail.trim() || undefined,
        status: lForm.status.trim(),
        sortOrder: Number(lForm.sortOrder) || 0,
      };
      if (lForm.id) {
        const r = await fetch(`/api/media-registry/locations/${lForm.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        const r = await fetch("/api/media-registry/locations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "สร้างไม่สำเร็จ");
          return;
        }
      }
      setLOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const removeLoc = async (it: LocRow) => {
    if (!confirm(`ลบที่เก็บ ${it.locationDetail}?`)) return;
    const r = await fetch(`/api/media-registry/locations/${it.id}`, { method: "DELETE" });
    if (!r.ok) alert("ลบไม่สำเร็จ");
    await refresh();
  };

  return (
    <>
      <div className={cn(mrSegmentShellClass, "sm:inline-flex")}>
        <button
          type="button"
          className={cn("flex-1 sm:flex-none", mrFilterChipClass(tab === "master"))}
          onClick={() => setTab("master")}
        >
          ข้อมูลหลัก
        </button>
        <button
          type="button"
          className={cn("flex-1 sm:flex-none", mrFilterChipClass(tab === "loc"))}
          onClick={() => setTab("loc")}
        >
          สถานที่เก็บ
        </button>
      </div>

      {tab === "master" ? (
        <AppDashboardSection tone="slate">
          <AppSectionHeader
            tone="slate"
            title="ข้อมูลหลัก (MASTER)"
            description="ประเภทสื่อ กลุ่มสาระ ฯลฯ — ใช้อ้างอิงตอนกรอกทะเบียน"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-2 sm:min-w-0 sm:px-4"
                aria-label="เพิ่มข้อมูลหลัก"
                onClick={() => {
                  setMForm({
                    id: null,
                    masterType: "ประเภทสื่อ",
                    masterName: "",
                    status: "ใช้งาน",
                    sortOrder: "0",
                  });
                  setMOpen(true);
                }}
              >
                <span className="hidden sm:inline">+ เพิ่ม</span>
                <span className="sm:hidden text-lg" aria-hidden>
                  +
                </span>
              </button>
            }
          />
          {loading ? (
            <p className="mt-3 text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : masters.length === 0 ? (
            <AppEmptyState className="mt-3">ยังไม่มีรายการ</AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {masters.map((m) => (
                <li
                  key={m.id}
                  className={cn(mrListRowCardCompactClass, "flex items-start justify-between gap-2")}
                >
                  <div>
                    <p className="font-semibold text-[#2e2a58]">{m.masterName}</p>
                    <p className="text-xs text-[#66638c]">
                      {m.masterType} · {m.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${m.masterName}`}
                      title="แก้ไข"
                      onClick={() => {
                        setMForm({
                          id: m.id,
                          masterType: m.masterType,
                          masterName: m.masterName,
                          status: m.status,
                          sortOrder: String(m.sortOrder),
                        });
                        setMOpen(true);
                      }}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${m.masterName}`}
                      title="ลบ"
                      onClick={() => void removeMaster(m)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      ) : (
        <AppDashboardSection tone="slate">
          <AppSectionHeader
            tone="slate"
            title="สถานที่เก็บ (LOCATIONS)"
            description="อาคาร ห้อง ตู้ ชั้น — เลือกในฟอร์มทะเบียนสื่อ"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-2 sm:min-w-0 sm:px-4"
                aria-label="เพิ่มสถานที่เก็บ"
                onClick={() => {
                  setLForm({
                    id: null,
                    building: "",
                    room: "",
                    cabinet: "",
                    shelf: "",
                    locationDetail: "",
                    status: "ใช้งาน",
                    sortOrder: "0",
                  });
                  setLOpen(true);
                }}
              >
                <span className="hidden sm:inline">+ เพิ่ม</span>
                <span className="sm:hidden text-lg" aria-hidden>
                  +
                </span>
              </button>
            }
          />
          {loading ? (
            <p className="mt-3 text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : locs.length === 0 ? (
            <AppEmptyState className="mt-3">ยังไม่มีสถานที่เก็บ</AppEmptyState>
          ) : (
            <ul className="mt-3 space-y-2">
              {locs.map((l) => (
                <li
                  key={l.id}
                  className={cn(mrListRowCardCompactClass, "flex items-start justify-between gap-2")}
                >
                  <div>
                    <p className="font-semibold text-[#2e2a58]">{l.locationDetail}</p>
                    <p className="text-xs text-[#66638c]">{l.status}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${l.locationDetail}`}
                      title="แก้ไข"
                      onClick={() => {
                        setLForm({
                          id: l.id,
                          building: l.building ?? "",
                          room: l.room,
                          cabinet: l.cabinet ?? "",
                          shelf: l.shelf ?? "",
                          locationDetail: l.locationDetail,
                          status: l.status,
                          sortOrder: String(l.sortOrder),
                        });
                        setLOpen(true);
                      }}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${l.locationDetail}`}
                      title="ลบ"
                      onClick={() => void removeLoc(l)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      )}

      <FormModal
        open={mOpen}
        onClose={() => setMOpen(false)}
        title={mForm.id ? "แก้ไขข้อมูลหลัก" : "เพิ่มข้อมูลหลัก"}
        footer={
          <FormModalFooterActions
            onCancel={() => setMOpen(false)}
            onSubmit={() => void submitMaster()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={submitting}
          />
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ประเภท master</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={mForm.masterType}
              onChange={(e) => setMForm((f) => ({ ...f, masterType: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ชื่อรายการ</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={mForm.masterName}
              onChange={(e) => setMForm((f) => ({ ...f, masterName: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">สถานะ</span>
              <input
                className={cn(inputCls, "mt-1")}
                value={mForm.status}
                onChange={(e) => setMForm((f) => ({ ...f, status: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">ลำดับ</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="number"
                value={mForm.sortOrder}
                onChange={(e) => setMForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={lOpen}
        onClose={() => setLOpen(false)}
        title={lForm.id ? "แก้ไขสถานที่" : "เพิ่มสถานที่เก็บ"}
        footer={
          <FormModalFooterActions
            onCancel={() => setLOpen(false)}
            onSubmit={() => void submitLoc()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={submitting}
          />
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">อาคาร</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={lForm.building}
              onChange={(e) => setLForm((f) => ({ ...f, building: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ห้อง *</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={lForm.room}
              onChange={(e) => setLForm((f) => ({ ...f, room: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">ตู้</span>
              <input
                className={cn(inputCls, "mt-1")}
                value={lForm.cabinet}
                onChange={(e) => setLForm((f) => ({ ...f, cabinet: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">ชั้น</span>
              <input
                className={cn(inputCls, "mt-1")}
                value={lForm.shelf}
                onChange={(e) => setLForm((f) => ({ ...f, shelf: e.target.value }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">รายละเอียดที่เก็บ (ทับอัตโนมัติถ้าว่าง)</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={lForm.locationDetail}
              onChange={(e) => setLForm((f) => ({ ...f, locationDetail: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </>
  );
}
