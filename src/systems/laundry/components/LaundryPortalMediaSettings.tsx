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
import { laundryCompactOutlineButtonClass, laundryFieldClass } from "@/systems/laundry/lib/ui-tokens";
import {
  LAUNDRY_PORTAL_GALLERY_MAX,
  LAUNDRY_PORTAL_SAMPLE_BANNER,
  LAUNDRY_PORTAL_SAMPLE_GALLERY,
} from "@/systems/laundry/lib/portal-media";

const LAUNDRY_IMAGE_UPLOAD = "/api/laundry/session/images/upload";

type Props = {
  bannerUrl: string;
  gallery: string[];
  facebookUrl: string;
  mapUrl: string;
  contactLine: string;
  shopLat: number | null;
  shopLng: number | null;
  pickupFeePerKmBaht: number | null;
  onBannerUrlChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  onFacebookUrlChange: (url: string) => void;
  onMapUrlChange: (url: string) => void;
  onContactLineChange: (value: string) => void;
  onShopLatChange: (value: number | null) => void;
  onShopLngChange: (value: number | null) => void;
  onPickupFeePerKmBahtChange: (value: number | null) => void;
  disabled?: boolean;
};

const fieldClass = cn(laundryFieldClass, "mt-1 border-white/70 bg-white/85");
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

