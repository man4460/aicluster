"use client";

import type { ChangeEvent, RefObject } from "react";

export type AppGalleryCameraFileInputsProps = {
  galleryInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** className สำหรับ input ซ่อน (เช่น sr-only) */
  inputClassName?: string;
};

/**
 * คู่ input ไฟล์: แกลเลอรี + กล้อง (capture) — ใช้คู่ปุ่ม AppImagePickCameraButtons หรือ AppPickGalleryImageButton + AppTakePhotoButton
 */
export function AppGalleryCameraFileInputs({
  galleryInputRef,
  cameraInputRef,
  onChange,
  inputClassName = "sr-only",
}: AppGalleryCameraFileInputsProps) {
  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className={inputClassName}
        tabIndex={-1}
        aria-hidden
        onChange={onChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={inputClassName}
        tabIndex={-1}
        aria-hidden
        onChange={onChange}
      />
    </>
  );
}
