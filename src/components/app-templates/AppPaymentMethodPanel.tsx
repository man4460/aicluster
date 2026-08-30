"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AppGalleryCameraFileInputs } from "./AppGalleryCameraFileInputs";
import { AppImageLightbox } from "./AppImageLightbox";
import { AppImagePickCameraButtons } from "./AppImagePickCameraButtons";
import { AppImageThumb } from "./AppImageThumb";
import {
  APP_PAYMENT_METHODS,
  appPaymentMethodLabel,
  appPaymentShowsSlipUpload,
  type AppPaymentMethod,
} from "./payment-method";
import { prepareImageFileForUpload } from "./prepareImageFileForUpload";
import { useAppCameraCapture } from "./useAppCameraCapture";
import { useAppImageLightbox } from "./useAppImageLightbox";

export type AppPaymentInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export type AppPaymentMethodPanelProps = {
  amountBaht: number;
  method: AppPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: AppPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  fetchPayInfo: (amountBaht: number) => Promise<AppPaymentInfo>;
  uploadSlip: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
  variant?: "staff" | "public";
};

export function AppPaymentMethodPanel({
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  fetchPayInfo,
  uploadSlip,
  disabled,
  className,
  variant = "staff",
}: AppPaymentMethodPanelProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lightbox = useAppImageLightbox();
  const [info, setInfo] = useState<AppPaymentInfo | null>(null);
  const [infoBusy, setInfoBusy] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const methods = variant === "public" ? APP_PAYMENT_METHODS.filter((m) => m === "PROMPTPAY" || m === "TRANSFER") : APP_PAYMENT_METHODS;
  const showInfo = amountBaht > 0 && (method === "PROMPTPAY" || method === "TRANSFER");

  useEffect(() => {
    if (!showInfo) {
      setInfo(null);
      setInfoError(null);
      return;
    }
    let cancelled = false;
    setInfoBusy(true);
    setInfoError(null);
    void fetchPayInfo(amountBaht)
      .then((value) => {
        if (!cancelled) setInfo(value);
      })
      .catch((error: unknown) => {
        if (!cancelled) setInfoError(error instanceof Error ? error.message : "โหลดข้อมูลชำระเงินไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setInfoBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [amountBaht, fetchPayInfo, showInfo]);

  async function handleUpload(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipError(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      onSlipUrlChange(await uploadSlip(prepared));
    } catch (error) {
      setSlipError(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setSlipBusy(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    void handleUpload(file);
  }

  if (amountBaht <= 0) {
    return <div className={cn("rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-bold text-emerald-800", className)}>ยอด ฿0 — ไม่ต้องชำระเงิน</div>;
  }

  return (
    <div className={cn("space-y-3 rounded-[1.25rem] border border-white/60 bg-white/60 p-3 shadow-sm", className)}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
        {methods.map((item) => (
          <button
            key={item}
            type="button"
            disabled={disabled}
            aria-pressed={method === item}
            className={cn(
              "min-h-10 rounded-xl border px-3 text-xs font-black transition",
              method === item
                ? "border-[#0000BF]/35 bg-gradient-to-r from-[#0000BF] to-[#6d5dfc] text-white shadow-sm"
                : "border-white/70 bg-white/75 text-[#4d47b6]",
            )}
            onClick={() => {
              onMethodChange(item);
              if (item === "CASH" || item === "CREDIT_CARD") onSlipUrlChange(null);
            }}
          >
            {appPaymentMethodLabel(item)}
          </button>
        ))}
      </div>
      <p className="text-sm font-black text-[#4d47b6]">ยอดที่ต้องชำระ ฿{amountBaht.toLocaleString("th-TH")}</p>

      {method === "PROMPTPAY" ? (
        <div className="rounded-2xl border border-[#e8e6fc] bg-white/80 p-3 text-center">
          <p className="mb-2 text-xs font-black text-[#1e1b4b]">QR พร้อมเพย์</p>
          {infoBusy ? <p className="py-10 text-xs text-[#66638c]">กำลังสร้าง QR…</p> : info?.qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.qrDataUrl} alt="QR พร้อมเพย์" className="mx-auto h-52 w-52 rounded-2xl bg-white p-2 object-contain" />
          ) : <p className="py-8 text-xs font-bold text-rose-600">{infoError || "ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์"}</p>}
          {info?.promptPayPhone ? <p className="mt-2 text-xs font-semibold text-[#66638c]">พร้อมเพย์ {info.promptPayPhone}</p> : null}
        </div>
      ) : null}

      {method === "TRANSFER" ? (
        <div className="space-y-1 rounded-2xl border border-[#e8e6fc] bg-white/80 p-3 text-xs text-[#66638c]">
          <p className="font-black text-[#1e1b4b]">โอนเข้าบัญชี</p>
          {infoBusy ? <p>กำลังโหลด…</p> : info?.bankAccountNumber || info?.bankName ? (
            <>
              <p>ธนาคาร: <b className="text-[#1e1b4b]">{info.bankName || "—"}</b></p>
              <p>เลขบัญชี: <b className="text-[#1e1b4b]">{info.bankAccountNumber || "—"}</b></p>
              <p>ชื่อบัญชี: <b className="text-[#1e1b4b]">{info.bankAccountName || "—"}</b></p>
            </>
          ) : <p className="font-bold text-rose-600">{infoError || "ยังไม่ได้ตั้งค่าบัญชีโอน"}</p>}
        </div>
      ) : null}

      {appPaymentShowsSlipUpload(method, amountBaht) ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#1e1b4b]">แนบสลิป <span className="font-semibold text-[#8b87b8]">(ไม่บังคับ)</span></p>
          <AppGalleryCameraFileInputs galleryInputRef={galleryRef} cameraInputRef={cameraInputRef} onChange={onFileChange} />
          <AppImagePickCameraButtons
            disabled={disabled}
            busy={slipBusy}
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => openCamera((file) => void handleUpload(file))}
            labels={{ gallery: "เลือกรูปสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
          />
          {slipError ? <p className="text-xs font-semibold text-rose-600">{slipError}</p> : null}
          {slipUrl ? (
            <div className="flex items-center gap-3">
              <AppImageThumb src={slipUrl} alt="สลิปชำระเงิน" className="h-20 w-20" onOpen={() => lightbox.open(slipUrl)} />
              <button type="button" className="min-h-10 rounded-xl px-3 text-xs font-black text-rose-600" onClick={() => onSlipUrlChange(null)}>ลบสลิป</button>
            </div>
          ) : null}
          <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="สลิปชำระเงิน" />
          {cameraModal}
        </div>
      ) : null}
    </div>
  );
}
