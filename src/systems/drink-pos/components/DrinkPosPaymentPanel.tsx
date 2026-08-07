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
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatThb } from "@/systems/inventory/lib/inventory-client-data";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import {
  drinkPosPaymentMethodLabel,
  drinkPosPaymentRequiresSlip,
  type DrinkPosPaymentMethod,
} from "@/systems/drink-pos/lib/payment-method";
import {
  drinkPosChipActiveClass,
  drinkPosChipIdleClass,
  drinkPosCtaClass,
} from "@/systems/drink-pos/lib/ui-tokens";

type PromptPayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

const STAFF_METHODS: DrinkPosPaymentMethod[] = ["CASH", "PROMPTPAY", "TRANSFER"];
const PUBLIC_METHODS: DrinkPosPaymentMethod[] = ["CASH", "PROMPTPAY", "TRANSFER"];

export type DrinkPosPaymentPanelProps = {
  amountBaht: number;
  method: DrinkPosPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: DrinkPosPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  /** ลิงก์ลูกค้า — ใช้ API สาธารณะ */
  variant?: "staff" | "public";
  ownerId?: string;
  trialParam?: string | null;
};

function methodLabel(m: DrinkPosPaymentMethod, variant: "staff" | "public"): string {
  if (variant === "public" && m === "CASH") return "จ่ายที่ร้าน";
  return drinkPosPaymentMethodLabel(m);
}

