"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AppIconToolbarButton,
  AppIconTrash,
  AppSectionHeader,
} from "@/components/app-templates";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import {
  barberCardSurfaceRadiusClass,
  barberOffersEmptyStateClass,
  barberOffersListRowCardClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberMutedLoadingNoticeClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
} from "@/systems/barber/components/barber-ui-tokens";

type Pkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
};

export type BarberPackagesEmbeddedToolbarApi = {
  openAddModal: () => void;
};

type BarberPackagesClientProps = {
  embedded?: boolean;
  /** เมื่อ embedded — ส่งปุ่ม «เพิ่มแพ็กเกจ» ไปแถบหัว Hub */
  onEmbeddedToolbar?: (api: BarberPackagesEmbeddedToolbarApi | null) => void;
};

export function BarberPackagesClient({
  embedded = false,
  onEmbeddedToolbar,
}: BarberPackagesClientProps = {}) {
  const router = useRouter();
  const [list, setList] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/packages");
    const data = (await res.json().catch(() => ({}))) as { packages?: Pkg[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setList([]);
      return;
    }
    setList(data.packages ?? []);
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
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [addOpen, closeAddModal]);

  const openAddModal = useCallback(() => {
    setErr(null);
    setName("");
    setPrice("");
    setSessions("10");
    setAddOpen(true);
  }, []);

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({ openAddModal });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, openAddModal]);

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
        body: JSON.stringify({ name: name.trim(), price: p, totalSessions: s }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setName("");
      setPrice("");
      setSessions("10");
      setAddOpen(false);
      setErr(null);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
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
    <div className={embedded ? "space-y-4 sm:space-y-5" : barberPageStackClass}>
      {err && !addOpen ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}

      <section className={barberSectionFirstClass} aria-label="แพ็กเกจทั้งหมด">
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
              เพิ่มแพ็กเกจเพื่อให้ขายจากหน้าเช็กอิน
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((p) => (
              <li
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-3 ${barberOffersListRowCardClass}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-[#2e2a58]">{p.name}</p>
                  <p className="mt-1 text-xs tabular-nums text-[#5f5a8a]">
                    <span className="font-semibold text-[#5b61ff]">
                      {p.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                    </span>{" "}
                    บาท ·{" "}
                    <span className="font-semibold text-[#0d9488]/90">{p.totalSessions}</span> ครั้ง
                  </p>
                </div>
                <div className={barberIconToolbarGroupClass} role="group" aria-label="ลบแพ็กเกจ">
                  <AppIconToolbarButton
                    title="ลบแพ็กเกจ"
                    ariaLabel="ลบแพ็กเกจ"
                    onClick={() => remove(p.id)}
                    className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                  >
                    <AppIconTrash className="h-3.5 w-3.5" />
                  </AppIconToolbarButton>
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
              aria-labelledby="barber-add-package-title"
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-add-package-title" className={barberModalTitleClass}>
                    รายละเอียดแพ็กเกจ
                  </h2>
                  <p className={barberModalSubtitleClass}>เช่น ตัด 10 ครั้ง 1,200 บาท</p>
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
              {err ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p> : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อแพ็กเกจ
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
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
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
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
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                  required
                />
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
    </div>
  );
}
