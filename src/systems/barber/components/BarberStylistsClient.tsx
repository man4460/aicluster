"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppIconImage,
  AppIconPencil,
  AppIconPower,
  AppIconToolbarButton,
  AppIconTrash,
  AppIconUpload,
  AppTime24Input,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberDashboardHeaderTrailing } from "@/systems/barber/components/BarberDashboardHeaderTrailing";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import {
  BARBER_ALL_WEEKDAYS,
  BARBER_WEEKDAY_LABELS_TH,
  barberFormatWorkWeekdaysLabel,
} from "@/systems/barber/lib/stylist-schedule";
import {
  barberCardSurfaceRadiusClass,
  barberDashboardSegmentBtnClass,
  barberEmptyStateDashedClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberMutedLoadingNoticeClass,
  barberModalImagePreviewCloseBtnClass,
  barberListRowCardClass,
  barberModalBackdropClass,
  barberModalBackdropImagePreviewClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
} from "@/systems/barber/components/barber-ui-tokens";

type Stylist = {
  id: number;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  workStartTime: string;
  workEndTime: string;
  workWeekdays: number[];
  createdAt: string;
};

async function uploadStylistImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/barber/stylists/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
  const url = data.imageUrl?.trim();
  if (!url) throw new Error("อัปโหลดไม่สำเร็จ");
  return url;
}