export function DrinkPosPaymentPanel({
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
  variant = "staff",
  ownerId,
  trialParam,
}: DrinkPosPaymentPanelProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const lb = useAppImageLightbox();
  const methods = variant === "public" ? PUBLIC_METHODS : STAFF_METHODS;
  const isPublic = variant === "public";

  const [info, setInfo] = useState<PromptPayInfo | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);
  const [customerQrOpen, setCustomerQrOpen] = useState(false);

  const needsPayUi = amountBaht > 0;
  const needsSlip = drinkPosPaymentRequiresSlip(method, amountBaht);
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
    if (isPublic && (!ownerId || ownerId.length < 10)) {
      setInfo(null);
      setQrErr("ไม่พบร้าน");
      return;
    }
    let cancelled = false;
    setQrBusy(true);
    setQrErr(null);
    void (async () => {
      try {
        const res = await fetch(
          isPublic ? "/api/drink-pos/public/promptpay-qr" : "/api/drink-pos/promptpay-qr",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: isPublic ? "omit" : "include",
            body: JSON.stringify(
              isPublic
                ? { ownerId, amountBaht, t: trialParam ?? null }
                : { amountBaht },
            ),
          },
        );
        const j = (await res.json().catch(() => ({}))) as Partial<PromptPayInfo> & { error?: string };
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
  }, [amountBaht, method, needsPayUi, isPublic, ownerId, trialParam]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    if (isPublic && (!ownerId || ownerId.length < 10)) {
      setSlipErr("ไม่พบร้าน");
      return;
    }
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      if (isPublic) fd.append("ownerId", ownerId!);
      const res = await fetch(isPublic ? "/api/drink-pos/public/upload-slip" : "/api/drink-pos/upload", {
        method: "POST",
        body: fd,
        credentials: isPublic ? "omit" : "include",
      });
      const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
      if (!res.ok || typeof j?.imageUrl !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
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
        <p className="text-xs font-bold text-emerald-800">ยอด ฿0 — ไม่ต้องเลือกช่องทางชำระ</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-2xl border border-white/55 bg-white/55 p-3 shadow-sm ring-1 ring-inset ring-white/40", className)}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ช่องทางชำระ</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
          {methods.map((m) => (
            <DrinkPosButton
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => {
                onMethodChange(m);
                if (m === "CASH") onSlipUrlChange(null);
              }}
              className={cn("shrink-0 transition", method === m ? drinkPosChipActiveClass : drinkPosChipIdleClass)}
              aria-pressed={method === m}
            >
              {methodLabel(m, variant)}
            </DrinkPosButton>
          ))}
        </div>
      </div>

      <p className="text-sm font-black text-[#4d47b6]">ยอดที่ต้องชำระ ฿{formatThb(amountBaht)}</p>

      {showPromptPay ? (
        <div className="space-y-2 rounded-[1.25rem] border border-[#e8e6fc]/90 bg-white/80 p-3">
          <p className="text-xs font-black text-[#1e1b4b]">QR พร้อมเพย์</p>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f8f7ff] p-3 ring-1 ring-[#e8e6fc]">
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
                    ? isPublic
                      ? "ร้านยังไม่ได้ตั้งเบอร์พร้อมเพย์ — เลือกโอนเงินหรือจ่ายที่ร้าน"
                      : "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ไปที่ตั้งค่าร้าน"
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
            <DrinkPosButton
              type="button"
              disabled={disabled}
              className={cn(drinkPosCtaClass, "w-full min-h-[44px] rounded-2xl text-sm")}
              onClick={() => setCustomerQrOpen(true)}
              aria-label={isPublic ? "ขยาย QR พร้อมเพย์" : "แสดง QR พร้อมเพย์ให้ลูกค้าสแกน"}
            >
              {isPublic ? "ขยาย QR ให้สแกนง่าย" : "แสดงให้ลูกค้าสแกน"}
            </DrinkPosButton>
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
                aria-labelledby="drink-pos-customer-pp-qr-title"
                className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[2rem] border border-white/60 bg-white px-5 py-6 shadow-[0_28px_80px_-18px_rgba(30,27,75,0.45)] sm:px-8 sm:py-8"
                onClick={(e) => e.stopPropagation()}
              >
                <p
                  id="drink-pos-customer-pp-qr-title"
                  className="text-center text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl"
                >
                  สแกนพร้อมเพย์
                </p>
                {(info.shopName || info.promptPayPhone) ? (
                  <p className="mt-1 text-center text-sm font-semibold text-[#66638c]">
                    {info.shopName?.trim() || "ร้านเครื่องดื่ม"}
                    {info.promptPayPhone ? ` · ${info.promptPayPhone}` : ""}
                  </p>
                ) : null}
                <p className="mt-3 text-center text-2xl font-black tabular-nums text-[#4d47b6] sm:text-3xl">
                  ฿{formatThb(amountBaht)}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={info.qrDataUrl}
                  alt="QR พร้อมเพย์สำหรับลูกค้าสแกน"
                  className="mt-5 h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-3xl bg-white p-3 object-contain ring-1 ring-[#e8e6fc]"
                />
                <p className="mt-4 text-center text-xs font-semibold text-[#66638c]">
                  {isPublic ? "สแกนด้วยแอปธนาคารเพื่อโอนยอดนี้" : "หันจอให้ลูกค้าสแกนด้วยแอปธนาคาร"}
                </p>
                <DrinkPosButton
                  type="button"
                  className="mt-5 min-h-[44px] w-full rounded-2xl border border-white/70 bg-[#f5f3ff] px-4 text-sm font-black text-[#4d47b6]"
                  onClick={() => setCustomerQrOpen(false)}
                >
                  ปิด
                </DrinkPosButton>
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
              {qrErr ||
                (isPublic
                  ? "ร้านยังไม่ได้ตั้งบัญชีโอน — เลือกพร้อมเพย์หรือจ่ายที่ร้าน"
                  : "ยังไม่ได้ตั้งบัญชีโอน — ไปที่ตั้งค่าร้าน")}
            </p>
          )}
        </div>
      ) : null}

      {needsSlip ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#1e1b4b]">
            {method === "PROMPTPAY" ? "แนบสลิปหลังโอนพร้อมเพย์" : "แนบสลิปการโอน"}
          </p>
          <AppGalleryCameraFileInputs
            galleryInputRef={galleryRef}
            cameraInputRef={cameraRef}
            onChange={onSlipInputChange}
          />
          <AppImagePickCameraButtons
            disabled={disabled}
            busy={slipBusy}
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => cameraRef.current?.click()}
            labels={{ gallery: "เลือกรูปสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
            className="justify-start"
          />
          {slipErr ? <p className="text-xs font-semibold text-rose-600">{slipErr}</p> : null}
          {slipUrl ? (
            <div className="flex items-center gap-3">
              <AppImageThumb src={slipUrl} alt="สลิปชำระเงิน" onOpen={() => lb.open(slipUrl)} className="h-20 w-20" />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-bold text-emerald-700">แนบสลิปแล้ว</p>
                <DrinkPosButton
                  type="button"
                  disabled={disabled || slipBusy}
                  className="rounded-xl px-2 py-1 text-[11px] font-black text-rose-600 hover:bg-rose-50"
                  onClick={() => onSlipUrlChange(null)}
                >
                  ลบสลิป
                </DrinkPosButton>
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-[#66638c]">ต้องแนบสลิปก่อนบันทึกบิล</p>
          )}
          <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
        </div>
      ) : null}
    </div>
  );
}

export function drinkPosPaymentSubmitBlocked(
  method: DrinkPosPaymentMethod,
  amountBaht: number,
  slipUrl: string | null,
): boolean {
  return drinkPosPaymentRequiresSlip(method, amountBaht) && !slipUrl?.trim();
}
