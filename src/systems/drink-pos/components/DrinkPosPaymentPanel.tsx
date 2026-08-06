"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
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
import { drinkPosChipActiveClass, drinkPosChipIdleClass } from "@/systems/drink-pos/lib/ui-tokens";

type PromptPayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

const METHODS: DrinkPosPaymentMethod[] = ["CASH", "PROMPTPAY", "TRANSFER"];

export type DrinkPosPaymentPanelProps = {
  amountBaht: number;
  method: DrinkPosPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (method: DrinkPosPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function DrinkPosPaymentPanel({
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
}: DrinkPosPaymentPanelProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const lb = useAppImageLightbox();

  const [info, setInfo] = useState<PromptPayInfo | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);

  const needsPayUi = amountBaht > 0;
  const needsSlip = drinkPosPaymentRequiresSlip(method, amountBaht);
  const showPromptPay = needsPayUi && method === "PROMPTPAY";
  const showTransfer = needsPayUi && method === "TRANSFER";

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
        const res = await fetch("/api/drink-pos/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amountBaht }),
        });
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
  }, [amountBaht, method, needsPayUi]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/drink-pos/upload", { method: "POST", body: fd, credentials: "include" });
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
          {METHODS.map((m) => (
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
              {drinkPosPaymentMethodLabel(m)}
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
                    ? "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ไปที่ตั้งค่าร้าน"
                    : "สร้าง QR ไม่สำเร็จ")}
              </p>
            )}
          </div>
          {info?.promptPayPhone ? (
            <p className="text-xs font-semibold text-[#66638c]">
              พร้อมเพย์: <span className="font-black text-[#1e1b4b]">{info.promptPayPhone}</span>
            </p>
          ) : null}
        </div>
      ) : null}

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
              {qrErr || "ยังไม่ได้ตั้งบัญชีโอน — ไปที่ตั้งค่าร้าน"}
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
