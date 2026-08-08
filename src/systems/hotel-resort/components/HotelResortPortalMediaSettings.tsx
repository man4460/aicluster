"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
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
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { hotelResortFetchErrorMessage } from "@/systems/hotel-resort/lib/client-data";
import {
  HOTEL_RESORT_PORTAL_GALLERY_MAX,
  HOTEL_RESORT_PORTAL_SAMPLE_BANNER,
  HOTEL_RESORT_PORTAL_SAMPLE_GALLERY,
} from "@/systems/hotel-resort/lib/portal-media";
import {
  hotelResortFieldClass,
  hotelResortSectionRadiusClass,
  hotelResortSuccessBannerClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

export function HotelResortPortalMediaSettings({
  initialBannerUrl = null,
  initialGallery = [],
}: {
  initialBannerUrl?: string | null;
  initialGallery?: string[];
}) {
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? "");
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const bannerGalleryRef = useRef<HTMLInputElement>(null);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปโรงแรม" });
  const bannerCamera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์" });
  const lb = useAppImageLightbox();

  async function uploadFile(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch("/api/hotel-resort/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const j = (await res.json().catch(() => null)) as
      | { url?: string; imageUrl?: string; error?: string }
      | null;
    const url = j?.url ?? j?.imageUrl;
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
      const url = await uploadFile(file);
      setBannerUrl(url);
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
    const slots = HOTEL_RESORT_PORTAL_GALLERY_MAX - gallery.length;
    if (slots <= 0) {
      setErr(`อัปโหลดได้ไม่เกิน ${HOTEL_RESORT_PORTAL_GALLERY_MAX} รูป`);
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
      setGallery((g) => [...g, ...added].slice(0, HOTEL_RESORT_PORTAL_GALLERY_MAX));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/hotel-resort/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          portalBannerUrl: bannerUrl.trim() || null,
          portalGallery: gallery,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as {
        profile?: { portalBannerUrl?: string | null; portalGallery?: string[] };
      };
      if (j.profile) {
        setBannerUrl(j.profile.portalBannerUrl ?? "");
        setGallery(j.profile.portalGallery ?? []);
      }
      setMsg("บันทึกรูปหน้าลิงก์ลูกค้าแล้ว");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title="รูปหน้าเว็บลิงก์ลูกค้า"
        description="แบนเนอร์และภาพรวมโรงแรม — แสดงบนหน้าตรวจสอบสถานะการจอง"
      />
      <div className="mt-4 space-y-5">
        {err ? <HotelResortErrorBanner message={err} /> : null}
        {msg ? <p className={hotelResortSuccessBannerClass}>{msg}</p> : null}

        <div>
          <p className="text-xs font-bold text-[#4d47b6]">แบนเนอร์</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#8b87b8]">
            รูปกว้างด้านบนหน้าลิงก์ลูกค้า — ระบบย่อขนาดให้อัตโนมัติ
          </p>
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
                    setBannerUrl(await uploadFile(file));
                  } catch (e2) {
                    setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                  } finally {
                    setUploadBusy(false);
                  }
                })
              }
              disabled={busy || uploadBusy}
              busy={uploadBusy}
              labels={{ gallery: "เลือกแบนเนอร์", camera: "ถ่ายแบนเนอร์" }}
            />
            {!bannerUrl ? (
              <button
                type="button"
                disabled={busy || uploadBusy}
                onClick={() => setBannerUrl(HOTEL_RESORT_PORTAL_SAMPLE_BANNER)}
                className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold")}
              >
                ใส่แบนเนอร์ตัวอย่าง
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || uploadBusy}
                onClick={() => setBannerUrl("")}
                className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold text-rose-600")}
              >
                ลบแบนเนอร์
              </button>
            )}
          </div>
          {bannerCamera.cameraModal}
          {bannerUrl ? (
            <button
              type="button"
              onClick={() => lb.open(bannerUrl)}
              className="mt-3 block w-full overflow-hidden rounded-[1.25rem] ring-1 ring-white/60"
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
            <div className={cn(hotelResortFieldClass, "mt-3 flex h-28 items-center justify-center text-xs font-semibold text-[#8b87b8]")}>
              ยังไม่มีแบนเนอร์
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-[#4d47b6]">
            รูปภาพรวมโรงแรม ({gallery.length}/{HOTEL_RESORT_PORTAL_GALLERY_MAX})
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[#8b87b8]">
            แกลเลอรีด้านล่างหน้าลิงก์ลูกค้า — สูงสุด {HOTEL_RESORT_PORTAL_GALLERY_MAX} รูป
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
                  if (gallery.length >= HOTEL_RESORT_PORTAL_GALLERY_MAX) {
                    setErr(`อัปโหลดได้ไม่เกิน ${HOTEL_RESORT_PORTAL_GALLERY_MAX} รูป`);
                    return;
                  }
                  setUploadBusy(true);
                  setErr(null);
                  try {
                    const url = await uploadFile(file);
                    setGallery((g) => [...g, url].slice(0, HOTEL_RESORT_PORTAL_GALLERY_MAX));
                  } catch (e2) {
                    setErr(e2 instanceof Error ? e2.message : "อัปโหลดไม่สำเร็จ");
                  } finally {
                    setUploadBusy(false);
                  }
                })
              }
              disabled={busy || uploadBusy || gallery.length >= HOTEL_RESORT_PORTAL_GALLERY_MAX}
              busy={uploadBusy}
              labels={{ gallery: "เลือกรูป (หลายไฟล์ได้)", camera: "ถ่ายรูป" }}
            />
            {gallery.length === 0 ? (
              <button
                type="button"
                disabled={busy || uploadBusy}
                onClick={() => setGallery([...HOTEL_RESORT_PORTAL_SAMPLE_GALLERY])}
                className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-3 text-xs font-bold")}
              >
                ใส่รูปตัวอย่าง
              </button>
            ) : null}
          </div>
          {galleryCamera.cameraModal}
          {gallery.length ? (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((url, idx) => (
                <li key={`${url}-${idx}`} className="relative">
                  <AppImageThumb
                    src={url}
                    alt={`ภาพรวม ${idx + 1}`}
                    onOpen={() => lb.openGallery(gallery, idx)}
                    className="h-20 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setGallery((g) => g.filter((_, i) => i !== idx))}
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
            <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีรูปภาพรวม</p>
          )}
        </div>

        <button
          type="button"
          disabled={busy || uploadBusy}
          onClick={() => void save()}
          className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold disabled:opacity-50"
        >
          {busy ? "กำลังบันทึก…" : "บันทึกรูปหน้าลิงก์"}
        </button>
      </div>

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปพอร์ทัล"
      />
    </AppDashboardSection>
  );
}
