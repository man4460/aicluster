"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import { cn } from "@/lib/cn";
import { BarberSellPackageModal } from "@/systems/barber/components/BarberSellPackageModal";
import {
  barberCardBodyPaddingXClass,
  barberCardSurfaceRadiusClass,
  barberModalBackdropClass,
  barberModalCameraBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalPanelMdClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionFirstClass,
  barberSectionNextClass,
} from "@/systems/barber/components/barber-ui-tokens";

type SubRow = {
  id: number;
  remainingSessions: number;
  status: string;
  packageName: string;
  packageId: number;
};

type Pkg = { id: number; name: string; price: number; totalSessions: number };

type StylistBrief = { id: number; name: string };

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconImageUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconCoins({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <circle cx="16" cy="16" r="6" />
      <path d="M11.5 13.5 16 9" strokeLinecap="round" />
    </svg>
  );
}

function IconPackageSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.5 4.21 9 5.19M7.5 19.79V14.6L3 12M21 12l-4.5 2.6v5.19M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarberCheckInClient({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deducting, setDeducting] = useState(false);

  const [cashPhone, setCashPhone] = useState("");
  const [cashName, setCashName] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashLoading, setCashLoading] = useState(false);

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [stylistId, setStylistId] = useState("");
  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [cashFormErr, setCashFormErr] = useState<string | null>(null);
  const [cashReceipt, setCashReceipt] = useState<{ file: File; url: string } | null>(null);
  const [cashCameraOpen, setCashCameraOpen] = useState(false);
  const [cashCameraErr, setCashCameraErr] = useState<string | null>(null);
  const cashVideoRef = useRef<HTMLVideoElement>(null);

  const stylistPickSummary = useMemo(() => {
    if (stylists.length === 0) return "ยังไม่มีช่าง · ตั้งที่เมนูช่าง";
    if (!stylistId) return "ไม่ระบุช่าง";
    const s = stylists.find((x) => String(x.id) === stylistId);
    return s?.name ?? "ไม่ระบุช่าง";
  }, [stylists, stylistId]);

  const clearCashReceipt = useCallback(() => {
    setCashReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const onCashReceiptSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setCashFormErr("เลือกรูปภาพเท่านั้น");
      return;
    }
    setCashFormErr(null);
    setCashReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file: f, url: URL.createObjectURL(f) };
    });
  }, []);

  const closeCashCamera = useCallback(() => {
    setCashCameraOpen(false);
    setCashCameraErr(null);
  }, []);

  useEffect(() => {
    if (!cashCameraOpen) return;
    const video = cashVideoRef.current;
    let stream: MediaStream | null = null;
    let cancelled = false;

    const stop = () => {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      if (video) video.srcObject = null;
    };

    (async () => {
      setCashCameraErr(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch {
          if (!cancelled) {
            setCashCameraErr("เปิดกล้องไม่ได้ — อนุญาตกล้องในเบราว์เซอร์ และใช้ HTTPS หรือ localhost");
            setCashCameraOpen(false);
          }
          return;
        }
      }
      if (cancelled) {
        stop();
        return;
      }
      const attach = () => {
        const v = cashVideoRef.current;
        if (v && stream) {
          v.srcObject = stream;
          void v.play().catch(() => {});
          return true;
        }
        return false;
      };
      if (!attach()) {
        requestAnimationFrame(() => {
          if (!cancelled && stream) attach();
        });
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [cashCameraOpen]);

  const captureFromCashCamera = useCallback(() => {
    const video = cashVideoRef.current;
    if (!video || video.readyState < 2) {
      setCashCameraErr("รอกล้องพร้อมสักครู่แล้วลองอีกครั้ง");
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setCashCameraErr("ยังไม่มีภาพจากกล้อง");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCashCameraErr("บันทึกภาพไม่สำเร็จ");
          return;
        }
        const file = new File([blob], `slip-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCashReceipt((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return { file, url: URL.createObjectURL(blob) };
        });
        setCashFormErr(null);
        setCashCameraErr(null);
        setCashCameraOpen(false);
      },
      "image/jpeg",
      0.88,
    );
  }, []);

  const openCashCamera = useCallback(() => {
    setCashFormErr(null);
    setCashCameraErr(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCashFormErr("เบราว์เซอร์ไม่รองรับการเปิดกล้อง — ใช้ปุ่มอัปโหลดรูปแทน");
      return;
    }
    setCashCameraOpen(true);
  }, []);

  const searchByPhone = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    setErr(null);
    setMsg(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/barber/customers/search?phone=${encodeURIComponent(digits)}`);
      const data = (await res.json().catch(() => ({}))) as {
        customer?: { name: string | null } | null;
        subscriptions?: SubRow[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "ค้นหาไม่สำเร็จ");
        setSubs([]);
        setCustomerName(null);
        setSelectedSubId(null);
        return;
      }
      setCustomerName(data.customer?.name ?? null);
      setSubs(data.subscriptions ?? []);
      setSelectedSubId(data.subscriptions?.[0]?.id ?? null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/barber/packages")
      .then((r) => r.json())
      .then((d: { packages?: Pkg[] }) => setPackages(d.packages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    void fetch("/api/barber/stylists")
      .then((r) => r.json())
      .then((d: { stylists?: StylistBrief[] }) => setStylists(d.stylists ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cashModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cashCameraOpen) {
          closeCashCamera();
          return;
        }
        if (cashModalOpen) clearCashReceipt();
        setCashModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cashModalOpen, cashCameraOpen, clearCashReceipt, closeCashCamera]);

  useEffect(() => {
    if (!stylistModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStylistModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [stylistModalOpen]);

  async function onDeduct() {
    if (!selectedSubId) {
      setErr("เลือกแพ็กเกจที่จะหักครั้ง");
      return;
    }
    setErr(null);
    setMsg(null);
    setDeducting(true);
    try {
      const sid = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSubId,
          ...(sid != null && Number.isInteger(sid) && sid > 0 ? { stylistId: sid } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        remainingSessions?: number;
        status?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg(`หัก 1 ครั้งแล้ว — เหลือ ${data.remainingSessions} ครั้ง`);
      setSubs((prev) =>
        prev.map((s) =>
          s.id === selectedSubId
            ? { ...s, remainingSessions: data.remainingSessions ?? 0, status: data.status ?? s.status }
            : s,
        ),
      );
      router.refresh();
    } finally {
      setDeducting(false);
    }
  }

  async function onCash(e: React.FormEvent) {
    e.preventDefault();
    setCashFormErr(null);
    setMsg(null);
    const digits = cashPhone.replace(/\D/g, "");
    if (digits.length < 9) {
      setCashFormErr("กรอกเบอร์ลูกค้าเงินสดอย่างน้อย 9 หลัก");
      return;
    }
    const rawAmt = cashAmount.trim().replace(/,/g, "");
    let amountBaht: number | null = null;
    if (rawAmt.length > 0) {
      const n = Number(rawAmt);
      if (!Number.isFinite(n) || n < 0 || n > 999_999.99) {
        setCashFormErr("ยอดเงินไม่ถูกต้อง (0–999,999.99 บาท)");
        return;
      }
      amountBaht = Math.round(n * 100) / 100;
    }
    setCashLoading(true);
    try {
      let receiptImageUrl: string | null = null;
      if (cashReceipt?.file) {
        const fd = new FormData();
        fd.append("file", cashReceipt.file);
        const up = await fetch("/api/barber/cash-receipt/upload", { method: "POST", body: fd });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setCashFormErr(upData.error ?? "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setCashFormErr("อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        receiptImageUrl = upData.imageUrl;
      }

      const sidCash = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitType: "CASH_WALK_IN",
          phone: digits,
          name: cashName.trim() || null,
          note: cashNote.trim() || null,
          ...(amountBaht != null ? { amountBaht } : {}),
          ...(receiptImageUrl ? { receiptImageUrl } : {}),
          ...(sidCash != null && Number.isInteger(sidCash) && sidCash > 0 ? { stylistId: sidCash } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCashFormErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกลูกค้าเงินสดแล้ว");
      setCashPhone("");
      setCashName("");
      setCashNote("");
      setCashAmount("");
      clearCashReceipt();
      setCashModalOpen(false);
      router.refresh();
    } finally {
      setCashLoading(false);
    }
  }

  return (
    <div className={embedded ? "space-y-4 sm:space-y-5" : barberPageStackClass}>
      <section className={barberSectionFirstClass} aria-label="ช่างที่บันทึก">
        <button
          type="button"
          onClick={() => setStylistModalOpen(true)}
          className={cn(
            "flex w-full min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-[#e4e2f5] bg-white/90 px-4 py-3 text-left shadow-sm outline-none ring-[#4d47b6]/20 transition hover:border-[#4d47b6]/35 hover:bg-white active:scale-[0.99] focus-visible:ring-2",
            stylists.length === 0 && "border-amber-200/90 bg-amber-50/40",
          )}
          aria-expanded={stylistModalOpen}
          aria-haspopup="dialog"
          aria-controls="barber-stylist-modal"
          suppressHydrationWarning
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4d47b6] text-sm font-black text-white shadow-md shadow-[#4d47b6]/25">
              ช
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b87ad]">
                ช่างที่บันทึก
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-[#2e2a58]">{stylistPickSummary}</span>
              {stylists.length > 0 ? (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#66638c]">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
                  {`มีช่าง ${stylists.length} คน · แตะเพื่อเลือก`}
                </span>
              ) : null}
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 shrink-0 text-[#8b87ad]"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <section className={barberSectionNextClass} aria-label="ค้นหาลูกค้า">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/85 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/45 p-4 shadow-[0_16px_40px_-24px_rgba(6,95,70,0.35)] sm:p-5">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-emerald-400/15"
            aria-hidden
          />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-teal-100/40" aria-hidden />
          <div className="relative">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-emerald-950">ค้นหาลูกค้า</h2>
                <p className="mt-1 max-w-md text-[13px] leading-snug text-emerald-900/70">
                  กรอกเบอร์ 9 หลักขึ้นไป แล้วเลือกแพ็กเพื่อหัก 1 ครั้ง
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-full border border-emerald-200/80 bg-white/80 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-sm sm:inline-flex sm:items-center sm:gap-1.5"
                aria-hidden
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                หลักทำงาน
              </span>
            </div>

            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
              onSubmit={(e) => {
                e.preventDefault();
                void searchByPhone(phone);
              }}
            >
              <div className="relative min-w-0 flex-1">
                {phone.length === 0 ? (
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600/75">
                    <IconSearch className="h-5 w-5" aria-hidden />
                  </span>
                ) : null}
                <input
                  className={cn(
                    "app-input min-h-[52px] w-full rounded-xl border-emerald-200/90 bg-white/95 py-3 pr-3 text-base font-medium text-[#1e293b] shadow-inner shadow-emerald-950/5 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400/25",
                    phone.length === 0 ? "pl-12" : "pl-3.5",
                  )}
                  inputMode="numeric"
                  placeholder="เบอร์โทรลูกค้า"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  aria-label="เบอร์โทรลูกค้า"
                  suppressHydrationWarning
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                suppressHydrationWarning
                className="app-btn-primary inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/15 disabled:opacity-60 sm:min-w-[7.5rem]"
              >
                <IconSearch className="h-4 w-4 opacity-90 sm:hidden" />
                {searching ? "กำลังค้นหา…" : "ค้นหา"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {(customerName !== null || subs.length > 0 || msg) && (
        <section className={barberSectionNextClass} aria-label="ผลค้นหา">
          <div className="rounded-2xl border border-[#e0dcf5] bg-gradient-to-b from-white to-[#faf9ff] p-4 shadow-sm sm:p-5">
            <h3 className="text-base font-black text-[#2e2a58]">ผลค้นหา</h3>
            {customerName ? (
              <p className="mt-2 text-sm font-medium text-[#5f5a8a]">
                ชื่อลูกค้า: <span className="text-[#2e2a58]">{customerName}</span>
              </p>
            ) : phone.length >= 9 ? (
              <p className="mt-2 text-xs text-[#66638c]">ยังไม่มีชื่อ — ใส่ตอนขายแพ็กหรือบันทึกเงินสด</p>
            ) : null}

            {subs.length === 0 && phone.length >= 9 && !searching ? (
              <p className={`mt-4 ${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-sm font-medium text-amber-950`}>
                ไม่มีแพ็กที่ใช้ได้ — ใช้ปุ่ม &quot;ขายแพ็ก&quot; ด้านล่าง
              </p>
            ) : null}

            {subs.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b87ad]">เลือกแพ็กเพื่อหักครั้ง</p>
                {subs.map((s) => (
                  <label
                    key={s.id}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3.5 shadow-sm transition hover:border-[#4d47b6]/40",
                      selectedSubId === s.id ? "border-[#4d47b6] ring-2 ring-[#4d47b6]/15" : "border-[#ecebff]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="subpick"
                      checked={selectedSubId === s.id}
                      onChange={() => setSelectedSubId(s.id)}
                      className="h-5 w-5 accent-[#4d47b6]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#2e2a58]">{s.packageName}</p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-[#4d47b6]">
                        เหลือ {s.remainingSessions} ครั้ง
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              disabled={deducting || !selectedSubId || subs.length === 0}
              onClick={() => void onDeduct()}
              className="mt-5 flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-[1.03] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
            >
              {deducting ? "กำลังบันทึก…" : "หัก 1 ครั้งจากแพ็ก"}
            </button>
          </div>
        </section>
      )}

      <section className={barberSectionNextClass} aria-label="บันทึกด่วน">
        <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-[#f5f3ff] p-4 shadow-[0_14px_36px_-22px_rgba(91,97,255,0.45)] sm:p-5">
          <div
            className="pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-[#5b61ff]/10"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-lg font-black tracking-tight text-[#2e2a58]">บันทึกด่วน</h2>
            <p className="mt-1 text-[13px] text-[#66638c]">Walk-in หรือเปิดแพ็กใหม่ — ไม่ต้องค้นหาเบอร์ก่อน</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setCashFormErr(null);
                  closeCashCamera();
                  clearCashReceipt();
                  setCashModalOpen(true);
                }}
                suppressHydrationWarning
                className="flex min-h-[4.75rem] items-center gap-4 rounded-2xl border-2 border-amber-400/90 bg-gradient-to-br from-amber-50 to-orange-50/80 px-4 py-3 text-left shadow-md shadow-amber-900/10 transition hover:border-amber-500 hover:brightness-[1.02] active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/35 text-amber-950">
                  <IconCoins className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black text-amber-950">เงินสด</span>
                  <span className="mt-0.5 block text-xs font-medium text-amber-900/85">เบอร์ · ชื่อ · ยอด · สลิป</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSellModalOpen(true)}
                disabled={packages.length === 0}
                suppressHydrationWarning
                className="app-btn-primary flex min-h-[4.75rem] items-center gap-4 rounded-2xl px-4 py-3 text-left shadow-lg shadow-[#4d47b6]/30 transition hover:brightness-[1.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white">
                  <IconPackageSpark className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black">ขายแพ็ก</span>
                  <span className="mt-0.5 block text-xs font-medium text-white/90">เลือกแพ็ก · เบอร์ · ชื่อ</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {stylistModalOpen
        ? (
            <BarberModalPortal>
            <div className={barberModalBackdropClass} role="presentation" onClick={() => setStylistModalOpen(false)}>
              <div
                id="barber-stylist-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="barber-stylist-modal-title"
                className={barberModalPanelMdClass}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={barberModalHeaderClass}>
                  <div className="min-w-0">
                    <h2 id="barber-stylist-modal-title" className={barberModalTitleClass}>
                      ช่างที่บันทึก
                    </h2>
                    <p className={barberModalSubtitleClass}>
                      ใช้กับการหักแพ็ก เงินสด และขายแพ็ก — เลือกครั้งเดียวต่อเซสชัน
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStylistModalOpen(false)}
                    className={barberModalCloseBtnClass}
                    aria-label="ปิด"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4 px-5 py-5">
                  {stylists.length === 0 ? (
                    <p className={`${barberCardSurfaceRadiusClass} border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950`}>
                      ยังไม่มีรายชื่อช่าง — ไปที่เมนู <strong className="font-bold">ช่าง</strong> เพื่อเพิ่มก่อน
                    </p>
                  ) : (
                    <>
                      <p className="inline-flex items-center gap-1.5 rounded-full border border-[#ecebff] bg-[#f8f7ff] px-3 py-1 text-[11px] font-semibold text-[#5f5a8a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                        {`ช่างในระบบ ${stylists.length} คน`}
                      </p>
                      <div>
                        <label htmlFor="barber-stylist-select-modal" className="text-sm font-semibold text-[#4d47b6]">
                          เลือกช่าง
                        </label>
                        <select
                          id="barber-stylist-select-modal"
                          className="app-input mt-2 min-h-[52px] w-full rounded-xl px-4 py-3 text-base shadow-sm focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/25"
                          value={stylistId}
                          onChange={(e) => setStylistId(e.target.value)}
                          aria-label="เลือกช่างที่บันทึก"
                        >
                          <option value="">— ไม่ระบุช่าง —</option>
                          {stylists.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-[11px] leading-snug text-[#8b87ad]">
                          ว่าง = ไม่บันทึกชื่อช่างในประวัติ
                        </p>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setStylistModalOpen(false)}
                    className="app-btn-primary min-h-[48px] w-full rounded-xl py-3 text-sm font-bold text-white"
                  >
                    เสร็จ
                  </button>
                </div>
              </div>
            </div>
            </BarberModalPortal>
          )
        : null}

      {cashModalOpen
        ? (
            <BarberModalPortal>
            <div
              className={barberModalBackdropClass}
              role="presentation"
              onClick={() => {
                if (cashCameraOpen) {
                  closeCashCamera();
                  return;
                }
                clearCashReceipt();
                setCashModalOpen(false);
              }}
            >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-cash-modal-title"
            className={barberModalPanelLgClass}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={barberModalHeaderClass}>
              <div className="min-w-0">
                <h2 id="barber-cash-modal-title" className={barberModalTitleClass}>
                  ลูกค้าเงินสด (Walk-in)
                </h2>
                <p className={barberModalSubtitleClass}>
                  แยกจากการหักแพ็ก — กรอกยอดเงินได้เพื่อสรุปรายได้ในประวัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeCashCamera();
                  clearCashReceipt();
                  setCashModalOpen(false);
                }}
                className={barberModalCloseBtnClass}
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCash} className="grid gap-3 px-5 py-5">
              {cashFormErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{cashFormErr}</p>
              ) : null}
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="เบอร์โทร"
                inputMode="numeric"
                value={cashPhone}
                onChange={(e) => setCashPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="ชื่อ (ไม่บังคับ)"
                value={cashName}
                onChange={(e) => setCashName(e.target.value)}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="หมายเหตุ (ไม่บังคับ)"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <IconReceipt className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>ยอดเงิน (บาท, ไม่บังคับ)</span>
                </div>
                <input
                  className="app-input mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 text-base"
                  placeholder="0"
                  inputMode="decimal"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  aria-label="ยอดเงินบาท"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-700">แนบรูปบิล / สลิป (ไม่บังคับ)</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 z-10 h-full min-h-[44px] w-full min-w-[44px] cursor-pointer opacity-0"
                      onChange={onCashReceiptSelected}
                      aria-label="อัปโหลดรูป"
                    />
                    <IconImageUp className="pointer-events-none h-5 w-5" aria-hidden />
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                    aria-label="ถ่ายรูปจากกล้อง"
                    onClick={openCashCamera}
                  >
                    <IconCamera className="h-5 w-5" aria-hidden />
                  </button>
                  {cashReceipt ? (
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                      onClick={clearCashReceipt}
                    >
                      ลบรูป
                    </button>
                  ) : null}
                </div>
                {cashReceipt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cashReceipt.url}
                    alt="ตัวอย่างสลิป"
                    className="mt-2 max-h-40 w-full rounded-lg border border-slate-200 bg-white object-contain"
                  />
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    closeCashCamera();
                    clearCashReceipt();
                    setCashModalOpen(false);
                  }}
                  className="min-h-[48px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={cashLoading}
                  className="min-h-[48px] rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 disabled:opacity-60"
                >
                  {cashLoading ? "…" : "บันทึกเงินสด"}
                </button>
              </div>
            </form>
          </div>

          {cashCameraOpen ? (
            <div
              className={barberModalCameraBackdropClass}
              role="dialog"
              aria-modal="true"
              aria-label="ถ่ายรูปสลิป"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={cashVideoRef}
                className="max-h-[min(55vh,420px)] w-full max-w-lg rounded-xl bg-black object-contain"
                playsInline
                muted
                autoPlay
              />
              {cashCameraErr ? (
                <p className="max-w-lg text-center text-sm text-amber-200">{cashCameraErr}</p>
              ) : (
                <p className="max-w-lg text-center text-xs text-white/70">กดถ่ายรูปเมื่อพร้อม — อนุญาตกล้องถ้าเบราว์เซอร์ถาม</p>
              )}
              <div className="flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeCashCamera}
                  className="min-h-[48px] rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={captureFromCashCamera}
                  className="min-h-[48px] rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100"
                >
                  ถ่ายรูป
                </button>
              </div>
            </div>
          ) : null}
            </div>
            </BarberModalPortal>
          )
        : null}

      <BarberSellPackageModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        externalStylistId={stylistId}
        packagesFromParent={packages}
        onSuccess={(r) => {
          const warn = r.warning?.trim();
          setMsg(
            warn ?
              `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""} · ${warn}`
            : `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""}`,
          );
          router.refresh();
        }}
      />

      {msg ?
        <p className={`${barberCardSurfaceRadiusClass} bg-emerald-50 ${barberCardBodyPaddingXClass} py-3 text-sm text-emerald-900`}>{msg}</p>
      : null}
      {err ?
        <p className={`${barberCardSurfaceRadiusClass} bg-red-50 ${barberCardBodyPaddingXClass} py-3 text-sm text-red-800`}>{err}</p>
      : null}
    </div>
  );
}
