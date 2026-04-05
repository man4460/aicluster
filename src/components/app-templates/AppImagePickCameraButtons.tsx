"use client";

import { cn } from "@/lib/cn";
import { AppPickGalleryImageButton, AppTakePhotoButton } from "./AppTemplateSlipImageButtons";

export type AppImagePickCameraButtonsProps = {
  onPickGallery: () => void;
  onPickCamera: () => void;
  disabled?: boolean;
  busy?: boolean;
  labels?: { gallery?: string; camera?: string; busy?: string };
  className?: string;
};

/** ปุ่มคู่: เลือกรูป / ถ่ายรูป — ใช้ `AppPickGalleryImageButton` + `AppTakePhotoButton` */
export function AppImagePickCameraButtons({
  onPickGallery,
  onPickCamera,
  disabled,
  busy,
  labels = {},
  className,
}: AppImagePickCameraButtonsProps) {
  const lg = labels.gallery ?? "เลือกรูป";
  const cam = labels.camera ?? "ถ่ายรูป";
  const b = labels.busy ?? "กำลังอัปโหลด…";

  return (
    <div className={cn("flex flex-wrap justify-end gap-2", className)}>
      <AppPickGalleryImageButton disabled={disabled || busy} onClick={onPickGallery}>
        {busy ? b : lg}
      </AppPickGalleryImageButton>
      <AppTakePhotoButton disabled={disabled || busy} onClick={onPickCamera}>
        {cam}
      </AppTakePhotoButton>
    </div>
  );
}
