"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AppImagePickCameraButtons } from "./AppImagePickCameraButtons";
import { useAppCameraCapture } from "./useAppCameraCapture";
import { cn } from "@/lib/cn";

export type AppShopLogoFieldProps = {
  logoUrl: string | null;
  /** ตัวอักษรแสดงเมื่อยังไม่มีโลโก้ */
  fallbackLabel?: string;
  /** POST multipart — ต้องคืน `{ imageUrl: string }` เมื่อสำเร็จ */
  uploadUrl: string;
  onLogoUrlChange: (url: string) => void;
  className?: string;
  labels?: { gallery?: string; camera?: string };
  buttonClassName?: string;
  galleryButtonClassName?: string;
  cameraButtonClassName?: string;
};

export function AppShopLogoField({
  logoUrl,
  fallbackLabel = "?",
  uploadUrl,
  onLogoUrlChange,
  className,
  labels,
  buttonClassName,
  galleryButtonClassName,
  cameraButtonClassName,
}: AppShopLogoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายโลโก้ร้าน" });

  async function upload(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !json.imageUrl) {
        throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      }
      onLogoUrlChange(json.imageUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  const initial = (fallbackLabel.trim() || "?").slice(0, 1).toUpperCase();

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={72}
          height={72}
          className="h-[72px] w-[72px] rounded-2xl object-cover ring-2 ring-white"
        />
      ) : (
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#ede9ff] text-lg font-black text-[#4d47b6]">
          {initial}
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-[#1e1b4b]">โลโก้ร้าน</p>
        <p className="mt-0.5 text-xs text-[#66638c]">แสดงบนโปสเตอร์ QR</p>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <AppImagePickCameraButtons
          className="mt-2 justify-start"
          busy={uploading}
          onPickGallery={() => galleryRef.current?.click()}
          onPickCamera={() => openCamera((file) => void upload(file))}
          labels={{ gallery: labels?.gallery ?? "เลือกโลโก้", camera: labels?.camera ?? "ถ่ายโลโก้" }}
          buttonClassName={buttonClassName}
          galleryButtonClassName={galleryButtonClassName}
          cameraButtonClassName={cameraButtonClassName}
        />
        {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
      </div>
      {cameraModal}
    </div>
  );
}
