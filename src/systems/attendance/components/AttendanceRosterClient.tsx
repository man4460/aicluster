"use client";

import {
  AppCameraCaptureModal,
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  attendanceCardClass,
  attendanceEmptyStateClass,
  attendanceFilterChipClass,
  attendanceLabelClass,
  attendanceLabelMutedClass,
  attendanceRosterAccentBarClass,
  attendanceStatCardClass,
  attendanceZoneChipActiveClass,
  attendanceZoneChipFaceClass,
  attendanceZoneChipFaceIdleClass,
  attendanceZoneChipFpClass,
  attendanceZoneChipInactiveClass,
} from "@/systems/attendance/attendance-ui";
import { attendanceSectionRadiusClass } from "@/systems/attendance/lib/ui-tokens";
import { AttendanceFaceEnrollModal } from "@/systems/attendance/components/AttendanceFaceEnrollModal";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type ShiftSlot = { index: number; label: string };
type Entry = {
  id: number;
  displayName: string;
  phone: string;
  isActive: boolean;
  rosterShiftIndex: number;
  photoUrl: string | null;
  faceEnrolled: boolean;
  faceEnrolledAt: string | null;
  faceSampleCount: number;
  fingerprintSlot: number | null;
  fingerprintEnrolledAt: string | null;
};

async function uploadRosterPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/attendance/owner/roster/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const j = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
  if (!res.ok) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
  const url = j.imageUrl?.trim();
  if (!url) throw new Error("ไม่ได้รับลิงก์รูป");
  return url;
}

