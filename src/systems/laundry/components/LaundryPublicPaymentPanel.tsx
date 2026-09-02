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
  LAUNDRY_PUBLIC_PAYMENT_METHODS,
  laundryPaymentShowsSlipUpload,
  laundryPublicPaymentMethodLabel,
  type LaundryPublicPaymentMethod,
} from "@/systems/laundry/lib/payment-method";
import {
  laundryPaymentChipActiveClass,
  laundryPaymentChipIdleClass,
  laundryPaymentCtaClass,
} from "@/systems/laundry/lib/ui-tokens";

type PayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export type LaundryPublicPaymentPanelProps = {
  ownerId: string;
  amountBaht: number;
  method: LaundryPublicPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: LaundryPublicPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  trialParam?: string | null;
};

export function LaundryPublicPaymentPanel({
  ownerId,
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
  trialParam,
}: LaundryPublicPaymentPanelProps) {
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
  const needsSlip = laundryPaymentShowsSlipUpload(method, amountBaht);
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
        const t = trialParam?.trim();
        const res = await fetch("/api/laundry/public/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId,
            amountBaht,
            ...(t ? { t } : {}),
          }),
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
          setQrErr("เชื่อมต่อไม่ได้");
        }
      } finally {
        if (!cancelled) setQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountBaht, method, needsPayUi, ownerId, trialParam]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.set("ownerId", ownerId);
      form.set("file", prepared);
      const res = await fetch("/api/laundry/public/upload-slip", { method: "POST", body: form });
      const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !j.imageUrl) {
        throw new Error(j.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      }
      onSlipUrlChange(j.imageUrl);
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
        <p className="text-xs font-bold text-emerald-800">ไม่ต้องชำระล่วงหน้า — ชำระเมื่อรับผ้า</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ช่องทางชำระ</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
            {LAUNDRY_PUBLIC_PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onMethodChange(m);
                  if (m === "CASH") onSlipUrlChange(null);
                }}
                className={cn(
                  "shrink-0 transition disabled:opacity-50",
                  method === m ? laundryPaymentChipActiveClass : laundryPaymentChipIdleClass,
                )}
                aria-pressed={method === m}
              >
                {laundryPublicPaymentMethodLabel(m)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm font-black text-[#4d47b6]">
          ยอดที่ต้องชำระ ฿{amountBaht.toLocaleString("th-TH")}
        </p>

        {showPromptPay ?
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-xs font-bold text-[#1e1b4b]">QR พร้อมเพย์</p>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-3">
              {qrBusy ?
                <p className="py-12 text-xs font-bold text-[#66638c]">กำลังสร้าง QR…</p>
              : info?.qrDataUrl ?
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.qrDataUrl} alt="QR พร้อมเพย์" className="h-[200px] w-[200px] rounded-2xl bg-white p-2 object-contain" />
              : <p className="py-8 text-center text-xs font-bold text-rose-600">{qrErr || "สร้าง QR ไม่สำเร็จ"}</p>}
            </div>
            {info?.qrDataUrl ?
              <button
                type="button"
                disabled={disabled}
                className={cn(laundryPaymentCtaClass, "w-full min-h-[44px] rounded-2xl text-sm")}
                onClick={() => setCustomerQrOpen(true)}
              >
                แสดง QR ให้สแกน
              </button>
            : null}
          </div>
        : null}

        {showTransfer && info ?
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs font-semibold text-[#1e1b4b]">
            {info.bankName ?
              <p>
                {info.bankName} · {info.bankAccountNumber} · {info.bankAccountName}
              </p>
            : <p className="text-rose-600">ยังไม่ได้ตั้งบัญชีโอน — ติดต่อร้าน</p>}
          </div>
        : null}

        {needsSlip ?
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#1e1b4b]">แนบสลิป</p>
            <AppImagePickCameraButtons
              disabled={disabled || slipBusy}
              onPickGallery={() => galleryRef.current?.click()}
              onPickCamera={() => openCamera((f) => void uploadSlip(f))}
            />
            <AppGalleryCameraFileInputs galleryRef={galleryRef} cameraRef={cameraInputRef} onGalleryChange={onSlipInputChange} />
            {slipUrl ?
              <AppImageThumb src={slipUrl} alt="สลิปชำระเงิน" onOpen={() => lb.open(slipUrl)} className="h-20 w-20" />
            : null}
            {slipErr ? <p className="text-xs font-semibold text-rose-600">{slipErr}</p> : null}
          </div>
        : null}
      </div>

      {cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />

      {customerQrOpen && info?.qrDataUrl ?
        createPortal(
          <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
            <button type="button" className="absolute inset-0" aria-label="ปิด" onClick={() => setCustomerQrOpen(false)} />
            <div className="relative max-w-sm rounded-2xl bg-white p-4 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={info.qrDataUrl} alt="QR พร้อมเพย์" className="mx-auto h-64 w-64 object-contain" />
              <button type="button" className={cn(laundryPaymentCtaClass, "mt-4 w-full min-h-[44px]")} onClick={() => setCustomerQrOpen(false)}>
                ปิด
              </button>
            </div>
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
