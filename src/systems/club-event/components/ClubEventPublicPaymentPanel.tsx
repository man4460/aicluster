"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
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
  clubEventOutlineButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

export const CLUB_EVENT_PUBLIC_PAY_METHODS = ["PROMPTPAY", "TRANSFER", "CASH"] as const;
export type ClubEventPublicPayMethod = (typeof CLUB_EVENT_PUBLIC_PAY_METHODS)[number];

function payMethodLabel(m: ClubEventPublicPayMethod): string {
  if (m === "PROMPTPAY") return "พร้อมเพย์";
  if (m === "TRANSFER") return "โอนเงิน";
  return "เงินสด / จ่ายหน้างาน";
}

type PayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export function ClubEventPublicPaymentPanel({
  ownerId,
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  paymentRulesNote,
  disabled,
  trialParam,
}: {
  ownerId: string;
  amountBaht: number;
  method: ClubEventPublicPayMethod;
  slipUrl: string | null;
  onMethodChange: (m: ClubEventPublicPayMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  paymentRulesNote?: string | null;
  disabled?: boolean;
  trialParam?: string | null;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);

  const needsPay = amountBaht > 0;
  const needsSlip = needsPay && (method === "PROMPTPAY" || method === "TRANSFER");

  useEffect(() => {
    if (!needsPay || (method !== "PROMPTPAY" && method !== "TRANSFER")) {
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
        const res = await fetch("/api/club-event/public/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId, amountBaht, ...(t ? { t } : {}) }),
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
  }, [amountBaht, method, needsPay, ownerId, trialParam]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.set("ownerId", ownerId);
      form.set("file", prepared);
      const res = await fetch("/api/club-event/public/upload-slip", { method: "POST", body: form });
      const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดสลิปไม่สำเร็จ");
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

  if (!needsPay) return null;

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm font-black text-[#4d47b6]">
          ยอดที่ต้องชำระ ฿{amountBaht.toLocaleString("th-TH")}
        </p>
        {paymentRulesNote?.trim() ? (
          <p className="whitespace-pre-wrap rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-[#5f5a3a]">
            {paymentRulesNote.trim()}
          </p>
        ) : null}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ช่องทางชำระ</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
            {CLUB_EVENT_PUBLIC_PAY_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onMethodChange(m);
                  if (m === "CASH") onSlipUrlChange(null);
                }}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3 text-xs font-bold transition disabled:opacity-50",
                  method === m
                    ? "border-[#5b61ff]/50 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
                    : "border-slate-200 bg-white text-[#5f5a8a]",
                )}
                aria-pressed={method === m}
              >
                {payMethodLabel(m)}
              </button>
            ))}
          </div>
        </div>

        {method === "PROMPTPAY" ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-xs font-bold text-[#1e1b4b]">QR พร้อมเพย์</p>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-3">
              {qrBusy ? (
                <p className="py-12 text-xs font-bold text-[#66638c]">กำลังสร้าง QR…</p>
              ) : info?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.qrDataUrl} alt="QR พร้อมเพย์" className="h-48 w-48 object-contain" />
              ) : (
                <p className="py-8 text-center text-xs font-semibold text-rose-600">
                  {qrErr ?? "ยังไม่ได้ตั้งค่าพร้อมเพย์"}
                </p>
              )}
            </div>
            {info?.promptPayPhone ? (
              <p className="text-center text-xs font-semibold text-[#66638c]">เบอร์ {info.promptPayPhone}</p>
            ) : null}
          </div>
        ) : null}

        {method === "TRANSFER" ? (
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
            <p className="text-xs font-bold text-[#1e1b4b]">โอนเข้าบัญชี</p>
            {qrBusy ? (
              <p className="text-xs text-[#66638c]">กำลังโหลด…</p>
            ) : (
              <>
                {info?.bankName ? <p>ธนาคาร: {info.bankName}</p> : null}
                {info?.bankAccountNumber ? <p>เลขบัญชี: {info.bankAccountNumber}</p> : null}
                {info?.bankAccountName ? <p>ชื่อบัญชี: {info.bankAccountName}</p> : null}
                {!info?.bankName && !info?.bankAccountNumber ? (
                  <p className="text-xs font-semibold text-rose-600">{qrErr ?? "ยังไม่ได้ตั้งค่าบัญชีโอน"}</p>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {needsSlip ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold text-[#4d47b6]">แนบสลิปการโอน</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={galleryRef}
              cameraInputRef={cameraInputRef}
              onChange={onSlipInputChange}
            />
            <AppImagePickCameraButtons
              disabled={disabled || slipBusy}
              busy={slipBusy}
              onPickGallery={() => galleryRef.current?.click()}
              onPickCamera={() =>
                openCamera((file) => {
                  void uploadSlip(file);
                })
              }
              buttonClassName={clubEventOutlineButtonClass}
            />
            {slipUrl ? (
              <AppImageThumb src={slipUrl} alt="สลิปชำระเงิน" onOpen={() => lb.open(slipUrl)} className="h-20 w-20" />
            ) : null}
            {slipErr ? <p className="text-xs font-semibold text-rose-600">{slipErr}</p> : null}
          </div>
        ) : null}
      </div>
      {cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}

export function clubEventPublicPayBlocked(
  method: ClubEventPublicPayMethod,
  amountBaht: number,
  slipUrl: string | null,
): boolean {
  if (amountBaht <= 0) return false;
  if (method === "CASH") return false;
  return !slipUrl?.trim();
}
