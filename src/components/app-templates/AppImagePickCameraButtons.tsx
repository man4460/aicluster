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
  /** แทนสไตล์ม่วง/เขียว POS — ใช้คลาสเดียวกันทั้งคู่ */
  buttonClassName?: string;
  galleryButtonClassName?: string;
  cameraButtonClassName?: string;
};

/** ปุ่มคู่: เลือกรูป / ถ่ายรูป — ใช้ `AppPickGalleryImageButton` + `AppTakePhotoButton` */
export function AppImagePickCameraButtons({
  onPickGallery,
  onPickCamera,
  disabled,
  busy,
  labels = {},
  className,
  buttonClassName,
  galleryButtonClassName,
  cameraButtonClassName,
}: AppImagePickCameraButtonsProps) {
  const lg = labels.gallery ?? "เลือกรูป";
  const cam = labels.camera ?? "ถ่ายรูป";
  const b = labels.busy ?? "กำลังอัปโหลด…";

  const galleryClass = galleryButtonClassName ?? buttonClassName;
  const cameraClass = cameraButtonClassName ?? buttonClassName;

  return (
    <div className={cn("flex flex-wrap justify-end gap-2", className)}>
      <AppPickGalleryImageButton
        disabled={disabled || busy}
        onClick={onPickGallery}
        className={galleryClass}
      >
        {busy ? b : lg}
      </AppPickGalleryImageButton>
      <AppTakePhotoButton disabled={disabled || busy} onClick={onPickCamera} className={cameraClass}>
        {cam}
      </AppTakePhotoButton>
    </div>
  );
}