export function LaundryPortalMediaSettings({
  bannerUrl,
  gallery,
  facebookUrl,
  mapUrl,
  contactLine,
  shopLat,
  shopLng,
  pickupFeePerKmBaht,
  onBannerUrlChange,
  onGalleryChange,
  onFacebookUrlChange,
  onMapUrlChange,
  onContactLineChange,
  onShopLatChange,
  onShopLngChange,
  onPickupFeePerKmBahtChange,
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
    const res = await fetch(LAUNDRY_IMAGE_UPLOAD, {
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
    const slots = LAUNDRY_PORTAL_GALLERY_MAX - gallery.length;
    if (slots <= 0) {
      setErr(`อัปโหลดได้ไม่เกิน ${LAUNDRY_PORTAL_GALLERY_MAX} รูป`);
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
      onGalleryChange([...gallery, ...added].slice(0, LAUNDRY_PORTAL_GALLERY_MAX));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  const busy = disabled || uploadBusy;

  return (
    <div className="space-y-5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">
        เว็บรับผ้าที่บ้าน · สื่อและลิงก์
      </p>
      {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}

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
            buttonClassName={laundryCompactOutlineButtonClass}
          />
          {!bannerUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onBannerUrlChange(LAUNDRY_PORTAL_SAMPLE_BANNER)}
              className={laundryCompactOutlineButtonClass}
            >
              ใส่แบนเนอร์ตัวอย่าง
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => onBannerUrlChange(LAUNDRY_PORTAL_SAMPLE_BANNER)}
                className={laundryCompactOutlineButtonClass}
              >
                ใช้แบนเนอร์ตัวอย่าง
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onBannerUrlChange("")}
                className={cn(laundryCompactOutlineButtonClass, "text-rose-600")}
              >
                ลบแบนเนอร์
              </button>
            </>
          )}
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
            <img
              src={bannerUrl}
              alt="แบนเนอร์"
              className="h-36 w-full object-cover object-center sm:h-44"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onBannerUrlChange(LAUNDRY_PORTAL_SAMPLE_BANNER)}
            className="mt-3 block w-full overflow-hidden rounded-2xl ring-1 ring-dashed ring-[#5b61ff]/35"
            aria-label="ใส่แบนเนอร์ตัวอย่าง"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LAUNDRY_PORTAL_SAMPLE_BANNER}
              alt="แบนเนอร์ตัวอย่าง"
              className="h-36 w-full object-cover object-center opacity-90 sm:h-44"
            />
            <span className="block bg-[#ecebff]/80 px-3 py-2 text-center text-[11px] font-bold text-[#4d47b6]">
              กดเพื่อใช้แบนเนอร์ตัวอย่าง
            </span>
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-[#4d47b6]">
          แกลเลอรี ({gallery.length}/{LAUNDRY_PORTAL_GALLERY_MAX})
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
        <input
          ref={galleryCamera.cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
                if (gallery.length >= LAUNDRY_PORTAL_GALLERY_MAX) {
                  setErr(`อัปโหลดได้ไม่เกิน ${LAUNDRY_PORTAL_GALLERY_MAX} รูป`);
                  return;
                }
                setUploadBusy(true);
                setErr(null);
                try {
                  const url = await uploadFile(file);
                  onGalleryChange([...gallery, url].slice(0, LAUNDRY_PORTAL_GALLERY_MAX));
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploadBusy(false);
                }
              })
            }
            disabled={busy || gallery.length >= LAUNDRY_PORTAL_GALLERY_MAX}
            busy={uploadBusy}
            labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป" }}
            buttonClassName={laundryCompactOutlineButtonClass}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onGalleryChange([...LAUNDRY_PORTAL_SAMPLE_GALLERY])}
            className={laundryCompactOutlineButtonClass}
          >
            {gallery.length === 0 ? "ใส่รูปตัวอย่าง" : "ใช้รูปตัวอย่างแทน"}
          </button>
        </div>
        {galleryCamera.cameraModal}
        {gallery.length ? (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {gallery.map((url, idx) => (
              <li key={`${url}-${idx}`} className="relative">
                <AppImageThumb
                  src={url}
                  alt={`ภาพร้าน ${idx + 1}`}
                  onOpen={() => lb.openGallery(gallery, idx)}
                  className="h-20 w-full"
                />
                <button
                  type="button"
                  onClick={() => onGalleryChange(gallery.filter((_, i) => i !== idx))}
                  className={cn(
                    assetRowRemoveIconButtonClass,
                    "absolute -right-1 -top-1 !min-h-[32px] !min-w-[32px] rounded-full shadow-sm",
                  )}
                  aria-label={`ลบรูปที่ ${idx + 1}`}
                  title="ลบรูป"
                >
                  <IconRowRemove className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {LAUNDRY_PORTAL_SAMPLE_GALLERY.map((url, idx) => (
              <li key={`sample-${idx}`}>
                <button
                  type="button"
                  onClick={() => onGalleryChange([...LAUNDRY_PORTAL_SAMPLE_GALLERY])}
                  className="block w-full overflow-hidden rounded-xl opacity-90 ring-1 ring-dashed ring-[#5b61ff]/35"
                  aria-label="ใส่รูปตัวอย่างทั้งชุด"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-20 w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          LINE ID
          <input
            className={fieldClass}
            value={contactLine}
            onChange={(e) => onContactLineChange(e.target.value)}
            placeholder="@lineid"
            disabled={busy}
          />
        </label>
        <label className={labelClass}>
          Facebook URL
          <input
            className={fieldClass}
            value={facebookUrl}
            onChange={(e) => onFacebookUrlChange(e.target.value)}
            placeholder="https://facebook.com/…"
            disabled={busy}
          />
        </label>
        <label className={cn(labelClass, "sm:col-span-2")}>
          ลิงก์แผนที่
          <input
            className={fieldClass}
            value={mapUrl}
            onChange={(e) => onMapUrlChange(e.target.value)}
            placeholder="https://maps.google.com/…"
            disabled={busy}
          />
        </label>
      </div>

      <div className="grid gap-4 border-t border-[#ecebff] pt-4 sm:grid-cols-2">
        <label className={labelClass}>
          ละติจูดร้าน
          <input
            type="number"
            step="any"
            className={fieldClass}
            value={shopLat ?? ""}
            onChange={(e) =>
              onShopLatChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="13.7563"
            disabled={busy}
          />
        </label>
        <label className={labelClass}>
          ลองจิจูดร้าน
          <input
            type="number"
            step="any"
            className={fieldClass}
            value={shopLng ?? ""}
            onChange={(e) =>
              onShopLngChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="100.5018"
            disabled={busy}
          />
        </label>
        <label className={cn(labelClass, "sm:col-span-2")}>
          ค่าขนส่งต่อกม. (บาท)
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={pickupFeePerKmBaht ?? ""}
            onChange={(e) =>
              onPickupFeePerKmBahtChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="เว้นว่าง = ไม่คิดอัตโนมัติ"
            disabled={busy}
          />
        </label>
      </div>

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปพอร์ทัล"
      />
    </div>
  );
}