export function BarberStylistsClient({
  embedded = false,
  showHubToolbar = false,
}: {
  embedded?: boolean;
  showHubToolbar?: boolean;
} = {}) {
  const router = useRouter();
  const [list, setList] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("20:00");
  const [workWeekdays, setWorkWeekdays] = useState<number[]>([...BARBER_ALL_WEEKDAYS]);
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState<string | null>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  const [editStylist, setEditStylist] = useState<Stylist | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWorkStartTime, setEditWorkStartTime] = useState("09:00");
  const [editWorkEndTime, setEditWorkEndTime] = useState("20:00");
  const [editWorkWeekdays, setEditWorkWeekdays] = useState<number[]>([...BARBER_ALL_WEEKDAYS]);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const rowUploadRef = useRef<HTMLInputElement>(null);
  /** ref ใช้แทน state — กัน race กับ click() เปิดไฟล์ก่อน re-render */
  const rowUploadStylistIdRef = useRef<number | null>(null);

  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/stylists?all=1");
    const data = (await res.json().catch(() => ({}))) as { stylists?: Stylist[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setList([]);
      return;
    }
    setList(
      (data.stylists ?? []).map((s) => ({
        ...s,
        workStartTime: s.workStartTime || "09:00",
        workEndTime: s.workEndTime || "20:00",
        workWeekdays: Array.isArray(s.workWeekdays) && s.workWeekdays.length > 0
          ? s.workWeekdays
          : [...BARBER_ALL_WEEKDAYS],
      })),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!addPhotoFile) {
      setAddPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const u = URL.createObjectURL(addPhotoFile);
    setAddPhotoPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [addPhotoFile]);

  useEffect(() => {
    if (!editPhotoFile) {
      setEditPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const u = URL.createObjectURL(editPhotoFile);
    setEditPhotoPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [editPhotoFile]);

  const closeAddModal = useCallback(() => {
    setAddOpen(false);
    setErr(null);
    setWorkStartTime("09:00");
    setWorkEndTime("20:00");
    setWorkWeekdays([...BARBER_ALL_WEEKDAYS]);
    setAddPhotoFile(null);
    if (addFileRef.current) addFileRef.current.value = "";
  }, []);

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditStylist(null);
    setEditName("");
    setEditPhone("");
    setEditWorkStartTime("09:00");
    setEditWorkEndTime("20:00");
    setEditWorkWeekdays([...BARBER_ALL_WEEKDAYS]);
    setEditPhotoFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
    setErr(null);
  }, []);

  function toggleWorkWeekday(day: number, mode: "add" | "edit") {
    const setter = mode === "add" ? setWorkWeekdays : setEditWorkWeekdays;
    setter((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  const anyModalOpen = addOpen || editOpen || Boolean(previewUrl);

  useEffect(() => {
    if (!anyModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewUrl) setPreviewUrl(null);
        else if (editOpen) closeEditModal();
        else closeAddModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [anyModalOpen, previewUrl, editOpen, closeAddModal, closeEditModal]);

  function openAddModal() {
    setErr(null);
    setName("");
    setPhone("");
    setWorkStartTime("09:00");
    setWorkEndTime("20:00");
    setWorkWeekdays([...BARBER_ALL_WEEKDAYS]);
    setAddPhotoFile(null);
    if (addFileRef.current) addFileRef.current.value = "";
    setAddOpen(true);
  }

  function openEditModal(s: Stylist) {
    setErr(null);
    setEditStylist(s);
    setEditName(s.name);
    setEditPhone(s.phone ?? "");
    setEditWorkStartTime(s.workStartTime || "09:00");
    setEditWorkEndTime(s.workEndTime || "20:00");
    setEditWorkWeekdays(
      Array.isArray(s.workWeekdays) && s.workWeekdays.length > 0
        ? [...s.workWeekdays]
        : [...BARBER_ALL_WEEKDAYS],
    );
    setEditPhotoFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
    setEditOpen(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr("กรอกชื่อช่าง");
      return;
    }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (addPhotoFile) {
        try {
          photoUrl = await uploadStylistImage(addPhotoFile);
        } catch (ue) {
          setErr(ue instanceof Error ? ue.message : "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
      }
      const res = await fetch("/api/barber/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, "").length > 0 ? phone.replace(/\D/g, "").slice(0, 15) : null,
          workStartTime,
          workEndTime,
          workWeekdays,
          ...(photoUrl ? { photoUrl } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      closeAddModal();
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStylist) return;
    setErr(null);
    if (!editName.trim()) {
      setErr("กรอกชื่อช่าง");
      return;
    }
    setSaving(true);
    try {
      let nextPhotoUrl: string | null | undefined;
      if (editPhotoFile) {
        try {
          nextPhotoUrl = await uploadStylistImage(editPhotoFile);
        } catch (ue) {
          setErr(ue instanceof Error ? ue.message : "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
      }
      const body: {
        name: string;
        phone: string | null;
        workStartTime: string;
        workEndTime: string;
        workWeekdays: number[];
        photoUrl?: string | null;
      } = {
        name: editName.trim(),
        phone: editPhone.replace(/\D/g, "").length > 0 ? editPhone.replace(/\D/g, "").slice(0, 15) : null,
        workStartTime: editWorkStartTime,
        workEndTime: editWorkEndTime,
        workWeekdays: editWorkWeekdays,
      };
      if (nextPhotoUrl !== undefined) body.photoUrl = nextPhotoUrl;

      const res = await fetch(`/api/barber/stylists/${editStylist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
      if (!res.ok) {
        setErr(
          [data.error, data.hint].filter(Boolean).join(" — ") || "อัปเดตไม่สำเร็จ",
        );
        return;
      }
      closeEditModal();
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function clearEditPhotoLocal() {
    setEditPhotoFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function removeEditPhotoOnServer() {
    if (!editStylist) return;
    setErr(null);
    const res = await fetch(`/api/barber/stylists/${editStylist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: null }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    if (!res.ok) {
      setErr([data.error, data.hint].filter(Boolean).join(" — ") || "ลบรูปไม่สำเร็จ");
      return;
    }
    await load();
    setEditStylist((prev) => (prev ? { ...prev, photoUrl: null } : null));
    router.refresh();
  }

  async function onRemoveEditPhotoClick() {
    if (editPhotoFile) {
      clearEditPhotoLocal();
      return;
    }
    await removeEditPhotoOnServer();
  }

  async function toggleActive(s: Stylist) {
    const res = await fetch(`/api/barber/stylists/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    if (!res.ok) {
      setErr([data.error, data.hint].filter(Boolean).join(" — ") || "อัปเดตไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  async function removeStylist(s: Stylist) {
    if (!confirm(`ลบช่าง "${s.name}" ?`)) return;
    const res = await fetch(`/api/barber/stylists/${s.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  function startRowUpload(id: number) {
    rowUploadStylistIdRef.current = id;
    rowUploadRef.current?.click();
  }

  async function onRowFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = rowUploadStylistIdRef.current;
    rowUploadStylistIdRef.current = null;
    if (!file) return;
    if (id == null) {
      setErr("ไม่พบช่างที่อัปโหลด — กดไอคอนอัปโหลดอีกครั้ง");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const imageUrl = await uploadStylistImage(file);
      const res = await fetch(`/api/barber/stylists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: imageUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
      if (!res.ok) {
        setErr([data.error, data.hint].filter(Boolean).join(" — ") || "บันทึกรูปไม่สำเร็จ");
        return;
      }
      await load();
      router.refresh();
    } catch (ue) {
      setErr(ue instanceof Error ? ue.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const editDisplayPhoto = editPhotoPreview ?? editStylist?.photoUrl ?? null;

  return (
    <div className={embedded ? "space-y-4 sm:space-y-5" : barberPageStackClass}>
      <input
        ref={rowUploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void onRowFileChange(e)}
      />

      {err && !addOpen && !editOpen ? (
        <p role="alert" className={barberInlineAlertErrorClass}>
          {err}
        </p>
      ) : null}

      <section className={barberSectionFirstClass} aria-label="รายชื่อช่าง">
        <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="shrink-0 text-base font-black leading-none tracking-tight text-[#1e1b4b] sm:text-lg">
            รายชื่อช่าง
          </h2>
          {showHubToolbar ? (
            <BarberDashboardHeaderTrailing className="w-full sm:w-auto">
              {!embedded ? <BarberDashboardBackLink /> : null}
              <button
                type="button"
                onClick={openAddModal}
                className={barberDashboardSegmentBtnClass(true)}
                aria-label="เพิ่มช่าง"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">เพิ่มช่าง</span>
              </button>
            </BarberDashboardHeaderTrailing>
          ) : (
            <div className={barberSectionActionsRowClass}>
              {!embedded ? <BarberDashboardBackLink /> : null}
              <button
                type="button"
                onClick={openAddModal}
                className={barberDashboardSegmentBtnClass(true)}
                aria-label="เพิ่มช่าง"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">เพิ่มช่าง</span>
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <p className={barberMutedLoadingNoticeClass}>กำลังโหลดรายการ…</p>
        ) : list.length === 0 ? (
          <div className={`${barberEmptyStateDashedClass} text-center`}>
            <p className="text-sm font-medium text-[#2e2a58]">ยังไม่มีช่าง</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#66638c]">
              กด &ldquo;เพิ่มช่าง&rdquo; เพื่อเพิ่มคนแรก — ใช้เลือกตอนเช็กอินและบันทึกการขายแพ็ก
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((s) => (
              <li
                key={s.id}
                className={cn(
                  barberListRowCardClass,
                  "flex flex-wrap items-center gap-x-3 gap-y-2.5 sm:flex-nowrap sm:gap-x-4 sm:py-2.5",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#e4e2f5] bg-gradient-to-br from-[#f4f3fb] to-[#ecebff] ring-1 ring-white">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-bold tabular-nums text-[#8b87ad]">
                        {s.name.trim().charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-[15px] font-semibold leading-snug text-[#2e2a58]">{s.name}</p>
                      {!s.isActive ? (
                        <span className="shrink-0 rounded-[1rem] bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-900">
                          ปิดใช้งาน
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs leading-normal text-[#7a7699]">
                      รับคิว {s.workStartTime || "09:00"}–{s.workEndTime || "20:00"}
                      <span className="mx-1.5 text-[#c4c0e0]" aria-hidden>
                        ·
                      </span>
                      {barberFormatWorkWeekdaysLabel(s.workWeekdays ?? [...BARBER_ALL_WEEKDAYS])}
                    </p>
                    {s.phone ? (
                      <p className="mt-0.5 truncate text-xs leading-normal text-[#7a7699] tabular-nums">{s.phone}</p>
                    ) : null}
                  </div>
                </div>

                <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:ml-0 sm:gap-2">
                  <div className={barberIconToolbarGroupClass} role="group" aria-label="รูปช่าง">
                    <AppIconToolbarButton
                      title="อัปโหลดรูป"
                      ariaLabel="อัปโหลดรูป"
                      disabled={saving}
                      onClick={() => startRowUpload(s.id)}
                    >
                      <AppIconUpload className="h-3.5 w-3.5" />
                    </AppIconToolbarButton>
                    <AppIconToolbarButton
                      title="ดูรูป"
                      ariaLabel="ดูรูป"
                      disabled={!s.photoUrl}
                      onClick={() => s.photoUrl && setPreviewUrl(s.photoUrl)}
                    >
                      <AppIconImage className="h-3.5 w-3.5" />
                    </AppIconToolbarButton>
                  </div>
                  <div className={barberIconToolbarGroupClass} role="group" aria-label="จัดการช่าง">
                    <AppIconToolbarButton title="แก้ไข" ariaLabel="แก้ไข" onClick={() => openEditModal(s)}>
                      <AppIconPencil className="h-3.5 w-3.5" />
                    </AppIconToolbarButton>
                    <AppIconToolbarButton
                      title={s.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                      ariaLabel={s.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                      onClick={() => void toggleActive(s)}
                      className={cn(s.isActive ? "text-emerald-700 hover:text-emerald-800" : "text-amber-700 hover:text-amber-800")}
                    >
                      <AppIconPower className="h-3.5 w-3.5" />
                    </AppIconToolbarButton>
                    <AppIconToolbarButton
                      title="ลบช่าง"
                      ariaLabel="ลบช่าง"
                      onClick={() => void removeStylist(s)}
                      className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                    >
                      <AppIconTrash className="h-3.5 w-3.5" />
                    </AppIconToolbarButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addOpen ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeAddModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-add-stylist-title"
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-add-stylist-title" className={barberModalTitleClass}>
                    เพิ่มช่าง
                  </h2>
                  <p className={barberModalSubtitleClass}>ชื่อบังคับ · เบอร์และรูปไม่บังคับ</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeAddModal()}
                  className={barberModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => void onCreate(e)} className="grid gap-3 px-5 py-5">
              {err ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อช่าง
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  placeholder="ชื่อ *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เบอร์โทร (ไม่บังคับ)
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  placeholder="0812345678"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เริ่มรับคิว (เวลาไทย)
                  <div className="mt-1">
                    <AppTime24Input
                      value={workStartTime}
                      onChange={setWorkStartTime}
                      aria-label="เวลาเริ่มรับคิว"
                    />
                  </div>
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เลิกรับคิว (เวลาไทย)
                  <div className="mt-1">
                    <AppTime24Input
                      value={workEndTime}
                      onChange={setWorkEndTime}
                      aria-label="เวลาเลิกรับคิว"
                    />
                  </div>
                </label>
              </div>
              <fieldset>
                <legend className="text-xs font-semibold text-[#4d47b6]">วันที่รับบริการ</legend>
                <p className="mt-1 text-[11px] leading-relaxed text-[#7a7699]">
                  เลือกวันในสัปดาห์ที่ช่างคนนี้รับคิว (เวลาไทย)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="วันที่รับบริการ">
                  {BARBER_WEEKDAY_LABELS_TH.map((label, day) => {
                    const on = workWeekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleWorkWeekday(day, "add")}
                        className={cn(
                          "min-h-9 min-w-9 rounded-xl px-2.5 text-xs font-semibold transition",
                          on
                            ? "bg-[#5b61ff] text-white ring-1 ring-[#5b61ff]/40"
                            : "bg-[#f6f5ff] text-[#8b87ad] ring-1 ring-[#ecebff]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <p className="text-xs font-semibold text-[#4d47b6]">รูป (ไม่บังคับ)</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    ref={addFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => setAddPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => addFileRef.current?.click()}
                    className={`inline-flex items-center gap-2 ${barberCardSurfaceRadiusClass} border border-[#ecebff] bg-[#f6f5ff] px-3 py-2 text-sm font-semibold text-[#4d47b6]`}
                  >
                    <AppIconUpload className="h-4 w-4" />
                    เลือกรูป
                  </button>
                  {addPhotoFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAddPhotoFile(null);
                        if (addFileRef.current) addFileRef.current.value = "";
                      }}
                      className="text-sm font-medium text-red-700 hover:underline"
                    >
                      ล้างรูป
                    </button>
                  ) : null}
                </div>
                {addPhotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={addPhotoPreview}
                    alt=""
                    className={`mt-3 max-h-40 ${barberCardSurfaceRadiusClass} border border-[#ecebff] object-contain`}
                  />
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeAddModal()}
                  className={`app-btn-soft min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-60`}
                >
                  {saving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </BarberModalPortal>
      ) : null}

      {editOpen && editStylist ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeEditModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-edit-stylist-title"
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-edit-stylist-title" className={barberModalTitleClass}>
                    แก้ไขช่าง
                  </h2>
                  <p className={barberModalSubtitleClass}>{editStylist.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className={barberModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => void onSaveEdit(e)} className="grid gap-3 px-5 py-5">
              {err ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อช่าง
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เบอร์โทร (ไม่บังคับ)
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  inputMode="numeric"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เริ่มรับคิว (เวลาไทย)
                  <div className="mt-1">
                    <AppTime24Input
                      value={editWorkStartTime}
                      onChange={setEditWorkStartTime}
                      aria-label="เวลาเริ่มรับคิว"
                    />
                  </div>
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เลิกรับคิว (เวลาไทย)
                  <div className="mt-1">
                    <AppTime24Input
                      value={editWorkEndTime}
                      onChange={setEditWorkEndTime}
                      aria-label="เวลาเลิกรับคิว"
                    />
                  </div>
                </label>
              </div>
              <fieldset>
                <legend className="text-xs font-semibold text-[#4d47b6]">วันที่รับบริการ</legend>
                <p className="mt-1 text-[11px] leading-relaxed text-[#7a7699]">
                  เลือกวันในสัปดาห์ที่ช่างคนนี้รับคิว (เวลาไทย)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="วันที่รับบริการ">
                  {BARBER_WEEKDAY_LABELS_TH.map((label, day) => {
                    const on = editWorkWeekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleWorkWeekday(day, "edit")}
                        className={cn(
                          "min-h-9 min-w-9 rounded-xl px-2.5 text-xs font-semibold transition",
                          on
                            ? "bg-[#5b61ff] text-white ring-1 ring-[#5b61ff]/40"
                            : "bg-[#f6f5ff] text-[#8b87ad] ring-1 ring-[#ecebff]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <p className="text-xs font-semibold text-[#4d47b6]">รูป</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => editFileRef.current?.click()}
                    className={`inline-flex items-center gap-2 ${barberCardSurfaceRadiusClass} border border-[#ecebff] bg-[#f6f5ff] px-3 py-2 text-sm font-semibold text-[#4d47b6]`}
                  >
                    <AppIconUpload className="h-4 w-4" />
                    เปลี่ยนรูป
                  </button>
                  {editStylist.photoUrl || editPhotoFile ? (
                    <button
                      type="button"
                      onClick={() => void onRemoveEditPhotoClick()}
                      className="text-sm font-medium text-red-700 hover:underline"
                    >
                      {editPhotoFile ? "ยกเลิกรูปที่เลือก" : "ลบรูป"}
                    </button>
                  ) : null}
                </div>
                {editDisplayPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editDisplayPhoto}
                    alt=""
                    className={`mt-3 max-h-40 ${barberCardSurfaceRadiusClass} border border-[#ecebff] object-contain`}
                  />
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className={`app-btn-soft min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-60`}
                >
                  {saving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </BarberModalPortal>
      ) : null}

      {previewUrl ? (
        <BarberModalPortal>
          <div
            className={barberModalBackdropImagePreviewClass}
            role="presentation"
            onClick={() => setPreviewUrl(null)}
          >
          <button
            type="button"
            className={barberModalImagePreviewCloseBtnClass}
            onClick={() => setPreviewUrl(null)}
            aria-label="ปิด"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="max-h-[min(88vh,720px)] max-w-full rounded-[1.25rem] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          </div>
        </BarberModalPortal>
      ) : null}
    </div>
  );
}
