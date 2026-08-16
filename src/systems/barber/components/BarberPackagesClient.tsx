"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AppGalleryCameraFileInputs,
  AppIconImage,
  AppIconPencil,
  AppIconToolbarButton,
  AppIconTrash,
  AppIconUpload,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppSectionHeader,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import {
  barberCardSurfaceRadiusClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberMutedLoadingNoticeClass,
  barberOffersEmptyStateClass,
  barberOffersListRowCardClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BARBER_DURATION_PRESETS } from "@/systems/barber/lib/booking-slots";

type Pkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
  imageUrl: string | null;
  durationMinutes: number;
};

export type BarberPackagesEmbeddedToolbarApi = {
  openAddModal: () => void;
};

type BarberPackagesClientProps = {
  embedded?: boolean;
  /** เมื่อ embedded — ส่งปุ่ม «เพิ่มแพ็กเกจ» ไปแถบหัว Hub */
  onEmbeddedToolbar?: (api: BarberPackagesEmbeddedToolbarApi | null) => void;
};

const PACKAGE_CARD_THEMES = [
  {
    shell: "border-violet-200/70 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40",
    accent: "from-violet-500 via-indigo-500 to-fuchsia-500",
    glow: "bg-violet-300/35",
    placeholder: "from-violet-200 via-indigo-100 to-fuchsia-200",
  },
  {
    shell: "border-teal-200/70 bg-gradient-to-br from-white via-emerald-50/45 to-cyan-50/40",
    accent: "from-teal-500 via-emerald-500 to-cyan-500",
    glow: "bg-teal-300/35",
    placeholder: "from-teal-200 via-emerald-100 to-cyan-200",
  },
  {
    shell: "border-amber-200/70 bg-gradient-to-br from-white via-amber-50/45 to-orange-50/40",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    glow: "bg-amber-300/35",
    placeholder: "from-amber-200 via-orange-100 to-rose-200",
  },
  {
    shell: "border-sky-200/70 bg-gradient-to-br from-white via-sky-50/45 to-indigo-50/40",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    glow: "bg-sky-300/35",
    placeholder: "from-sky-200 via-blue-100 to-indigo-200",
  },
] as const;

