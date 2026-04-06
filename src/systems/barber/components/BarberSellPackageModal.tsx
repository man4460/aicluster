"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { AppCameraCaptureModal } from "@/components/app-templates";

export type BarberSellPackagePkg = { id: number; name: string; price: number; totalSessions: number };

type StylistBrief = { id: number; name: string };

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

export type BarberSellPackageModalProps = {
  open: boolean;
  onClose: () => void;
  /** หลังบันทึกสำเร็จ — ปิดโมดัลเป็นหน้าที่ parent */
  onSuccess?: (result: { subscriptionId?: number; warning?: string | null }) => void;
  /**
   * หน้าเช็กอิน: ส่ง stylist จากแถบบนหน้า (ไม่แสดง dropdown ในโมดัล)
   * ไม่ส่ง = โมดัลโหลดรายช่างเองและมี dropdown ในโมดัล
   */
  externalStylistId?: string;
  /** หน้าเช็กอิน: ส่งแพ็กที่โหลดแล้ว — ไม่ส่ง = โมดัลโหลดเองตอนเปิด */
  packagesFromParent?: BarberSellPackagePkg[];
};

export function BarberSellPackageModal({
  open,
  onClose,
  onSuccess,
  externalStylistId,
  packagesFromParent,
}: BarberSellPackageModalProps) {
  const [packages, setPackages] = useState<BarberSellPackagePkg[]>(packagesFromParent ?? []);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [internalStylistId, setInternalStylistId] = useState("");
  const [sellPkg, setSellPkg] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellName, setSellName] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellFormErr, setSellFormErr] = useState<string | null>(null);
  const [sellReceipt, setSellReceipt] = useState<{ file: File; url: string } | null>(null);
  const [sellCameraOpen, setSellCameraOpen] = useState(false);

  const clearSellReceipt = useCallback(() => {
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const onSellReceiptSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setSellFormErr("เลือกรูปภาพเท่านั้น");
      return;
    }
    setSellFormErr(null);
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file: f, url: URL.createObjectURL(f) };
    });
  }, []);

  const onSellCameraCapture = useCallback((file: File) => {
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file) };
    });
    setSellFormErr(null);
  }, []);

  useEffect(() => {
    if (packagesFromParent && packagesFromParent.length > 0) {
      setPackages(packagesFromParent);
    }
  }, [packagesFromParent]);

  useEffect(() => {
    if (!open) return;
    if (packagesFromParent && packagesFromParent.length > 0) return;
    void fetch("/api/barber/packages")
      .then((r) => r.json())
      .then((d: { packages?: BarberSellPackagePkg[] }) => setPackages(d.packages ?? []))
      .catch(() => {});
  }, [open, packagesFromParent]);

  useEffect(() => {
    if (!open || externalStylistId !== undefined) return;
    void fetch("/api/barber/stylists")
      .then((r) => r.json())
      .then((d: { stylists?: StylistBrief[] }) => setStylists(d.stylists ?? []))
      .catch(() => {});
  }, [open, externalStylistId]);

  useEffect(() => {
    if (!open) return;
    setSellFormErr(null);
    setSellPkg("");
    setSellPhone("");
    setSellName("");
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setSellCameraOpen(false);
    setInternalStylistId("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sellCameraOpen) {
          setSellCameraOpen(false);
          return;
        }
        clearSellReceipt();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, sellCameraOpen, clearSellReceipt, onClose]);

  async function onSell(e: React.FormEvent) {
    e.preventDefault();
    setSellFormErr(null);
    const pkgId = Number(sellPkg);
    const digits = sellPhone.replace(/\D/g, "");
    if (!Number.isInteger(pkgId) || pkgId < 1 || digits.length < 9) {
      setSellFormErr("เลือกแพ็กเกจและกรอกเบอร์ลูกค้า");
      return;
    }
    setSellLoading(true);
    try {
      let receiptImageUrl: string | undefined;
      if (sellReceipt?.file) {
        const fd = new FormData();
        fd.append("file", sellReceipt.file);
        const up = await fetch("/api/barber/cash-receipt/upload", { method: "POST", body: fd });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setSellFormErr(upData.error ?? "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setSellFormErr("อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        receiptImageUrl = upData.imageUrl;
      }

      const sidFromPage =
        externalStylistId !== undefined ? externalStylistId : internalStylistId;
      const sidSell = sidFromPage ? Number(sidFromPage) : null;
      const res = await fetch("/api/barber/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkgId,
          phone: digits,
          name: sellName.trim() || null,
          ...(sidSell != null && Number.isInteger(sidSell) && sidSell > 0 ? { stylistId: sidSell } : {}),
          ...(receiptImageUrl ? { receiptImageUrl } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        warning?: string;
        subscription?: { id: number };
      };
      if (!res.ok) {
        setSellFormErr(data.error ?? "ขายแพ็กไม่สำเร็จ");
        return;
      }
      clearSellReceipt();
      onSuccess?.({
        subscriptionId: data.subscription?.id,
        warning: data.warning?.trim() ?? null,
      });
      onClose();
    } finally {
      setSellLoading(false);
    }
  }

  const pkgList = packagesFromParent && packagesFromParent.length > 0 ? packagesFromParent : packages;
  const showInternalStylist = externalStylistId === undefined;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
        role="presentation"
        onClick={() => {
          clearSellReceipt();
          setSellCameraOpen(false);
          onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="barber-sell-modal-title"
          className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 id="barber-sell-modal-title" className="text-lg font-semibold text-slate-900">
                ขายแพ็กเกจให้ลูกค้า
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                เลือกแพ็กเกจ กรอกเบอร์และชื่อ — แนบสลิปได้ (ไม่บังคับ)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearSellReceipt();
                setSellCameraOpen(false);
                onClose();
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          <form onSubmit={(e) => void onSell(e)} className="grid gap-3 px-5 py-4">
            {sellFormErr ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{sellFormErr}</p>
            ) : null}
            {showInternalStylist ? (
              <div>
                <label htmlFor="barber-sell-modal-stylist" className="text-xs font-semibold text-slate-600">
                  ช่างที่บันทึกการขาย (ไม่บังคับ)
                </label>
                <select
                  id="barber-sell-modal-stylist"
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
                  value={internalStylistId}
                  onChange={(e) => setInternalStylistId(e.target.value)}
                >
                  <option value="">— ไม่ระบุช่าง —</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <select
              className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
              value={sellPkg}
              onChange={(e) => setSellPkg(e.target.value)}
              required
            >
              <option value="">เลือกแพ็กเกจ</option>
              {pkgList.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} — {p.price.toLocaleString("th-TH")} บ. / {p.totalSessions} ครั้ง
                </option>
              ))}
            </select>
            <input
              className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
              placeholder="เบอร์ลูกค้า"
              inputMode="numeric"
              value={sellPhone}
              onChange={(e) => setSellPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            />
            <input
              className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
              placeholder="ชื่อลูกค้า (ไม่บังคับ)"
              value={sellName}
              onChange={(e) => setSellName(e.target.value)}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-700">แนบรูปสลิป (ไม่บังคับ)</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 h-full min-h-[44px] w-full min-w-[44px] cursor-pointer opacity-0"
                    onChange={onSellReceiptSelected}
                    aria-label="อัปโหลดรูปสลิป"
                  />
                  <IconImageUp className="pointer-events-none h-5 w-5" aria-hidden />
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                  aria-label="ถ่ายรูปสลิปจากกล้อง"
                  onClick={() => {
                    setSellFormErr(null);
                    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                      setSellFormErr("เบราว์เซอร์ไม่รองรับการเปิดกล้อง — ใช้ปุ่มอัปโหลดรูปแทน");
                      return;
                    }
                    setSellCameraOpen(true);
                  }}
                >
                  <IconCamera className="h-5 w-5" aria-hidden />
                </button>
                {sellReceipt ? (
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                    onClick={clearSellReceipt}
                  >
                    ลบรูป
                  </button>
                ) : null}
              </div>
              {sellReceipt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sellReceipt.url}
                  alt="ตัวอย่างสลิป"
                  className="mt-2 max-h-40 w-full rounded-lg border border-slate-200 bg-white object-contain"
                />
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  clearSellReceipt();
                  setSellCameraOpen(false);
                  onClose();
                }}
                className="min-h-[48px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={sellLoading || pkgList.length === 0}
                className="app-btn-primary min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sellLoading ? "…" : "เปิดแพ็กเกจ"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AppCameraCaptureModal
        open={sellCameraOpen}
        onClose={() => setSellCameraOpen(false)}
        onCapture={(file) => onSellCameraCapture(file)}
        title="ถ่ายรูปสลิป"
      />
    </>
  );
}
