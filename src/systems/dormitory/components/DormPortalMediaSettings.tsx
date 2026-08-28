"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
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
import { DormPortalRemoteImage } from "@/systems/dormitory/components/DormPortalRemoteImage";
import {
  DORMITORY_PORTAL_GALLERY_MAX,
  DORMITORY_PORTAL_SAMPLE_BANNER,
  DORMITORY_PORTAL_SAMPLE_GALLERY,
  probePortalImageUrl,
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
  const [uploadBusy, setUploadBusy] = useState(false);
  const [checkBusy, setCheckBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(() => new Set());
  const [bannerBroken, setBannerBroken] = useState(false);
  const bannerGalleryRef = useRef<HTMLInputElement>(null);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const bannerCamera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์หอพัก" });
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปหอพัก" });
  const lb = useAppImageLightbox();

  const runGalleryCheck = useCallback(async (urls: string[]) => {
    setCheckBusy(true);
    try {
      const broken = new Set<string>();
      await Promise.all(
        urls.map(async (url) => {
          if (!(await probePortalImageUrl(url))) broken.add(url);
        }),
      );
      setBrokenUrls(broken);
      if (bannerUrl.trim()) {
        setBannerBroken(!(await probePortalImageUrl(bannerUrl)));
      } else {
        setBannerBroken(false);
      }
    } finally {
      setCheckBusy(false);
    }
  }, [bannerUrl]);

  useEffect(() => {
    void runGalleryCheck(gallery);
  }, [gallery, runGalleryCheck]);

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
    setUploadBusy(true);
    setErr(null);
    try {
      onBannerUrlChange(await uploadFile(file));
      setBannerBroken(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดแบนเนอร์ไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  async function onPickGallery(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length || disabled) return;
    const slots = DORMITORY_PORTAL_GALLERY_MAX - gallery.length;
    if (slots <= 0) {
      setErr(`อัปโหลดได้ไม่เกิน ${DORMITORY_PORTAL_GALLERY_MAX} รูป`);
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
      onGalleryChange([...gallery, ...added].slice(0, DORMITORY_PORTAL_GALLERY_MAX));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  const busy = disabled || uploadBusy || checkBusy;
  const brokenGallery = gallery.filter((url) => brokenUrls.has(url));
  const previewBanner = bannerUrl.trim() || DORMITORY_PORTAL_SAMPLE_BANNER;

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}

      <div className="space-y-2">
        <p className={dormFormLabelClass}>แบนเนอร์เว็บลูกค้า</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => lb.open(previewBanner)}
            className={cn(
              "block w-full max-w-md overflow-hidden rounded-2xl ring-2",
              bannerBroken && bannerUrl.trim()
                ? "ring-rose-300"
                : "ring-white/60",
            )}
            aria-label="ดูแบนเนอร์"
          >
            <DormPortalRemoteImage
              src={previewBanner}
              alt="แบนเนอร์"
              className="h-28 w-full object-cover object-center sm:h-36"
              onFailed={() => {
                if (bannerUrl.trim()) setBannerBroken(true);
              }}
              onLoaded={() => setBannerBroken(false)}
            />
          </button>
          {bannerBroken && bannerUrl.trim() ? (
            <span className="absolute left-2 top-2 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">
              รูปเสีย
            </span>
          ) : null}
        </div>
        {bannerBroken && bannerUrl.trim() ? (
          <p className="text-xs font-semibold text-rose-600">แบนเนอร์โหลดไม่ได้ — อัปโหลดใหม่หรือใช้ตัวอย่าง</p>
        ) : null}
        <AppGalleryCameraFileInputs
          galleryInputRef={bannerGalleryRef}
          cameraInputRef={bannerCamera.cameraInputRef}
          onChange={onPickBanner}
        />
        <div className="flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            disabled={busy}
            busy={uploadBusy}
            onPickGallery={() => bannerGalleryRef.current?.click()}
            onPickCamera={() =>
              bannerCamera.openCamera(async (file) => {
                setUploadBusy(true);
                setErr(null);
                try {
                  onBannerUrlChange(await uploadFile(file));
                  setBannerBroken(false);
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })
            }
            labels={{ gallery: "เลือกแบนเนอร์", camera: "ถ่ายแบนเนอร์" }}
          />
          {!bannerUrl.trim() ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onBannerUrlChange(DORMITORY_PORTAL_SAMPLE_BANNER);
                setBannerBroken(false);
              }}
              className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-xs font-bold")}
            >
              ใส่แบนเนอร์ตัวอย่าง
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onBannerUrlChange("");
                setBannerBroken(false);
              }}
              className={cn(
                appTemplateOutlineButtonClass,
                "min-h-10 rounded-xl px-3 text-xs font-bold text-rose-600",
              )}
            >
              ลบแบนเนอร์
            </button>
          )}
        </div>
        {bannerCamera.cameraModal}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={dormFormLabelClass}>
            แกลเลอรี ({gallery.length}/{DORMITORY_PORTAL_GALLERY_MAX})
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy || gallery.length === 0}
              onClick={() => void runGalleryCheck(gallery)}
              className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
            >
              {checkBusy ? "กำลังตรวจ…" : "ตรวจรูปใหม่"}
            </button>
            {brokenGallery.length > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onGalleryChange(gallery.filter((url) => !brokenUrls.has(url)))}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-9 rounded-xl px-3 text-xs font-bold text-rose-600",
                )}
              >
                ลบรูปเสีย ({brokenGallery.length})
              </button>
            ) : null}
          </div>
        </div>
        {brokenGallery.length > 0 ? (
          <p className="text-xs font-semibold text-amber-800">
            พบรูปเสีย {brokenGallery.length} รูป — จะไม่แสดงบนเว็บลูกค้า
          </p>
        ) : null}

        {gallery.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            {gallery.map((url, idx) => {
              const broken = brokenUrls.has(url);
              return (
                <li key={`${url}-${idx}`} className="relative">
                  <AppImageThumb
                    src={url}
                    alt={`ภาพหอพัก ${idx + 1}`}
                    onOpen={() => lb.openGallery(gallery, idx)}
                    className={cn("h-20 w-full", broken && "ring-2 ring-rose-400")}
                  />
                  {broken ? (
                    <span className="pointer-events-none absolute left-1 top-1 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                      รูปเสีย
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={cn(assetRowRemoveIconButtonClass, "absolute -right-1 -top-1 h-8 w-8 min-h-0 min-w-0")}
                    aria-label={`ลบรูปที่ ${idx + 1}`}
                    title="ลบ"
                    disabled={busy}
                    onClick={() => onGalleryChange(gallery.filter((_, i) => i !== idx))}
                  >
                    <IconRowRemove className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            {DORMITORY_PORTAL_SAMPLE_GALLERY.map((url, idx) => (
              <li key={`sample-${idx}`}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onGalleryChange([...DORMITORY_PORTAL_SAMPLE_GALLERY])}
                  className="block w-full overflow-hidden rounded-xl opacity-90 ring-1 ring-dashed ring-[#5b61ff]/35"
                  aria-label="ใส่รูปตัวอย่างทั้งชุด"
                >
                  <DormPortalRemoteImage src={url} alt="" className="h-20 w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <AppGalleryCameraFileInputs
          galleryInputRef={galleryPickRef}
          cameraInputRef={galleryCamera.cameraInputRef}
          onChange={onPickGallery}
          galleryMultiple
        />
        <div className="flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            disabled={busy || gallery.length >= DORMITORY_PORTAL_GALLERY_MAX}
            busy={uploadBusy}
            onPickGallery={() => galleryPickRef.current?.click()}
            onPickCamera={() =>
              galleryCamera.openCamera(async (file) => {
                if (gallery.length >= DORMITORY_PORTAL_GALLERY_MAX) {
                  setErr(`อัปโหลดได้ไม่เกิน ${DORMITORY_PORTAL_GALLERY_MAX} รูป`);
                  return;
                }
                setUploadBusy(true);
                setErr(null);
                try {
                  const url = await uploadFile(file);
                  onGalleryChange([...gallery, url].slice(0, DORMITORY_PORTAL_GALLERY_MAX));
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })
            }
            labels={{ gallery: "เลือกรูป (หลายไฟล์)", camera: "ถ่ายรูป" }}
          />
          {gallery.length === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onGalleryChange([...DORMITORY_PORTAL_SAMPLE_GALLERY])}
              className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-xs font-bold")}
            >
              ใส่รูปตัวอย่าง
            </button>
          ) : null}
        </div>
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

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปหอพัก"
      />
    </div>
  );
}
