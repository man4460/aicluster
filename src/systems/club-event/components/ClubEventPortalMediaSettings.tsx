"use client";

import { useRef, useState, type ChangeEvent } from "react";
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
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { clubEventFieldClass, clubEventOutlineButtonClass } from "@/systems/club-event/lib/ui-tokens";

const UPLOAD = "/api/club-event/session/images/upload";
const GALLERY_MAX = 12;
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

type Props = {
  bannerUrl: string;
  gallery: string[];
  facebookUrl: string;
  mapUrl: string;
  contactLine: string;
  onBannerUrlChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  onFacebookUrlChange: (url: string) => void;
  onMapUrlChange: (url: string) => void;
  onContactLineChange: (value: string) => void;
  disabled?: boolean;
};

export function ClubEventPortalMediaSettings({
  bannerUrl,
  gallery,
  facebookUrl,
  mapUrl,
  contactLine,
  onBannerUrlChange,
  onGalleryChange,
  onFacebookUrlChange,
  onMapUrlChange,
  onContactLineChange,
  disabled = false,
}: Props) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bannerGalleryRef = useRef<HTMLInputElement>(null);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const bannerCamera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์" });
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปแกลเลอรี" });
  const lb = useAppImageLightbox();

  async function uploadFile(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch(UPLOAD, { method: "POST", body: fd, credentials: "include" });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดไม่สำเร็จ");
    }
    return j.imageUrl;
  }

  async function onPickBanner(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadBusy(true);
    setErr(null);
    try {
      onBannerUrlChange(await uploadFile(file));
    } catch (error) {
      setErr(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  async function onPickGallery(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (gallery.length >= GALLERY_MAX) {
      setErr(`แกลเลอรีสูงสุด ${GALLERY_MAX} รูป`);
      return;
    }
    setUploadBusy(true);
    setErr(null);
    try {
      const url = await uploadFile(file);
      onGalleryChange([...gallery, url].slice(0, GALLERY_MAX));
    } catch (error) {
      setErr(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#5f5a8a]">
        ปรับแต่งหน้าเว็บสาธารณะของชมรม — แบนเนอร์ · แกลเลอรี · LINE · Facebook · แผนที่ (โครงเดียวกับแม่แบบพอร์ทัล)
      </p>
      {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}

      <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
        <p className="text-xs font-black text-[#4d47b6]">แบนเนอร์หน้าเว็บ</p>
        {bannerUrl ? (
          <div className="flex flex-wrap items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="แบนเนอร์" className="h-24 max-w-full rounded-xl object-cover ring-1 ring-slate-200" />
            <button
              type="button"
              disabled={disabled || uploadBusy}
              className={cn(clubEventOutlineButtonClass, "text-rose-700")}
              onClick={() => onBannerUrlChange("")}
            >
              ลบแบนเนอร์
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#8b87b8]">ยังไม่มีแบนเนอร์ — อัปโหลดหรือถ่ายรูป</p>
        )}
        <AppImagePickCameraButtons
          disabled={disabled || uploadBusy}
          onPickGallery={() => bannerGalleryRef.current?.click()}
          onPickCamera={() =>
            bannerCamera.openCamera((file) => {
              void (async () => {
                setUploadBusy(true);
                setErr(null);
                try {
                  onBannerUrlChange(await uploadFile(file));
                } catch (error) {
                  setErr(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })();
            })
          }
        />
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
        <p className="text-xs font-black text-[#4d47b6]">แกลเลอรี ({gallery.length}/{GALLERY_MAX})</p>
        {gallery.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {gallery.map((url) => (
              <li key={url} className="relative">
                <AppImageThumb src={url} alt="แกลเลอรี" onOpen={() => lb.open(url)} />
                <button
                  type="button"
                  className={cn(assetRowRemoveIconButtonClass, "absolute -right-1 -top-1")}
                  aria-label="ลบรูป"
                  disabled={disabled || uploadBusy}
                  onClick={() => onGalleryChange(gallery.filter((u) => u !== url))}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#8b87b8]">ยังไม่มีรูปแกลเลอรี</p>
        )}
        <AppImagePickCameraButtons
          disabled={disabled || uploadBusy || gallery.length >= GALLERY_MAX}
          onPickGallery={() => galleryPickRef.current?.click()}
          onPickCamera={() =>
            galleryCamera.openCamera((file) => {
              void (async () => {
                if (gallery.length >= GALLERY_MAX) return;
                setUploadBusy(true);
                setErr(null);
                try {
                  const url = await uploadFile(file);
                  onGalleryChange([...gallery, url].slice(0, GALLERY_MAX));
                } catch (error) {
                  setErr(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })();
            })
          }
        />
      </div>

      <label className={labelClass}>
        LINE ID / ลิงก์ LINE
        <input
          className={cn(clubEventFieldClass, "mt-1")}
          value={contactLine}
          disabled={disabled}
          placeholder="@club-line"
          onChange={(e) => onContactLineChange(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        Facebook URL
        <input
          className={cn(clubEventFieldClass, "mt-1")}
          value={facebookUrl}
          disabled={disabled}
          placeholder="https://facebook.com/..."
          onChange={(e) => onFacebookUrlChange(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        ลิงก์แผนที่ Google Maps
        <input
          className={cn(clubEventFieldClass, "mt-1")}
          value={mapUrl}
          disabled={disabled}
          placeholder="https://maps.google.com/..."
          onChange={(e) => onMapUrlChange(e.target.value)}
        />
      </label>

      <AppGalleryCameraFileInputs
        galleryInputRef={bannerGalleryRef}
        cameraInputRef={bannerCamera.cameraInputRef}
        onChange={onPickBanner}
      />
      <AppGalleryCameraFileInputs
        galleryInputRef={galleryPickRef}
        cameraInputRef={galleryCamera.cameraInputRef}
        onChange={onPickGallery}
      />
      {bannerCamera.cameraModal}
      {galleryCamera.cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สื่อพอร์ทัล" />
    </div>
  );
}
