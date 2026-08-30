"use client";

import { useRef, type ChangeEvent } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppImageThumb,
} from "@/components/app-templates";
import { encodeHomeFinancePublicAssetHref } from "@/lib/home-finance/attachments";
import { HomeFinanceSecondaryButton } from "@/systems/home-finance/components/HomeFinanceUi";

type HomeFinanceSlipUploadFieldProps = {
  slipUrl: string | null;
  onSlipUrlChange: (url: string | null) => void;
  onFile: (file: File) => void | Promise<void>;
  uploading?: boolean;
  disabled?: boolean;
  onOpenPreview: (url: string) => void;
};

/** อัปโหลดสลิปแบบง่าย — เลือกจากแกลเลอรีหรือถ่ายรูป */
export function HomeFinanceSlipUploadField({
  slipUrl,
  onSlipUrlChange,
  onFile,
  uploading = false,
  disabled = false,
  onOpenPreview,
}: HomeFinanceSlipUploadFieldProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void onFile(file);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-[#0000BF]/30 bg-gradient-to-br from-[#f4f4ff]/80 to-white p-3">
      {slipUrl ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <AppImageThumb
            src={encodeHomeFinancePublicAssetHref(slipUrl)}
            alt="สลิปที่แนบ"
            onOpen={() => onOpenPreview(encodeHomeFinancePublicAssetHref(slipUrl))}
            className="h-16 w-16"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs font-medium text-emerald-800">แนบสลิปแล้ว — กดดูรูปเพื่อตรวจสอบ</p>
            <HomeFinanceSecondaryButton type="button" onClick={() => onSlipUrlChange(null)}>
              ลบรูป
            </HomeFinanceSecondaryButton>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-slate-600">
          แนบสลิปโอนเงินหรือใบเสร็จ — รูปจากกล้องจะถูกย่ออัตโนมัติก่อนส่ง (ไม่บังคับ)
        </p>
      )}
      <AppGalleryCameraFileInputs
        galleryInputRef={galleryRef}
        cameraInputRef={cameraRef}
        onChange={onInputChange}
      />
      <AppImagePickCameraButtons
        className="justify-start"
        busy={uploading}
        disabled={disabled || uploading}
        onPickGallery={() => galleryRef.current?.click()}
        onPickCamera={() => cameraRef.current?.click()}
        labels={{
          gallery: slipUrl ? "เปลี่ยนรูป" : "เลือกจากแกลเลอรี",
          camera: "ถ่ายรูป",
          busy: "กำลังอัปโหลด…",
        }}
      />
    </div>
  );
}
