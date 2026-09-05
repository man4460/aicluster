"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_POS_PAYMENT_METHODS,
  ecommercePosPaymentMethodLabel,
  ecommercePosPaymentShowsSlipUpload,
  type EcommercePosPaymentMethod,
} from "@/systems/ecommerce-store/lib/payment-method";
import {
  ecommerceStorePaymentChipActiveClass,
  ecommerceStorePaymentChipIdleClass,
  ecommerceStorePaymentCtaClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type PayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export type EcommercePaymentPanelProps = {
  amountBaht: number;
  method: EcommercePosPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: EcommercePosPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

async function uploadEcommerceSlip(file: File): Promise<string> {
  const prepared = await prepareImageFileForUpload(file);
  const fd = new FormData();
  fd.set("file", prepared);
  const res = await fetch("/api/ecommerce-store/session/upload-slip", {
    method: "POST",
    body: fd,
  });
  const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
  if (!res.ok || typeof j.imageUrl !== "string") {
    throw new Error(typeof j.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
  }
  return j.imageUrl;
}

export function EcommercePaymentPanel({
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
}: EcommercePaymentPanelProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();

  const [info, setInfo] = useState<PayInfo | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);
  const [customerQrOpen, setCustomerQrOpen] = useState(false);

  const needsPayUi = amountBaht > 0;
  const needsSlip = ecommercePosPaymentShowsSlipUpload(method, amountBaht);
  const showPromptPay = needsPayUi && method === "PROMPTPAY";
  const showTransfer = needsPayUi && method === "TRANSFER";

  useEffect(() => {
    if (!showPromptPay) setCustomerQrOpen(false);
  }, [showPromptPay]);

  useEffect(() => {
    if (!customerQrOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomerQrOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [customerQrOpen]);

  useEffect(() => {
    if (!needsPayUi || (method !== "PROMPTPAY" && method !== "TRANSFER")) {
      setInfo(null);
      setQrErr(null);
      return;
    }
    let cancelled = false;
    setQrBusy(true);
    setQrErr(null);
    void (async () => {
      try {
        const res = await fetch("/api/ecommerce-store/session/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amountBaht }),
        });
        const j = (await res.json().catch(() => ({}))) as Partial<PayInfo> & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setInfo(null);
          setQrErr(typeof j.error === "string" ? j.error : "โหลดข้อมูลชำระเงินไม่สำเร็จ");
          return;
        }
        setInfo({
          qrDataUrl: j.qrDataUrl ?? null,
          configured: Boolean(j.configured),
          promptPayPhone: j.promptPayPhone ?? null,
          bankName: j.bankName ?? null,
          bankAccountNumber: j.bankAccountNumber ?? null,
          bankAccountName: j.bankAccountName ?? null,
          shopName: j.shopName ?? null,
        });
      } catch {
        if (!cancelled) {
          setInfo(null);
          setQrErr("เชื่อมต่อไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountBaht, method, needsPayUi]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const url = await uploadEcommerceSlip(file);
      onSlipUrlChange(url);
    } catch (e) {
      setSlipErr(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setSlipBusy(false);
    }
  }

  function onSlipInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    void uploadSlip(f);
  }

  if (!needsPayUi) {
    return (
      <div className={cn("rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5", className)}>
        <p className="text-xs font-bold text-emerald-800">ยอด ฿0 — ไม่ต้องเลือกช่องทางชำระ</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 border-t border-white/60 pt-3", className)}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ช่องทางชำระ</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
          {ECOMMERCE_POS_PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => {
                onMethodChange(m);
                if (m === "CASH" || m === "CREDIT_CARD") onSlipUrlChange(null);
              }}
              className={cn(
                "shrink-0 transition disabled:opacity-50",
                method === m ? ecommerceStorePaymentChipActiveClass : ecommerceStorePaymentChipIdleClass,
              )}
              aria-pressed={method === m}
            >
              {ecommercePosPaymentMethodLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm font-black text-[#4d47b6]">
        ยอดที่ต้องชำระ ฿{amountBaht.toLocaleString("th-TH")}
      </p>

      {showPromptPay ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-xs font-bold text-[#1e1b4b]">QR พร้อมเพย์</p>
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-3">
            {qrBusy ? (
              <p className="py-12 text-xs font-bold text-[#66638c]">กำลังสร้าง QR…</p>
            ) : info?.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.qrDataUrl}
                alt="QR พร้อมเพย์"
                className="h-[200px] w-[200px] rounded-2xl bg-white p-2 object-contain"
              />
            ) : (
              <p className="py-8 text-center text-xs font-bold text-rose-600">
                {qrErr ||
                  (info?.configured === false
                    ? "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ไปที่ตั้งค่าการเงิน"
                    : "สร้าง QR ไม่สำเร็จ")}
              </p>
            )}
          </div>
          {info?.promptPayPhone ? (
            <p className="text-center text-[11px] font-semibold text-[#66638c]">
              พร้อมเพย์: <span className="font-black text-[#1e1b4b]">{info.promptPayPhone}</span>
            </p>
          ) : null}
          {info?.qrDataUrl ? (
            <button
              type="button"
              disabled={disabled}
              className={cn(ecommerceStorePaymentCtaClass, "h-auto min-h-[40px] w-full max-h-none text-sm")}
              onClick={() => setCustomerQrOpen(true)}
              aria-label="แสดง QR พร้อมเพย์ให้ลูกค้าสแกน"
            >
              แสดงให้ลูกค้าสแกน
            </button>
          ) : null}
        </div>
      ) : null}

      {customerQrOpen && info?.qrDataUrl && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 sm:p-6" role="presentation">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                aria-label="ปิด QR ให้ลูกค้าสแกน"
                onClick={() => setCustomerQrOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[1.5rem] border border-white/60 bg-white px-5 py-6 shadow-xl sm:px-8 sm:py-8"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-center text-lg font-black text-[#1e1b4b]">สแกนพร้อมเพย์</p>
                <p className="mt-3 text-center text-2xl font-black tabular-nums text-[#4d47b6]">
                  ฿{amountBaht.toLocaleString("th-TH")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={info.qrDataUrl}
                  alt="QR พร้อมเพย์"
                  className="mt-5 h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-3xl bg-white p-3 object-contain ring-1 ring-[#e8e6fc]"
                />
                <button
                  type="button"
                  className="mt-5 min-h-[44px] w-full rounded-2xl border bg-[#f5f3ff] px-4 text-sm font-black text-[#4d47b6]"
                  onClick={() => setCustomerQrOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showTransfer ? (
        <div className="space-y-1.5 rounded-[1.25rem] border border-[#e8e6fc]/90 bg-white/80 p-3 text-xs font-semibold text-[#66638c]">
          <p className="text-xs font-black text-[#1e1b4b]">โอนเข้าบัญชี</p>
          {info?.bankAccountNumber || info?.bankName ? (
            <>
              <p>
                ธนาคาร: <span className="font-black text-[#1e1b4b]">{info.bankName || "—"}</span>
              </p>
              <p>
                เลขบัญชี: <span className="font-black text-[#1e1b4b]">{info.bankAccountNumber || "—"}</span>
              </p>
              {info.bankAccountName ? (
                <p>
                  ชื่อบัญชี: <span className="font-black text-[#1e1b4b]">{info.bankAccountName}</span>
                </p>
              ) : null}
            </>
          ) : (
            <p className="font-bold text-rose-600">
              {qrErr || "ยังไม่ได้ตั้งบัญชีโอน — ไปที่ตั้งค่าการเงิน"}
            </p>
          )}
        </div>
      ) : null}

      {needsSlip ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#1e1b4b]">แนบสลิป (ไม่บังคับ)</p>
          <AppGalleryCameraFileInputs
            galleryInputRef={galleryRef}
            cameraInputRef={cameraInputRef}
            onChange={onSlipInputChange}
          />
          <AppImagePickCameraButtons
            disabled={disabled}
            busy={slipBusy}
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => openCamera((file) => void uploadSlip(file))}
            labels={{ gallery: "เลือกรูปสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
            className="justify-start"
          />
          {slipErr ? <p className="text-xs font-semibold text-rose-600">{slipErr}</p> : null}
          {slipUrl ? (
            <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} className="h-20 w-20" />
          ) : null}
          <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
          {cameraModal}
        </div>
      ) : null}
    </div>
  );
}
