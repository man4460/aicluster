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
  DORM_PAYMENT_METHODS,
  dormPaymentMethodLabel,
  dormPaymentShowsSlipUpload,
  type DormPaymentMethod,
} from "@/systems/dormitory/lib/payment-method";
import { useDormitoryApiFetch } from "@/systems/dormitory/lib/staff-api-fetch";
import { dormFilterChipClass } from "@/systems/dormitory/dorm-ui-tokens";

type PayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export type DormPaymentPanelProps = {
  paymentId: number;
  amountBaht: number;
  method: DormPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: DormPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function DormPaymentPanel({
  paymentId,
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
}: DormPaymentPanelProps) {
  const apiFetch = useDormitoryApiFetch();
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
  const needsSlip = dormPaymentShowsSlipUpload(method, amountBaht);
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
        const res = await apiFetch("/api/dorm/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
  }, [amountBaht, apiFetch, method, needsPayUi]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await apiFetch(`/api/dorm/payments/${paymentId}/proof`, { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { proofSlipUrl?: string; error?: string };
      if (!res.ok || !j.proofSlipUrl) {
        throw new Error(j.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      }
      onSlipUrlChange(j.proofSlipUrl);
    } catch (e) {
      setSlipErr(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setSlipBusy(false);
    }
  }

  async function removeSlip() {
    if (disabled || slipBusy || !slipUrl) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const res = await apiFetch(`/api/dorm/payments/${paymentId}/proof`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(j.error ?? "ลบสลิปไม่สำเร็จ");
      }
      onSlipUrlChange(null);
    } catch (e) {
      setSlipErr(e instanceof Error ? e.message : "ลบสลิปไม่สำเร็จ");
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
    <div className={cn("space-y-3 rounded-[1.25rem] border border-white/55 bg-white/55 p-3 ring-1 ring-inset ring-white/40", className)}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ช่องทางชำระ</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
          {DORM_PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => {
                onMethodChange(m);
                if (m === "CASH" || m === "CREDIT_CARD") onSlipUrlChange(null);
              }}
              className={cn(
                "min-h-[40px] shrink-0 rounded-xl px-3 text-xs font-bold transition sm:text-sm",
                dormFilterChipClass(method === m),
              )}
              aria-pressed={method === m}
            >
              {dormPaymentMethodLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm font-black text-[#4d47b6]">
        ยอดที่ต้องชำระ {amountBaht.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท
      </p>

      {showPromptPay ? (
        <div className="space-y-2 rounded-[1.25rem] border border-[#e8e6fc]/90 bg-white/80 p-3">
          <p className="text-xs font-black text-[#1e1b4b]">QR พร้อมเพย์</p>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f8f7ff] p-3 ring-1 ring-[#e8e6fc]">
            {qrBusy ? (
              <p className="py-12 text-xs font-bold text-[#66638c]">กำลังสร้าง QR…</p>
            ) : info?.qrDataUrl ? (
              <img
                src={info.qrDataUrl}
                alt="QR พร้อมเพย์"
                className="h-[200px] w-[200px] rounded-2xl bg-white p-2 object-contain"
              />
            ) : (
              <p className="py-8 text-center text-xs font-bold text-rose-600">
                {qrErr ||
                  (info?.configured === false
                    ? "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ไปที่ตั้งค่าหอพัก"
                    : "สร้าง QR ไม่สำเร็จ")}
              </p>
            )}
          </div>
          {info?.promptPayPhone ? (
            <p className="text-xs font-semibold text-[#66638c]">
              พร้อมเพย์: <span className="font-black text-[#1e1b4b]">{info.promptPayPhone}</span>
            </p>
          ) : null}
          {info?.qrDataUrl ? (
            <button
              type="button"
              disabled={disabled}
              className="w-full min-h-[44px] rounded-2xl bg-[#0000BF] px-4 text-sm font-black text-white hover:bg-[#0000a6] disabled:opacity-50"
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
                aria-labelledby="dorm-customer-pp-qr-title"
                className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[1.5rem] border border-white/60 bg-white px-5 py-6 shadow-2xl sm:px-8 sm:py-8"
                onClick={(e) => e.stopPropagation()}
              >
                <p id="dorm-customer-pp-qr-title" className="text-center text-lg font-black text-[#1e1b4b] sm:text-xl">
                  สแกนพร้อมเพย์
                </p>
                {info.shopName || info.promptPayPhone ? (
                  <p className="mt-1 text-center text-sm font-semibold text-[#66638c]">
                    {info.shopName?.trim() || "หอพัก"}
                    {info.promptPayPhone ? ` · ${info.promptPayPhone}` : ""}
                  </p>
                ) : null}
                <p className="mt-3 text-center text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">
                  {amountBaht.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท
                </p>
                <img
                  src={info.qrDataUrl}
                  alt="QR พร้อมเพย์สำหรับลูกค้าสแกน"
                  className="mt-5 h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-3xl bg-white p-3 object-contain ring-1 ring-[#e8e6fc]"
                />
                <button
                  type="button"
                  className="mt-5 min-h-[44px] w-full rounded-2xl border border-white/70 bg-[#f5f3ff] px-4 text-sm font-black text-[#4d47b6]"
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
          {qrBusy && !info ? (
            <p>กำลังโหลดข้อมูลบัญชี…</p>
          ) : info?.bankAccountNumber || info?.bankName ? (
            <>
              <p>
                ธนาคาร: <span className="font-black text-[#1e1b4b]">{info.bankName || "—"}</span>
              </p>
              <p>
                เลขบัญชี: <span className="font-black text-[#1e1b4b]">{info.bankAccountNumber || "—"}</span>
              </p>
              <p>
                ชื่อบัญชี: <span className="font-black text-[#1e1b4b]">{info.bankAccountName || "—"}</span>
              </p>
            </>
          ) : (
            <p className="font-bold text-rose-600">
              {qrErr || "ยังไม่ได้ตั้งบัญชีโอน — ไปที่ตั้งค่าหอพัก"}
            </p>
          )}
        </div>
      ) : null}

      {needsSlip ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#1e1b4b]">
            {method === "PROMPTPAY" ? "แนบสลิปหลังโอนพร้อมเพย์" : "แนบสลิปการโอน"}{" "}
            <span className="font-semibold text-[#8b87b8]">(ไม่บังคับ)</span>
          </p>
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
            <div className="flex items-center gap-3">
              <AppImageThumb src={slipUrl} alt="สลิปชำระเงิน" onOpen={() => lb.open(slipUrl)} className="h-20 w-20" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-bold text-emerald-700">แนบสลิปแล้ว</p>
                <button
                  type="button"
                  disabled={disabled || slipBusy}
                  className="rounded-xl px-2 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50"
                  onClick={() => void removeSlip()}
                >
                  ลบสลิป
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-[#66638c]">แนบสลิปได้ถ้าต้องการ — ไม่บังคับก่อนยืนยัน</p>
          )}
          <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
          {cameraModal}
        </div>
      ) : null}
    </div>
  );
}