async function uploadPackageImage(file: File): Promise<string> {
  const prepared = await prepareImageFileForUpload(file);
  const fd = new FormData();
  fd.append("file", prepared);
  const res = await fetch("/api/barber/packages/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
  const url = data.imageUrl?.trim();
  if (!url) throw new Error("อัปโหลดไม่สำเร็จ");
  return url;
}

export function BarberPackagesClient({
  embedded = false,
  onEmbeddedToolbar,
}: BarberPackagesClientProps = {}) {
  const router = useRouter();
  const formId = useId();
  const galleryRef = useRef<HTMLInputElement>(null);
  const addGalleryRef = useRef<HTMLInputElement>(null);
  const rowUploadTargetIdRef = useRef<number | null>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปแพ็กเกจ" });
  const {
    openCamera: openAddCamera,
    cameraInputRef: addCameraInputRef,
    cameraModal: addCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปแพ็กเกจใหม่" });
  const lb = useAppImageLightbox();

  const [list, setList] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<Pkg | null>(null);
  const [imageBusyId, setImageBusyId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("10");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [addImageBusy, setAddImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSessions, setEditSessions] = useState("10");
  const [editDurationMinutes, setEditDurationMinutes] = useState(30);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editImageBusy, setEditImageBusy] = useState(false);
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openEditCamera,
    cameraInputRef: editCameraInputRef,
    cameraModal: editCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปแพ็กเกจ" });

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/packages");
    const data = (await res.json().catch(() => ({}))) as { packages?: Pkg[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setList([]);
      return;
    }
    setList(
      (data.packages ?? []).map((p) => ({
        ...p,
        imageUrl: p.imageUrl ?? null,
        durationMinutes: p.durationMinutes ?? 30,
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

  const closeAddModal = useCallback(() => {
    setAddOpen(false);
    setErr(null);
    setAddImageUrl(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditPkg(null);
    setEditName("");
    setEditPrice("");
    setEditSessions("10");
    setEditDurationMinutes(30);
    setEditImageUrl(null);
    setErr(null);
  }, []);

  useEffect(() => {
    if (!addOpen && !editOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editOpen) closeEditModal();
        else closeAddModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [addOpen, editOpen, closeAddModal, closeEditModal]);

  const openAddModal = useCallback(() => {
    setErr(null);
    setName("");
    setPrice("");
    setSessions("10");
    setDurationMinutes(30);
    setAddImageUrl(null);
    setAddOpen(true);
  }, []);

  function openEditModal(p: Pkg) {
    setErr(null);
    setEditPkg(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditSessions(String(p.totalSessions));
    setEditDurationMinutes(p.durationMinutes || 30);
    setEditImageUrl(p.imageUrl);
    setEditOpen(true);
  }

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({ openAddModal });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, openAddModal]);

  async function applyPackageImage(id: number, file: File) {
    setImageBusyId(id);
    setErr(null);
    try {
      const imageUrl = await uploadPackageImage(file);
      const res = await fetch(`/api/barber/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; package?: Pkg };
      if (!res.ok) throw new Error(data.error ?? "บันทึกรูปไม่สำเร็จ");
      setList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, imageUrl: data.package?.imageUrl ?? imageUrl } : p)),
      );
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setImageBusyId(null);
    }
  }

  async function clearPackageImage(id: number) {
    if (!confirm("ลบรูปแพ็กเกจนี้?")) return;
    setImageBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/barber/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: null }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบรูปไม่สำเร็จ");
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: null } : p)));
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบรูปไม่สำเร็จ");
    } finally {
      setImageBusyId(null);
    }
  }

  async function onAddImageFile(file: File) {
    setAddImageBusy(true);
    setErr(null);
    try {
      const imageUrl = await uploadPackageImage(file);
      setAddImageUrl(imageUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setAddImageBusy(false);
    }
  }

  async function onEditImageFile(file: File) {
    setEditImageBusy(true);
    setErr(null);
    try {
      const imageUrl = await uploadPackageImage(file);
      setEditImageUrl(imageUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setEditImageBusy(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const p = Number(price);
    const s = Number(sessions);
    if (!name.trim() || !Number.isFinite(p) || p < 0 || !Number.isInteger(s) || s < 1) {
      setErr("กรอกชื่อ ราคา และจำนวนครั้งให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/barber/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: p,
          totalSessions: s,
          durationMinutes,
          ...(addImageUrl ? { imageUrl: addImageUrl } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setName("");
      setPrice("");
      setSessions("10");
      setDurationMinutes(30);
      setAddImageUrl(null);
      setAddOpen(false);
      setErr(null);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPkg) return;
    setErr(null);
    const p = Number(editPrice);
    const s = Number(editSessions);
    if (!editName.trim() || !Number.isFinite(p) || p < 0 || !Number.isInteger(s) || s < 1) {
      setErr("กรอกชื่อ ราคา และจำนวนครั้งให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      const body: {
        name: string;
        price: number;
        durationMinutes: number;
        imageUrl: string | null;
        totalSessions?: number;
      } = {
        name: editName.trim(),
        price: p,
        durationMinutes: editDurationMinutes,
        imageUrl: editImageUrl,
      };
      // ส่งจำนวนครั้งเฉพาะเมื่อเปลี่ยน — API บล็อกถ้ามีสมาชิกแพ็กแล้ว
      if (s !== editPkg.totalSessions) body.totalSessions = s;

      const res = await fetch(`/api/barber/packages/${editPkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; package?: Pkg };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      closeEditModal();
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function patchDuration(id: number, next: number) {
    setErr(null);
    const res = await fetch(`/api/barber/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: next }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; package?: Pkg };
    if (!res.ok) {
      setErr(data.error ?? "บันทึกระยะเวลาไม่สำเร็จ");
      return;
    }
    setList((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, durationMinutes: data.package?.durationMinutes ?? next }
          : p,
      ),
    );
  }

  async function remove(id: number) {
    if (!confirm("ลบแพ็กเกจนี้?")) return;
    setErr(null);
    const res = await fetch(`/api/barber/packages/${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  return (
    <div className={embedded ? "min-w-0" : barberPageStackClass}>
      {err && !addOpen && !editOpen ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}

      <section className={embedded ? "min-w-0" : barberSectionFirstClass} aria-label="แพ็กเกจทั้งหมด">
        {!embedded ? (
          <AppSectionHeader
            tone="violet"
            title="แพ็กเกจทั้งหมด"
            action={
              <div className={barberSectionActionsRowClass}>
                <BarberDashboardBackLink />
                <button
                  type="button"
                  onClick={openAddModal}
                  className={`app-btn-primary min-h-[44px] ${barberCardSurfaceRadiusClass} px-4 py-2.5 text-sm font-semibold`}
                >
                  เพิ่มแพ็กเกจ
                </button>
              </div>
            }
          />
        ) : null}
        {loading ? (
          <p className={barberMutedLoadingNoticeClass}>กำลังโหลดรายการ…</p>
        ) : list.length === 0 ? (
          <div className={`${barberOffersEmptyStateClass} text-center`}>
            <p className="text-sm font-semibold text-[#2e2a58]">ยังไม่มีแพ็กเกจ</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#66638c]">
              เพิ่มแพ็กเกจเพื่อให้ขายจากหน้าเช็กอิน — แนบรูปได้ตอนสร้างหรือจากการ์ด
            </p>
          </div>
        ) : (
          <ul
            className={
              embedded
                ? "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
                : "grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            }
          >
            {list.map((p, index) => {
              const theme = PACKAGE_CARD_THEMES[index % PACKAGE_CARD_THEMES.length]!;
              const busy = imageBusyId === p.id;
              return (
                <li
                  key={p.id}
                  className={cn(
                    barberOffersListRowCardClass,
                    "group/item relative overflow-hidden !px-3 py-2.5",
                    theme.shell,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b opacity-90",
                      theme.accent,
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-70",
                      theme.glow,
                    )}
                  />

                  <div className="relative flex min-w-0 gap-2.5 pl-2">
                    <button
                      type="button"
                      className={cn(
                        "h-14 w-14 shrink-0 self-start overflow-hidden rounded-[1rem] ring-2 ring-white/90 shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
                        !p.imageUrl && "bg-gradient-to-br",
                        !p.imageUrl && theme.placeholder,
                      )}
                      aria-label={p.imageUrl ? `ดูรูป ${p.name}` : `ยังไม่มีรูป ${p.name}`}
                      disabled={!p.imageUrl}
                      onClick={() => {
                        if (p.imageUrl) lb.open(p.imageUrl);
                      }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-black text-[#4d47b6]/70">
                          {p.name.trim().charAt(0) || "P"}
                        </span>
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="min-w-0 pr-1">
                        <p className="break-words text-sm font-black leading-snug tracking-tight text-[#1e1b4b]">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
                          {p.totalSessions === 1 ? "บริการรายครั้ง" : "แพ็กเกจหลายครั้ง"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <p className="shrink-0 text-sm font-black tabular-nums text-[#1e1b4b]">
                          <span className="mr-0.5 text-[10px] font-bold text-[#8b87ad]">฿</span>
                          {p.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-[#4d47b6] ring-1 ring-[#e8e6f4]/90">
                            {p.totalSessions} ครั้ง
                          </span>
                          <label className="inline-flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-[#4d47b6] ring-1 ring-[#e8e6f4]/90">
                            <span className="sr-only">ระยะเวลา {p.name}</span>
                            <select
                              className="max-w-[4.5rem] bg-transparent text-[11px] font-bold outline-none"
                              value={p.durationMinutes}
                              aria-label={`ระยะเวลา ${p.name}`}
                              onChange={(e) => void patchDuration(p.id, Number(e.target.value))}
                            >
                              {BARBER_DURATION_PRESETS.map((m) => (
                                <option key={m} value={m}>
                                  {m} นาที
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-2 pt-0.5">
                        <div className="min-w-0">
                          {busy ? (
                            <p className="text-[10px] font-bold text-[#5b61ff]" aria-live="polite">
                              กำลังอัปโหลดรูป…
                            </p>
                          ) : p.imageUrl ? (
                            <button
                              type="button"
                              className="text-left text-[10px] font-bold text-rose-600/90 hover:underline"
                              disabled={busy}
                              onClick={() => void clearPackageImage(p.id)}
                            >
                              ลบรูป
                            </button>
                          ) : (
                            <p className="text-[10px] font-semibold text-[#8b87ad]">
                              ยังไม่มีรูป — อัปโหลดหรือถ่ายได้
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(barberIconToolbarGroupClass, "ml-auto shrink-0")}
                          role="group"
                          aria-label={`จัดการ ${p.name}`}
                        >
                          <AppIconToolbarButton
                            title="อัปโหลดรูป"
                            ariaLabel={`อัปโหลดรูป ${p.name}`}
                            disabled={busy}
                            onClick={() => {
                              rowUploadTargetIdRef.current = p.id;
                              galleryRef.current?.click();
                            }}
                          >
                            <AppIconUpload className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ถ่ายรูป"
                            ariaLabel={`ถ่ายรูป ${p.name}`}
                            disabled={busy}
                            onClick={() => openCamera((file) => void applyPackageImage(p.id, file))}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ดูรูป"
                            ariaLabel={`ดูรูป ${p.name}`}
                            disabled={!p.imageUrl || busy}
                            onClick={() => p.imageUrl && lb.open(p.imageUrl)}
                          >
                            <AppIconImage className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="แก้ไขแพ็กเกจ"
                            ariaLabel={`แก้ไขแพ็กเกจ ${p.name}`}
                            disabled={busy}
                            onClick={() => openEditModal(p)}
                          >
                            <AppIconPencil className="h-3.5 w-3.5" aria-hidden />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ลบแพ็กเกจ"
                            ariaLabel={`ลบแพ็กเกจ ${p.name}`}
                            onClick={() => void remove(p.id)}
                            className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                          >
                            <AppIconTrash className="h-3.5 w-3.5" aria-hidden />
                          </AppIconToolbarButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AppGalleryCameraFileInputs
        galleryInputRef={galleryRef}
        cameraInputRef={cameraInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          const id = rowUploadTargetIdRef.current;
          rowUploadTargetIdRef.current = null;
          if (file && id != null) void applyPackageImage(id, file);
        }}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปแพ็กเกจ" />
      {cameraModal}

      {addOpen ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeAddModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${formId}-title`}
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id={`${formId}-title`} className={barberModalTitleClass}>
                    รายละเอียดแพ็กเกจ
                  </h2>
                  <p className={barberModalSubtitleClass}>เช่น ตัด 10 ครั้ง 1,200 บาท — แนบรูปได้</p>
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
              <form onSubmit={onCreate} className="grid gap-3 px-5 py-5">
                {err ? (
                  <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">
                    {err}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#4d47b6]">รูปแพ็กเกจ</p>
                  <AppGalleryCameraFileInputs
                    galleryInputRef={addGalleryRef}
                    cameraInputRef={addCameraInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void onAddImageFile(file);
                    }}
                  />
                  <AppImagePickCameraButtons
                    disabled={saving}
                    busy={addImageBusy}
                    onPickGallery={() => addGalleryRef.current?.click()}
                    onPickCamera={() => openAddCamera((file) => void onAddImageFile(file))}
                    labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                    className="justify-start"
                  />
                  {addImageUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={addImageUrl}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover ring-2 ring-white shadow-md"
                      />
                      <button
                        type="button"
                        disabled={saving || addImageBusy}
                        className="rounded-xl px-2 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        onClick={() => setAddImageUrl(null)}
                      >
                        ลบรูป
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-[#66638c]">ไม่บังคับ — เพิ่มทีหลังจากการ์ดก็ได้</p>
                  )}
                </div>

                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ชื่อแพ็กเกจ
                  <input
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ตัดผม 10 ครั้ง"
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ราคา (บาท)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  จำนวนครั้ง
                  <input
                    type="number"
                    min={1}
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={sessions}
                    onChange={(e) => setSessions(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ระยะเวลาต่อครั้ง (นาที)
                  <select
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  >
                    {BARBER_DURATION_PRESETS.map((m) => (
                      <option key={m} value={m}>
                        {m} นาที
                      </option>
                    ))}
                  </select>
                </label>
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
                    disabled={saving || addImageBusy}
                    className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-60`}
                  >
                    {saving ? "กำลังบันทึก…" : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {addCameraModal}
        </BarberModalPortal>
      ) : null}

      {editOpen && editPkg ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeEditModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${formId}-edit-title`}
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id={`${formId}-edit-title`} className={barberModalTitleClass}>
                    แก้ไขแพ็กเกจ
                  </h2>
                  <p className={barberModalSubtitleClass}>{editPkg.name}</p>
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
              <form onSubmit={onSaveEdit} className="grid gap-3 px-5 py-5">
                {err ? (
                  <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">
                    {err}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#4d47b6]">รูปแพ็กเกจ</p>
                  <AppGalleryCameraFileInputs
                    galleryInputRef={editGalleryRef}
                    cameraInputRef={editCameraInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void onEditImageFile(file);
                    }}
                  />
                  <AppImagePickCameraButtons
                    disabled={saving}
                    busy={editImageBusy}
                    onPickGallery={() => editGalleryRef.current?.click()}
                    onPickCamera={() => openEditCamera((file) => void onEditImageFile(file))}
                    labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                    className="justify-start"
                  />
                  {editImageUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editImageUrl}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover ring-2 ring-white shadow-md"
                      />
                      <button
                        type="button"
                        disabled={saving || editImageBusy}
                        className="rounded-xl px-2 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        onClick={() => setEditImageUrl(null)}
                      >
                        ลบรูป
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-[#66638c]">ยังไม่มีรูป</p>
                  )}
                </div>

                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ชื่อแพ็กเกจ
                  <input
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="ตัดผม 10 ครั้ง"
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ราคา (บาท)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  จำนวนครั้ง
                  <input
                    type="number"
                    min={1}
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={editSessions}
                    onChange={(e) => setEditSessions(e.target.value)}
                    required
                  />
                  <span className="mt-1 block text-[10px] font-medium text-[#8b87ad]">
                    เปลี่ยนไม่ได้ถ้ามีสมาชิกแพ็กเกจนี้แล้ว
                  </span>
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ระยะเวลาต่อครั้ง (นาที)
                  <select
                    className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                    value={editDurationMinutes}
                    onChange={(e) => setEditDurationMinutes(Number(e.target.value))}
                  >
                    {BARBER_DURATION_PRESETS.map((m) => (
                      <option key={m} value={m}>
                        {m} นาที
                      </option>
                    ))}
                  </select>
                </label>
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
                    disabled={saving || editImageBusy}
                    className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-60`}
                  >
                    {saving ? "กำลังบันทึก…" : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {editCameraModal}
        </BarberModalPortal>
      ) : null}
    </div>
  );
}
