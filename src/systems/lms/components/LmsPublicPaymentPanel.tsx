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

type PayInfo = {
  qrDataUrl: string | null;
  configured: boolean;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  shopName: string | null;
};

export type LmsPayMethod = "PROMPTPAY" | "TRANSFER";

type Props = {
  slug: string;
  amountBaht: number;
  method: LmsPayMethod;
  slipUrl: string | null;
  onMethodChange: (method: LmsPayMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
};

const chipActive =
  "rounded-full border border-indigo-500 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700";
const chipIdle =
  "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600";

export function LmsPublicPaymentPanel({
  slug,
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
  className,
}: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });
  const lb = useAppImageLightbox();

  const [info, setInfo] = useState<PayInfo | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);

  useEffect(() => {
    if (amountBaht <= 0) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    setQrBusy(true);
    setQrErr(null);
    void (async () => {
      try {
        const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/promptpay-qr`, {
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
          setQrErr("เชื่อมต่อไม่ได้");
        }
      } finally {
        if (!cancelled) setQrBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amountBaht, slug]);

  async function uploadSlip(file: File | null) {
    if (!file || disabled) return;
    setSlipBusy(true);
    setSlipErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.set("file", prepared);
      const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/upload-slip`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
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

  if (amountBaht <= 0) {
    return (
      <div className={cn("rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5", className)}>
        <p className="text-xs font-bold text-emerald-800">คอร์สฟรี — ไม่ต้องชำระเงิน</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">ช่องทางชำระ</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ช่องทางชำระเงิน">
            {(
              [
                { key: "PROMPTPAY" as const, label: "พร้อมเพย์" },
                { key: "TRANSFER" as const, label: "โอนธนาคาร" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                disabled={disabled}
                onClick={() => onMethodChange(m.key)}
                className={cn("shrink-0 transition disabled:opacity-50", method === m.key ? chipActive : chipIdle)}
                aria-pressed={method === m.key}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm font-black text-indigo-700">
          ยอดที่ต้องชำระ ฿{amountBaht.toLocaleString("th-TH")}
        </p>

        {method === "PROMPTPAY" ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-xs font-bold text-slate-900">QR พร้อมเพย์</p>
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-3">
              {qrBusy ? (
                <p className="py-12 text-xs font-bold text-slate-500">กำลังสร้าง QR…</p>
              ) : info?.qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.qrDataUrl}
                  alt="QR พร้อมเพย์"
                  className="h-[200px] w-[200px] rounded-2xl bg-white p-2 object-contain"
                />
              ) : (
                <p className="py-8 text-center text-xs font-bold text-rose-600">
                  {qrErr || "ยังไม่ได้ตั้งค่าพร้อมเพย์ — ติดต่อสถาบัน"}
                </p>
              )}
            </div>
            {info?.promptPayPhone ? (
              <p className="text-center text-xs font-semibold text-slate-600">เบอร์ {info.promptPayPhone}</p>
            ) : null}
          </div>
        ) : null}

        {method === "TRANSFER" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs font-semibold text-slate-900">
            {info?.bankName ? (
              <p>
                {info.bankName} · {info.bankAccountNumber} · {info.bankAccountName}
              </p>
            ) : qrBusy ? (
              <p className="text-slate-500">กำลังโหลดบัญชี…</p>
            ) : (
              <p className="text-rose-600">ยังไม่ได้ตั้งบัญชีโอน — ติดต่อสถาบัน</p>
            )}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-900">แนบสลิปการโอน</p>
          <AppGalleryCameraFileInputs
            galleryInputRef={galleryRef}
            cameraInputRef={cameraInputRef}
            onChange={onSlipInputChange}
          />
          <AppImagePickCameraButtons
            disabled={disabled || slipBusy}
            busy={slipBusy}
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => openCamera((f) => void uploadSlip(f))}
            labels={{ gallery: "เลือกรูปสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
          />
          {slipErr ? <p className="text-xs font-semibold text-rose-600">{slipErr}</p> : null}
          {slipUrl ? (
            <div className="flex items-center gap-3">
              <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
              <button
                type="button"
                className="text-xs font-bold text-rose-600"
                disabled={disabled}
                onClick={() => onSlipUrlChange(null)}
              >
                ลบสลิป
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
