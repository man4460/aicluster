"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BUILDING_POS_PORTAL_GALLERY_MAX } from "@/lib/building-pos/portal-booking";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

const SAMPLE_BANNER =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80";
const SAMPLE_GALLERY = [
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
];

type Props = {
  bannerUrl: string;
  gallery: string[];
  address: string;
  facebookUrl: string;
  mapUrl: string;
  contactLine: string;
  onBannerUrlChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  onAddressChange: (value: string) => void;
  onFacebookUrlChange: (url: string) => void;
  onMapUrlChange: (url: string) => void;
  onContactLineChange: (value: string) => void;
  disabled?: boolean;
};

const fieldClass =
  "app-input mt-1 w-full rounded-xl border border-white/70 bg-white/85 font-semibold text-[#1e1b4b]";
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

export function BuildingPosPortalMediaSettings({
  bannerUrl,
  gallery,
  address,
  facebookUrl,
  mapUrl,
  contactLine,
  onBannerUrlChange,
  onGalleryChange,
  onAddressChange,
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
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปร้าน" });
  const lb = useAppImageLightbox();

  async function uploadFile(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch("/api/building-pos/session/images/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    const url = j?.imageUrl;
    if (!res.ok || typeof url !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดไม่สำเร็จ");
    }
    return url;
  }

  async function onPickBanner(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadBusy(true);
    setErr(null);
    try {
      onBannerUrlChange(await uploadFile(file));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดแบนเนอร์ไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  async function onPickGallery(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;
    const slots = BUILDING_POS_PORTAL_GALLERY_MAX - gallery.length;
    if (slots <= 0) {
      setErr(`อัปโหลดได้ไม่เกิน ${BUILDING_POS_PORTAL_GALLERY_MAX} รูป`);
      return;
    }
    setUploadBusy(true);
    setErr(null);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, slots)) {
        if (!file.type.startsWith("image/")) continue;
        added.push(await uploadFile(file));
      }
      onGalleryChange([...gallery, ...added].slice(0, BUILDING_POS_PORTAL_GALLERY_MAX));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  const busy = disabled || uploadBusy;

  return (
    <div className="space-y-5 rounded-2xl border border-[#ecebff] bg-[#faf9ff]/80 p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">
        เว็บจองลูกค้า · สื่อและลิงก์
      </p>
      {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />

      <div>
        <p className="text-xs font-bold text-[#4d47b6]">แบนเนอร์</p>
        <AppGalleryCameraFileInputs
          galleryInputRef={bannerGalleryRef}
          cameraInputRef={bannerCamera.cameraInputRef}
          onChange={(e) => void onPickBanner(e)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            onPickGallery={() => bannerGalleryRef.current?.click()}
            onPickCamera={() =>
              bannerCamera.openCamera(async (file) => {
                setUploadBusy(true);
                setErr(null);
                try {
                  onBannerUrlChange(await uploadFile(file));
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })
            }
            disabled={busy}
            busy={uploadBusy}
            labels={{ gallery: "เลือกแบนเนอร์", camera: "ถ่ายแบนเนอร์" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onBannerUrlChange(SAMPLE_BANNER)}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold")}
          >
            ใช้แบนเนอร์ตัวอย่าง
          </button>
          {bannerUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onBannerUrlChange("")}
              className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold text-rose-600")}
            >
              ลบแบนเนอร์
            </button>
          ) : null}
        </div>
        {bannerCamera.cameraModal}
        {bannerUrl ? (
          <button
            type="button"
            onClick={() => lb.open(bannerUrl)}
            className="mt-3 block w-full overflow-hidden rounded-2xl ring-1 ring-white/60"
            aria-label="ดูแบนเนอร์เต็ม"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="แบนเนอร์" className="h-36 w-full object-cover sm:h-44" />
          </button>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-bold text-[#4d47b6]">
          แกลเลอรี ({gallery.length}/{BUILDING_POS_PORTAL_GALLERY_MAX})
        </p>
        <input
          ref={galleryPickRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => void onPickGallery(e)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            onPickGallery={() => galleryPickRef.current?.click()}
            onPickCamera={() =>
              galleryCamera.openCamera(async (file) => {
                if (gallery.length >= BUILDING_POS_PORTAL_GALLERY_MAX) {
                  setErr(`อัปโหลดได้ไม่เกิน ${BUILDING_POS_PORTAL_GALLERY_MAX} รูป`);
                  return;
                }
                setUploadBusy(true);
                setErr(null);
                try {
                  const url = await uploadFile(file);
                  onGalleryChange([...gallery, url].slice(0, BUILDING_POS_PORTAL_GALLERY_MAX));
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })
            }
            disabled={busy || gallery.length >= BUILDING_POS_PORTAL_GALLERY_MAX}
            busy={uploadBusy}
            labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onGalleryChange([...SAMPLE_GALLERY])}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold")}
          >
            ใส่รูปตัวอย่าง
          </button>
        </div>
        {galleryCamera.cameraModal}
        {gallery.length ? (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {gallery.map((url, idx) => (
              <li key={`${url}-${idx}`} className="relative">
                <AppImageThumb src={url} alt={`ภาพร้าน ${idx + 1}`} onOpen={() => lb.open(url)} className="h-20 w-full" />
                <button
                  type="button"
                  onClick={() => onGalleryChange(gallery.filter((_, i) => i !== idx))}
                  className={cn(assetRowRemoveIconButtonClass, "absolute -right-1 -top-1 !min-h-[32px] !min-w-[32px] rounded-full shadow-sm")}
                  aria-label={`ลบรูปที่ ${idx + 1}`}
                  title="ลบรูป"
                >
                  <IconRowRemove className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={cn(labelClass, "sm:col-span-2")}>
          ที่อยู่ร้าน
          <textarea
            className={cn(fieldClass, "min-h-[72px] resize-y")}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            disabled={busy}
            rows={2}
          />
        </label>
        <label className={labelClass}>
          LINE ID
          <input className={fieldClass} value={contactLine} onChange={(e) => onContactLineChange(e.target.value)} disabled={busy} />
        </label>
        <label className={labelClass}>
          Facebook URL
          <input className={fieldClass} value={facebookUrl} onChange={(e) => onFacebookUrlChange(e.target.value)} disabled={busy} />
        </label>
        <label className={cn(labelClass, "sm:col-span-2")}>
          ลิงก์แผนที่
          <input className={fieldClass} value={mapUrl} onChange={(e) => onMapUrlChange(e.target.value)} disabled={busy} />
        </label>
      </div>
    </div>
  );
}
