"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppImagePickCameraButtons,
  AppGalleryCameraFileInputs,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import {
  PARKING_PORTAL_GALLERY_MAX,
  PARKING_PORTAL_SAMPLE_BANNER,
  PARKING_PORTAL_SAMPLE_GALLERY,
} from "@/systems/parking/lib/portal-media";

export function ParkingPortalMediaSettings({
  initialBannerUrl,
  initialGallery,
}: {
  initialBannerUrl: string | null;
  initialGallery: string[];
}) {
  const [banner, setBanner] = useState(initialBannerUrl ?? "");
  const [gallery, setGallery] = useState(initialGallery);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const bannerCamera = useAppCameraCapture({ title: "ถ่ายแบนเนอร์" });
  const galleryCamera = useAppCameraCapture({ title: "ถ่ายรูปบรรยากาศ" });
  const lightbox = useAppImageLightbox();

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", await prepareImageFileForUpload(file));
    const res = await fetch("/api/parking/upload", { method: "POST", body: form });
    const data = await res.json() as { imageUrl?: string; error?: string };
    if (!res.ok || !data.imageUrl) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
    return data.imageUrl;
  }

  async function pickBanner(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try { setBanner(await upload(file)); } catch (e) { setMessage(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  async function pickGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, PARKING_PORTAL_GALLERY_MAX - gallery.length);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await upload(file));
      setGallery((old) => [...old, ...urls].slice(0, PARKING_PORTAL_GALLERY_MAX));
    } catch (e) { setMessage(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/parking/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalBannerUrl: banner || null, portalGalleryJson: gallery }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setMessage("บันทึกรูปหน้าเว็บแล้ว");
    } catch (e) { setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/60 bg-white/40 p-4">
      <div>
        <p className="text-xs font-black text-[#4d47b6]">แบนเนอร์หน้าเว็บ</p>
        <AppGalleryCameraFileInputs galleryInputRef={bannerRef} cameraInputRef={bannerCamera.cameraInputRef} onChange={pickBanner} />
        <div className="mt-2 flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            disabled={busy}
            onPickGallery={() => bannerRef.current?.click()}
            onPickCamera={() => bannerCamera.openCamera(async (file) => {
              setBusy(true);
              try { setBanner(await upload(file)); } finally { setBusy(false); }
            })}
            labels={{ gallery: "เลือกแบนเนอร์", camera: "ถ่ายแบนเนอร์" }}
          />
          <button type="button" className="min-h-11 rounded-xl border border-white/70 bg-white/80 px-3 text-xs font-black text-[#4d47b6]" onClick={() => setBanner(banner ? "" : PARKING_PORTAL_SAMPLE_BANNER)}>
            {banner ? "ลบแบนเนอร์" : "ใช้รูปตัวอย่าง"}
          </button>
        </div>
        {banner ? <button type="button" onClick={() => lightbox.open(banner)} className="mt-3 h-36 w-full overflow-hidden rounded-2xl"><img src={banner} alt="แบนเนอร์" className="h-full w-full object-cover" /></button> : null}
        {bannerCamera.cameraModal}
      </div>
      <div>
        <p className="text-xs font-black text-[#4d47b6]">แกลเลอรี ({gallery.length}/{PARKING_PORTAL_GALLERY_MAX})</p>
        <AppGalleryCameraFileInputs galleryInputRef={galleryRef} cameraInputRef={galleryCamera.cameraInputRef} onChange={pickGallery} galleryMultiple />
        <div className="mt-2 flex flex-wrap gap-2">
          <AppImagePickCameraButtons
            disabled={busy || gallery.length >= PARKING_PORTAL_GALLERY_MAX}
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => galleryCamera.openCamera(async (file) => {
              setBusy(true);
              try {
                const url = await upload(file);
                setGallery((old) => [...old, url].slice(0, PARKING_PORTAL_GALLERY_MAX));
              } finally { setBusy(false); }
            })}
            labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป" }}
          />
          {!gallery.length ? <button type="button" className="min-h-11 rounded-xl border border-white/70 bg-white/80 px-3 text-xs font-black text-[#4d47b6]" onClick={() => setGallery([...PARKING_PORTAL_SAMPLE_GALLERY])}>ใช้รูปตัวอย่าง</button> : null}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {gallery.map((src, index) => <div key={`${src}-${index}`} className="relative"><AppImageThumb src={src} alt={`ภาพ ${index + 1}`} className="h-20 w-full" onOpen={() => lightbox.openGallery(gallery, index)} /><button type="button" aria-label={`ลบรูป ${index + 1}`} className="absolute -right-1 -top-1 min-h-8 min-w-8 rounded-full bg-rose-50 text-rose-600 shadow" onClick={() => setGallery((old) => old.filter((_, i) => i !== index))}>×</button></div>)}
        </div>
        {galleryCamera.cameraModal}
      </div>
      {message ? <p className="text-sm font-bold text-[#4d47b6]">{message}</p> : null}
      <button type="button" disabled={busy} onClick={() => void save()} className="app-btn-primary min-h-11 rounded-xl px-5 text-sm font-black disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึกรูปหน้าเว็บ"}</button>
      <AppImageLightbox src={lightbox.src} sources={lightbox.sources} initialIndex={lightbox.initialIndex} onClose={lightbox.close} alt="รูปหน้าเว็บ" />
    </div>
  );
}
