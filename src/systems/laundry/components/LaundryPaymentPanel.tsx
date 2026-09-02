"use client";

import { useRef } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  LAUNDRY_PAYMENT_METHODS,
  laundryPaymentMethodLabel,
  laundryPaymentShowsSlipUpload,
  type LaundryPaymentMethod,
} from "@/systems/laundry/lib/payment-method";

export function LaundryPaymentPanel({
  amountBaht,
  method,
  slipUrl,
  onMethodChange,
  onSlipUrlChange,
  disabled,
}: {
  amountBaht: number;
  method: LaundryPaymentMethod;
  slipUrl: string | null;
  onMethodChange: (m: LaundryPaymentMethod) => void;
  onSlipUrlChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const showSlip = laundryPaymentShowsSlipUpload(method, amountBaht);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function onSlipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onSlipUrlChange(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[#4d47b6]">ชำระเงิน</p>
      <div className="flex flex-wrap gap-1.5">
        {LAUNDRY_PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onMethodChange(m)}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-9 rounded-xl px-3 text-xs font-bold",
              method === m && "border-[#5b61ff]/45 bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/20",
            )}
          >
            {laundryPaymentMethodLabel(m)}
          </button>
        ))}
      </div>
      {showSlip ?
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-xs font-semibold text-[#66638c]">แนบสลิปโอน / พร้อมเพย์</p>
          {slipUrl ?
            <div className="mt-2 space-y-2">
              <img src={slipUrl} alt="" className="max-h-32 rounded-xl border border-slate-200 object-contain" />
              <button
                type="button"
                disabled={disabled}
                className="text-xs font-semibold text-rose-600"
                onClick={() => onSlipUrlChange(null)}
              >
                ลบสลิป
              </button>
            </div>
          : <>
              <AppGalleryCameraFileInputs
                galleryInputRef={galleryRef}
                cameraInputRef={cameraRef}
                onChange={onSlipFile}
              />
              <AppImagePickCameraButtons
                className="mt-2"
                disabled={disabled}
                onPickGallery={() => galleryRef.current?.click()}
                onPickCamera={() => cameraRef.current?.click()}
              />
            </>
          }
        </div>
      : null}
    </div>
  );
}
