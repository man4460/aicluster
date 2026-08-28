"use client";

import { useRef, type ChangeEvent } from "react";
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
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  DORMITORY_PORTAL_GALLERY_MAX,
  DORMITORY_PORTAL_SAMPLE_BANNER,
  DORMITORY_PORTAL_SAMPLE_GALLERY,
} from "@/systems/dormitory/lib/portal-media";
import { dormFieldClass, dormFormLabelClass } from "@/systems/dormitory/lib/ui-tokens";

type Props = {
  bannerUrl: string;
  gallery: string[];
  address: string;
  contactLine: string;
  facebookUrl: string;
  mapUrl: string;
  onBannerUrlChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  onAddressChange: (v: string) => void;
  onContactLineChange: (v: string) => void;
  onFacebookUrlChange: (v: string) => void;
  onMapUrlChange: (v: string) => void;
  disabled?: boolean;
};

export function DormPortalMediaSettings({
  bannerUrl,
  gallery,
  address,
  contactLine,
  facebookUrl,
  mapUrl,
  onBannerUrlChange,
  onGalleryChange,
  onAddressChange,
  onContactLineChange,
  onFacebookUrlChange,
  onMapUrlChange,
  disabled = false,
}: Props) {
  const bannerGalleryRef = useRef<HTMLInputElement>(null);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const bannerCamera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์หอพัก" });
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปหอพัก" });
  const lb = useAppImageLightbox();

  async function uploadFile(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch("/api/dorm/upload", { method: "POST", body: fd, credentials: "include" });
    const j = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || typeof j?.url !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดไม่สำเร็จ");
    }
    return j.url;
  }

  async function onPickBanner(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    const url = await uploadFile(file);
    onBannerUrlChange(url);
  }

  async function onPickGallery(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length || disabled) return;
    const slots = DORMITORY_PORTAL_GALLERY_MAX - gallery.length;
    if (slots <= 0) return;
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, slots)) {
      added.push(await uploadFile(file));
    }
    onGalleryChange([...gallery, ...added]);
  }

  const previewBanner = bannerUrl.trim() || DORMITORY_PORTAL_SAMPLE_BANNER;
  const previewGallery = gallery.length > 0 ? gallery : [...DORMITORY_PORTAL_SAMPLE_GALLERY];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={dormFormLabelClass}>แบนเนอร์เว็บลูกค้า</p>
        <AppImageThumb
          src={previewBanner}
          alt="แบนเนอร์"
          className="h-28 w-full max-w-md rounded-2xl"
          onOpen={() => lb.open(previewBanner)}
        />
        <AppGalleryCameraFileInputs
          galleryInputRef={bannerGalleryRef}
          cameraInputRef={bannerCamera.cameraInputRef}
          onChange={onPickBanner}
        />
        <AppImagePickCameraButtons
          disabled={disabled}
          onPickGallery={() => bannerGalleryRef.current?.click()}
          onPickCamera={() =>
            bannerCamera.openCamera(async (file) => {
              const url = await uploadFile(file);
              onBannerUrlChange(url);
            })
          }
        />
        {bannerCamera.cameraModal}
      </div>

      <div className="space-y-2">
        <p className={dormFormLabelClass}>แกลเลอรี ({gallery.length}/{DORMITORY_PORTAL_GALLERY_MAX})</p>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
          {previewGallery.map((url) => (
            <div key={url} className="relative">
              <AppImageThumb src={url} alt="แกลเลอรี" className="h-20 w-full" onOpen={() => lb.open(url)} />
              {gallery.includes(url) ? (
                <button
                  type="button"
                  className={cn(assetRowRemoveIconButtonClass, "absolute -right-1 -top-1 h-8 w-8 min-h-0 min-w-0")}
                  aria-label="ลบรูป"
                  title="ลบ"
                  disabled={disabled}
                  onClick={() => onGalleryChange(gallery.filter((u) => u !== url))}
                >
                  <IconRowRemove className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <AppGalleryCameraFileInputs
          galleryInputRef={galleryPickRef}
          cameraInputRef={galleryCamera.cameraInputRef}
          onChange={onPickGallery}
          galleryMultiple
        />
        <AppImagePickCameraButtons
          disabled={disabled || gallery.length >= DORMITORY_PORTAL_GALLERY_MAX}
          onPickGallery={() => galleryPickRef.current?.click()}
          onPickCamera={() =>
            galleryCamera.openCamera(async (file) => {
              if (gallery.length >= DORMITORY_PORTAL_GALLERY_MAX) return;
              const url = await uploadFile(file);
              onGalleryChange([...gallery, url]);
            })
          }
        />
        {galleryCamera.cameraModal}
      </div>

      <label className="block space-y-1">
        <span className={dormFormLabelClass}>LINE ID / ลิงก์ LINE</span>
        <input
          className={dormFieldClass}
          value={contactLine}
          disabled={disabled}
          onChange={(e) => onContactLineChange(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className={dormFormLabelClass}>Facebook</span>
        <input
          className={dormFieldClass}
          value={facebookUrl}
          disabled={disabled}
          onChange={(e) => onFacebookUrlChange(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className={dormFormLabelClass}>แผนที่ (ลิงก์ Google Maps)</span>
        <input
          className={dormFieldClass}
          value={mapUrl}
          disabled={disabled}
          onChange={(e) => onMapUrlChange(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className={dormFormLabelClass}>ที่อยู่ (แสดงบนเว็บลูกค้า)</span>
        <textarea
          className={cn(dormFieldClass, "min-h-[72px]")}
          value={address}
          disabled={disabled}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </label>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปหอพัก" />
    </div>
  );
}
