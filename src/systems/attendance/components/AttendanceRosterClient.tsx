"use client";

import {
  AppCameraCaptureModal,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  attendanceCardClass,
  attendanceEmptyStateClass,
  attendanceLabelClass,
  attendanceLabelMutedClass,
  attendanceOutlineBtnClass,
} from "@/systems/attendance/attendance-ui";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

type ShiftSlot = { index: number; label: string };
type Entry = {
  id: number;
  displayName: string;
  phone: string;
  isActive: boolean;
  rosterShiftIndex: number;
  photoUrl: string | null;
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

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/owner/roster", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      shiftSlots?: ShiftSlot[];
      entries?: Array<Entry & { photoUrl?: string | null }>;
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
    <div className="space-y-6">
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

      {listErr ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{listErr}</p>
      ) : null}
      {!listErr && shiftSlots.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่มีกะในระบบ — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คอิน
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งช่วงเวลากะ
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={openAddModal}
          disabled={Boolean(listErr) || shiftSlots.length === 0}
          className="app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          เพิ่มรายชื่อ
        </button>
      </div>

      <FormModal
        open={addModalOpen}
        onClose={closeAddModal}
        title="เพิ่มรายชื่อพนักงาน"
        description="กรอกชื่อ เบอร์โทร และกะที่ปฏิบัติงาน — รูปโปรไฟล์ไม่บังคับ"
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={closeAddModal}
              disabled={busy}
              className={cn(attendanceOutlineBtnClass, "px-4 py-2.5 disabled:opacity-50")}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="attendance-roster-add-form"
              disabled={busy || shiftSlots.length === 0}
              className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก…" : "บันทึกรายชื่อ"}
            </button>
          </div>
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
        ) : (
          <ul className="flex flex-col gap-1.5 sm:gap-2" aria-label="รายชื่อพนักงานในระบบ">
            {entries.map((r) => (
              <li key={r.id} className={attendanceCardClass}>
                <div className="flex gap-2 sm:gap-2.5">
                  <AppImageThumb
                    src={r.photoUrl}
                    alt=""
                    emptyLabel="ไม่มีรูป"
                    className="shrink-0"
                    onOpen={() => r.photoUrl && lightbox.open(r.photoUrl)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-balance text-sm font-semibold leading-tight text-[#2e2a58] line-clamp-2">
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
                        className={
                          r.isActive
                            ? "shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-200/70"
                            : "shrink-0 rounded-md bg-[#f4f2ff] px-2 py-0.5 text-[10px] font-semibold text-[#66638c] ring-1 ring-[#e8e6fc]"
                        }
                      >
                        {r.isActive ? "ใช้งาน" : "ปิดชั่วคราว"}
                      </button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-dashed border-[#e8e6fc] pt-1.5">
                      <span className={cn("shrink-0 tracking-wide", attendanceLabelMutedClass)}>รูป</span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 sm:flex-initial">
                        <AppImagePickCameraButtons
                          className="justify-end gap-1.5"
                          labels={photoLabels}
                          busy={photoBusyTarget === r.id}
                          onPickGallery={() => openEntryGallery(r.id)}
                          onPickCamera={() => openEntryCamera(r.id)}
                        />
                        {r.photoUrl ? (
                          <button
                            type="button"
                            disabled={photoBusy}
                            onClick={() => void clearEntryPhoto(r.id)}
                            className="shrink-0 text-[10px] font-semibold text-[#66638c] underline decoration-[#d8d6ec] hover:text-[#2e2a58] disabled:opacity-50"
                          >
                            ลบรูป
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2 border-t border-[#e8e6fc] pt-2">
                  <label
                    className={cn(
                      "min-w-0 flex-1 basis-[min(100%,16rem)] text-[10px]",
                      attendanceLabelMutedClass,
                    )}
                  >
                    กะที่ปฏิบัติงาน
                    <select
                      className="app-input mt-0.5 min-h-[40px] w-full rounded-lg px-2.5 py-1.5 text-sm touch-manipulation sm:min-h-0 sm:rounded-xl sm:px-3 sm:py-2"
                      value={clampNewShift(r.rosterShiftIndex, shiftSlots.length)}
                      onChange={(e) => void setEntryShift(r.id, Number(e.target.value))}
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
                    className="shrink-0 self-center text-[10px] font-semibold text-red-600 hover:underline sm:self-end"
                  >
                    ลบรายชื่อ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function clampNewShift(idx: number, slotCount: number): number {
  if (slotCount <= 0) return 0;
  return Math.max(0, Math.min(idx, slotCount - 1));
}