export function AttendanceRosterClient() {
  const lightbox = useAppImageLightbox();
  const rosterGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const rosterCameraInputRef = useRef<HTMLInputElement | null>(null);
  const rosterPhotoTargetRef = useRef<"new" | number | null>(null);

  const [shiftSlots, setShiftSlots] = useState<ShiftSlot[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newShiftIndex, setNewShiftIndex] = useState(0);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusyTarget, setPhotoBusyTarget] = useState<"new" | number | null>(null);
  const [rosterCameraOpen, setRosterCameraOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [faceEnrollId, setFaceEnrollId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [q, setQ] = useState("");

  const filtersActive = statusFilter !== "all" || Boolean(q.trim());

  const filteredEntries = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (statusFilter === "active" && !e.isActive) return false;
      if (statusFilter === "inactive" && e.isActive) return false;
      if (!needle) return true;
      return e.displayName.toLowerCase().includes(needle) || e.phone.includes(needle);
    });
  }, [entries, q, statusFilter]);

  const rosterStats = useMemo(() => {
    const active = entries.filter((e) => e.isActive).length;
    const face = entries.filter((e) => e.faceEnrolled).length;
    const finger = entries.filter((e) => e.fingerprintSlot != null).length;
    return { total: entries.length, active, face, finger };
  }, [entries]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/owner/roster", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      shiftSlots?: ShiftSlot[];
      entries?: Array<
        Entry & {
          photoUrl?: string | null;
          faceEnrolled?: boolean;
          faceEnrolledAt?: string | null;
          faceSampleCount?: number;
          fingerprintSlot?: number | null;
          fingerprintEnrolledAt?: string | null;
        }
      >;
      error?: string;
    };
    if (res.ok) {
      setListErr(null);
      const slots = j.shiftSlots ?? [];
      setShiftSlots(slots);
      setEntries(
        (j.entries ?? []).map((e) => ({
          ...e,
          photoUrl: e.photoUrl ?? null,
          faceEnrolled: Boolean(e.faceEnrolled),
          faceEnrolledAt: e.faceEnrolledAt ?? null,
          faceSampleCount: e.faceSampleCount ?? 0,
          fingerprintSlot: e.fingerprintSlot ?? null,
          fingerprintEnrolledAt: e.fingerprintEnrolledAt ?? null,
        })),
      );
      setNewShiftIndex((prev) => (slots.length > 0 && prev >= slots.length ? 0 : prev));
    } else {
      setShiftSlots([]);
      setEntries([]);
      setListErr(j.error ?? "โหลดรายชื่อไม่สำเร็จ");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetAddForm = useCallback(() => {
    setName("");
    setPhone("");
    setNewShiftIndex(0);
    setNewPhotoUrl(null);
    setErr(null);
  }, []);

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    resetAddForm();
  }, [resetAddForm]);

  const openAddModal = useCallback(() => {
    resetAddForm();
    setAddModalOpen(true);
  }, [resetAddForm]);

  const patchEntryPhoto = useCallback(
    async (id: number, photoUrl: string | null) => {
      const res = await fetch(`/api/attendance/owner/roster/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ photoUrl }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกรูปไม่สำเร็จ");
      await load();
    },
    [load],
  );

  const onRosterPhotoFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const target = rosterPhotoTargetRef.current;
      rosterPhotoTargetRef.current = null;
      if (target === null) return;
      setPhotoBusyTarget(target === "new" ? "new" : target);
      try {
        const url = await uploadRosterPhoto(file);
        if (target === "new") setNewPhotoUrl(url);
        else await patchEntryPhoto(target, url);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setPhotoBusyTarget(null);
      }
    },
    [patchEntryPhoto],
  );

  const onRosterCameraCapture = useCallback(
    async (file: File) => {
      setRosterCameraOpen(false);
      const target = rosterPhotoTargetRef.current;
      rosterPhotoTargetRef.current = null;
      if (target === null) return;
      setPhotoBusyTarget(target === "new" ? "new" : target);
      try {
        const url = await uploadRosterPhoto(file);
        if (target === "new") setNewPhotoUrl(url);
        else await patchEntryPhoto(target, url);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setPhotoBusyTarget(null);
      }
    },
    [patchEntryPhoto],
  );

  const openNewGallery = useCallback(() => {
    rosterPhotoTargetRef.current = "new";
    rosterGalleryInputRef.current?.click();
  }, []);

  const openNewCamera = useCallback(() => {
    rosterPhotoTargetRef.current = "new";
    setRosterCameraOpen(true);
  }, []);

  const openEntryGallery = useCallback((id: number) => {
    rosterPhotoTargetRef.current = id;
    rosterGalleryInputRef.current?.click();
  }, []);

  const openEntryCamera = useCallback((id: number) => {
    rosterPhotoTargetRef.current = id;
    setRosterCameraOpen(true);
  }, []);

  const clearEntryPhoto = useCallback(
    async (id: number) => {
      setPhotoBusyTarget(id);
      try {
        await patchEntryPhoto(id, null);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "ลบรูปไม่สำเร็จ");
      } finally {
        setPhotoBusyTarget(null);
      }
    },
    [patchEntryPhoto],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (shiftSlots.length === 0) {
      setErr("ตั้งค่ากะที่เมนูตั้งค่าเช็คอินก่อน");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        displayName: name.trim(),
        phone,
        rosterShiftIndex: clampNewShift(newShiftIndex, shiftSlots.length),
      };
      if (newPhotoUrl) body.photoUrl = newPhotoUrl;

      const res = await fetch("/api/attendance/owner/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      closeAddModal();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setEntryShift(id: number, rosterShiftIndex: number) {
    if (shiftSlots.length === 0) return;
    await fetch(`/api/attendance/owner/roster/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rosterShiftIndex: clampNewShift(rosterShiftIndex, shiftSlots.length) }),
    });
    await load();
  }

  async function toggleActive(id: number, isActive: boolean) {
    await fetch(`/api/attendance/owner/roster/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!confirm("ลบรายชื่อนี้?")) return;
    await fetch(`/api/attendance/owner/roster/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  const photoLabels = { gallery: "อัปโหลดรูป", camera: "ถ่ายรูป" } as const;
  const photoBusy = photoBusyTarget !== null;

  return (
    <AppDashboardSection tone="violet" className={cn(attendanceSectionRadiusClass, "space-y-4")}>
      <AppSectionHeader
        tone="violet"
        title="รายชื่อพนักงาน"
        description="ชื่อ · เบอร์ · กะ · ใบหน้า · ลายนิ้วมือ"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-controls="attendance-roster-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              className={cn(
                appTemplateOutlineButtonClass,
                "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 px-0 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
                filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive ? (
                <span
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
            </button>
            <button
              type="button"
              onClick={openAddModal}
              disabled={Boolean(listErr) || shiftSlots.length === 0}
              aria-label="เพิ่มรายชื่อ"
              className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[1rem] px-0 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-0 sm:px-4"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ เพิ่มรายชื่อ</span>
            </button>
          </div>
        }
      />

      {!loading && !listErr ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="สรุปรายชื่อ">
          <div className={cn(attendanceStatCardClass, "bg-gradient-to-br from-white/80 via-violet-50/40 to-fuchsia-50/30")}>
            <p className="text-[10px] font-bold text-[#66638c]">ทั้งหมด</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-[#1e1b4b]">{rosterStats.total}</p>
          </div>
          <div className={cn(attendanceStatCardClass, "bg-gradient-to-br from-white/80 via-emerald-50/45 to-teal-50/25")}>
            <p className="text-[10px] font-bold text-emerald-800/80">ใช้งาน</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-emerald-900">{rosterStats.active}</p>
          </div>
          <div className={cn(attendanceStatCardClass, "bg-gradient-to-br from-white/80 via-sky-50/45 to-cyan-50/30")}>
            <p className="text-[10px] font-bold text-sky-800/80">ใบหน้า</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-sky-900">{rosterStats.face}</p>
          </div>
          <div className={cn(attendanceStatCardClass, "bg-gradient-to-br from-white/80 via-amber-50/45 to-orange-50/25")}>
            <p className="text-[10px] font-bold text-amber-900/80">ลายนิ้วมือ</p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-amber-950">{rosterStats.finger}</p>
          </div>
        </div>
      ) : null}

      <div
        id="attendance-roster-filter-panel"
        className={cn("space-y-3", filterOpen ? "block" : "hidden")}
      >
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="กรองสถานะรายชื่อ">
          {(
            [
              { id: "all" as const, label: `ทั้งหมด (${entries.length})` },
              { id: "active" as const, label: `ใช้งาน (${entries.filter((e) => e.isActive).length})` },
              { id: "inactive" as const, label: `ปิด (${entries.filter((e) => !e.isActive).length})` },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === opt.id}
              className={attendanceFilterChipClass(statusFilter === opt.id)}
              onClick={() => setStatusFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          className="min-h-[44px] w-full rounded-[1rem] border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#2e2a58] outline-none backdrop-blur-sm focus:border-[#4d47b6]/50 focus:ring-2 focus:ring-[#5b61ff]/20"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อหรือเบอร์โทร"
          aria-label="ค้นหารายชื่อ"
        />
        {filtersActive ? (
          <p className="text-[11px] font-medium text-[#66638c]">
            แสดง {filteredEntries.length}/{entries.length}
            <button
              type="button"
              className="ml-2 font-bold text-[#4d47b6] underline"
              onClick={() => {
                setStatusFilter("all");
                setQ("");
              }}
            >
              ล้างกรอง
            </button>
          </p>
        ) : null}
      </div>

      <AppGalleryCameraFileInputs
        galleryInputRef={rosterGalleryInputRef}
        cameraInputRef={rosterCameraInputRef}
        onChange={onRosterPhotoFileChange}
      />
      <AppCameraCaptureModal
        open={rosterCameraOpen}
        title="ถ่ายรูปพนักงาน"
        onClose={() => {
          setRosterCameraOpen(false);
          rosterPhotoTargetRef.current = null;
        }}
        onCapture={(file) => void onRosterCameraCapture(file)}
        onRequestLegacyPicker={() => rosterCameraInputRef.current?.click()}
      />
      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} />
      {faceEnrollId != null ? (
        <AttendanceFaceEnrollModal
          open
          entryId={faceEnrollId}
          displayName={entries.find((e) => e.id === faceEnrollId)?.displayName ?? ""}
          sampleCount={entries.find((e) => e.id === faceEnrollId)?.faceSampleCount ?? 0}
          onClose={() => setFaceEnrollId(null)}
          onSaved={() => void load()}
        />
      ) : null}

      {listErr ? (
        <p className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">{listErr}</p>
      ) : null}
      {!listErr && shiftSlots.length === 0 ? (
        <p className="rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-900">
          ยังไม่มีกะในระบบ — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คอิน
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งช่วงเวลากะ
        </p>
      ) : null}

      <FormModal
        open={addModalOpen}
        onClose={closeAddModal}
        title="เพิ่มรายชื่อพนักงาน"
        description="กรอกชื่อ เบอร์โทร และกะที่ปฏิบัติงาน — รูปโปรไฟล์ไม่บังคับ"
        size="md"
        appearance="glass"
        footer={
          <FormModalFooterActions
            onCancel={closeAddModal}
            onSubmit={() => {
              const form = document.getElementById("attendance-roster-add-form") as HTMLFormElement | null;
              form?.requestSubmit();
            }}
            submitLabel="บันทึกรายชื่อ"
            submitDisabled={busy || shiftSlots.length === 0}
            loading={busy}
          />
        }
      >
        <form id="attendance-roster-add-form" onSubmit={add} className="flex flex-col gap-4">
          <label className={attendanceLabelClass}>
            ชื่อ-นามสกุล
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              className="app-input mt-1 block w-full min-h-[44px] rounded-xl px-3 py-2 text-sm touch-manipulation"
              placeholder="เช่น สมชาย ใจดี"
              autoComplete="name"
              required
            />
          </label>
          <label className={attendanceLabelClass}>
            เบอร์โทร
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              inputMode="numeric"
              autoComplete="tel"
              className="app-input mt-1 block w-full min-h-[44px] rounded-xl px-3 py-2 text-sm font-mono touch-manipulation"
              placeholder="0812345678"
              required
            />
          </label>
          <label className={attendanceLabelClass}>
            กะที่ปฏิบัติงาน
            <select
              className="app-input mt-1 block w-full min-h-[44px] rounded-xl px-3 py-2 text-sm touch-manipulation"
              value={newShiftIndex}
              onChange={(e) => setNewShiftIndex(Number(e.target.value))}
              disabled={shiftSlots.length === 0}
            >
              {shiftSlots.map((s) => (
                <option key={s.index} value={s.index}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="border-t border-dashed border-[#e8e6fc] pt-3">
            <span className={attendanceLabelClass}>รูปพนักงาน (ไม่บังคับ)</span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AppImageThumb
                src={newPhotoUrl}
                alt=""
                emptyLabel="ยังไม่มีรูป"
                onOpen={() => newPhotoUrl && lightbox.open(newPhotoUrl)}
              />
              <AppImagePickCameraButtons
                labels={photoLabels}
                disabled={shiftSlots.length === 0}
                busy={photoBusyTarget === "new"}
                onPickGallery={openNewGallery}
                onPickCamera={openNewCamera}
              />
              {newPhotoUrl ? (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => setNewPhotoUrl(null)}
                  className="text-[11px] font-semibold text-[#66638c] underline decoration-[#d8d6ec] hover:text-[#2e2a58] disabled:opacity-50"
                >
                  ลบรูป
                </button>
              ) : null}
            </div>
          </div>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
        </form>
      </FormModal>

      <div>
        {loading ? (
          <p className={attendanceEmptyStateClass}>กำลังโหลด…</p>
        ) : entries.length === 0 ? (
          <p className={attendanceEmptyStateClass}>
            ยังไม่มีรายชื่อ — กดปุ่ม <span className="font-semibold text-[#66638c]">เพิ่มรายชื่อ</span>{" "}
            แล้วกรอกเบอร์พนักงานและกะที่ปฏิบัติงานเพื่อใช้กับ QR / ลิงก์สาธารณะ
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className={attendanceEmptyStateClass}>ไม่พบรายชื่อตามเงื่อนไขกรอง</p>
        ) : (
          <ul className="flex flex-col gap-1.5 sm:gap-2" aria-label="รายชื่อพนักงานในระบบ">
            {filteredEntries.map((r) => (
              <li key={r.id} className={attendanceCardClass}>
                <div className={cn(attendanceRosterAccentBarClass, "mb-2")} aria-hidden />
                <div className="flex items-start gap-2">
                  <AppImageThumb
                    src={r.photoUrl}
                    alt=""
                    emptyLabel="ไม่มีรูป"
                    className="h-12 w-12 shrink-0"
                    onOpen={() => r.photoUrl && lightbox.open(r.photoUrl)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-balance text-sm font-black leading-tight text-[#1e1b4b] line-clamp-2">
                          {r.displayName}
                        </p>
                        <p
                          className="mt-0.5 truncate font-mono text-[11px] tabular-nums text-[#66638c]"
                          title={r.phone}
                        >
                          {r.phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggleActive(r.id, r.isActive)}
                        className={r.isActive ? attendanceZoneChipActiveClass : attendanceZoneChipInactiveClass}
                      >
                        {r.isActive ? "ใช้งาน" : "ปิด"}
                      </button>
                    </div>

                    <div className="mt-1.5 space-y-1 border-t border-dashed border-slate-100 pt-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-emerald-800/90">ใบหน้า</span>
                        <span className={r.faceEnrolled ? attendanceZoneChipFaceClass : attendanceZoneChipFaceIdleClass}>
                          {r.faceEnrolled
                            ? `แล้ว${r.faceSampleCount > 0 ? ` · ${r.faceSampleCount} มุม` : ""}`
                            : "ยังไม่ลงทะเบียน"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFaceEnrollId(r.id)}
                          className="min-h-[32px] shrink-0 rounded-md border border-emerald-200/80 bg-emerald-50/90 px-2 text-[10px] font-bold text-emerald-800"
                        >
                          {r.faceEnrolled ? "แก้" : "ลงทะเบียน"}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-sky-800/90">นิ้วมือ</span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          placeholder="slot"
                          aria-label={`slot ลายนิ้วมือ ${r.displayName}`}
                          defaultValue={r.fingerprintSlot ?? ""}
                          key={`fp-${r.id}-${r.fingerprintSlot ?? "x"}`}
                          className="app-input h-8 w-16 rounded-md border-sky-100 px-1.5 py-0 text-center text-xs tabular-nums"
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            const next = raw === "" ? null : Number(raw);
                            if (next === r.fingerprintSlot) return;
                            if (next != null && (!Number.isInteger(next) || next < 1 || next > 1000)) {
                              window.alert("slot ต้องเป็นจำนวนเต็ม 1–1000");
                              e.target.value = r.fingerprintSlot != null ? String(r.fingerprintSlot) : "";
                              return;
                            }
                            void (async () => {
                              const res = await fetch(`/api/attendance/owner/roster/${r.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ fingerprintSlot: next }),
                              });
                              const j = (await res.json().catch(() => ({}))) as { error?: string };
                              if (!res.ok) {
                                window.alert(j.error ?? "บันทึก slot ไม่สำเร็จ");
                                e.target.value = r.fingerprintSlot != null ? String(r.fingerprintSlot) : "";
                                return;
                              }
                              await load();
                            })();
                          }}
                        />
                        {r.fingerprintSlot != null ? (
                          <span className={attendanceZoneChipFpClass}>ผูกแล้ว</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#9490c0]">ยังไม่ผูก</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-violet-800/90">รูป</span>
                        <AppImagePickCameraButtons
                          className="justify-start gap-1"
                          labels={{ gallery: "อัปโหลด", camera: "ถ่าย" }}
                          busy={photoBusyTarget === r.id}
                          onPickGallery={() => openEntryGallery(r.id)}
                          onPickCamera={() => openEntryCamera(r.id)}
                        />
                        {r.photoUrl ? (
                          <button
                            type="button"
                            disabled={photoBusy}
                            onClick={() => void clearEntryPhoto(r.id)}
                            className="text-[10px] font-semibold text-[#66638c] underline decoration-[#d8d6ec] hover:text-[#2e2a58] disabled:opacity-50"
                          >
                            ลบ
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-1.5">
                  <label className={cn("min-w-0 flex-1", attendanceLabelMutedClass)}>
                    <span className="text-[10px]">กะ</span>
                    <select
                      className="app-input mt-0.5 min-h-[40px] w-full rounded-lg px-2.5 py-1.5 text-sm touch-manipulation sm:min-h-0 sm:rounded-xl sm:px-3 sm:py-2"
                      value={clampNewShift(r.rosterShiftIndex, shiftSlots.length)}
                      onChange={(e) => void setEntryShift(r.id, Number(e.target.value))}
                      aria-label={`กะของ ${r.displayName}`}
                    >
                      {shiftSlots.map((s) => (
                        <option key={s.index} value={s.index}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void remove(r.id)}
                    className={cn(assetRowRemoveIconButtonClass, "shrink-0 self-end")}
                    aria-label={`ลบรายชื่อ ${r.displayName}`}
                    title="ลบรายชื่อ"
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppDashboardSection>
  );
}

function clampNewShift(idx: number, slotCount: number): number {
  if (slotCount <= 0) return 0;
  return Math.max(0, Math.min(idx, slotCount - 1));
}
