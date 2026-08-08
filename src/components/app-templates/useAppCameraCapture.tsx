"use client";

import { useCallback, useRef, useState, type ReactElement } from "react";
import { AppCameraCaptureModal } from "./AppCameraCaptureModal";

export type UseAppCameraCaptureOptions = {
  /** หัวข้อโมดัลค่าเริ่ม */
  title?: string;
};

/**
 * ปุ่มถ่ายรูป → เปิดกล้องเครื่องผ่าน getUserMedia (`AppCameraCaptureModal`)
 * สำรอง: `<input capture>` เมื่อเบราว์เซอร์ไม่ให้ใช้กล้อง
 */
export function useAppCameraCapture(options?: UseAppCameraCaptureOptions) {
  const defaultTitle = options?.title?.trim() || "ถ่ายรูป";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const onFileRef = useRef<((file: File) => void) | null>(null);

  const closeCamera = useCallback(() => setOpen(false), []);

  const openCamera = useCallback(
    (onFile: (file: File) => void, modalTitle?: string) => {
      onFileRef.current = onFile;
      setTitle(modalTitle?.trim() || defaultTitle);
      setOpen(true);
    },
    [defaultTitle],
  );

  const cameraModal: ReactElement = (
    <AppCameraCaptureModal
      open={open}
      onClose={closeCamera}
      title={title}
      onCapture={(file) => {
        const fn = onFileRef.current;
        closeCamera();
        if (fn) void Promise.resolve(fn(file));
      }}
      onRequestLegacyPicker={() => {
        closeCamera();
        window.setTimeout(() => cameraInputRef.current?.click(), 50);
      }}
    />
  );

  return {
    openCamera,
    closeCamera,
    cameraOpen: open,
    cameraInputRef,
    cameraModal,
  };
}
